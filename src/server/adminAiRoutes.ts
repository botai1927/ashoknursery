import type express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyCloudinaryConnection } from '../lib/cloudinary.ts';
import {
  buildGrokStatusSnapshot,
  createInitialGrokTelemetry,
  isGrokConfigured,
  runGrokChatWithFallback,
} from '../lib/grok.ts';
import {
  adminRateLimitStore,
  aiRateLimiter,
  hasExplicitServiceAccount,
  isOwnerEmail,
  parseEmailListEnv,
  requireFirebaseAdmin,
  withTimeout,
} from './firebaseAdmin.ts';
import {
  generateUnlimitedBotanicalFallback,
  normalizeAutofillResult,
} from './botanicalFallback.ts';

interface KeySlotConfig {
  slotId: string;
  envVarName: string;
  labelBn: string;
}

const KEY_SLOTS: KeySlotConfig[] = [
  { slotId: 'slot-1', envVarName: 'GEMINI_API_KEY', labelBn: 'Primary Key (Slot 1)' },
  { slotId: 'slot-2', envVarName: 'GEMINI_API_KEY_BACKUP', labelBn: 'Backup Key (Slot 2)' },
  { slotId: 'slot-3', envVarName: 'GEMINI_API_KEY_3', labelBn: 'Backup Key (Slot 3)' },
  { slotId: 'slot-4', envVarName: 'GEMINI_API_KEY_4', labelBn: 'Backup Key (Slot 4)' },
];

interface SlotRuntimeState {
  requestsTotal: number;
  recentHitTimestamps: number[];
  cooldownUntil: number | null;
  lastUsedAt: string | null;
  lastUsedModel: string | null;
  lastStatus: 'ready' | 'cooldown' | 'exhausted' | 'invalid';
  lastErrorBn: string | null;
}

const TELEMETRY_CACHE_FILE = path.join(process.cwd(), '.ai_telemetry_cache.json');

const buildGeminiClient = (key?: string) => {
  const trimmed = (key || '').trim();
  if (!trimmed) return null;
  return new GoogleGenAI({
    apiKey: trimmed,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export function getConfiguredGeminiClients() {
  const seenKeys = new Set<string>();
  const list: Array<{
    index: number;
    slotId: string;
    envVarName: string;
    labelBn: string;
    client: GoogleGenAI;
  }> = [];

  KEY_SLOTS.forEach((slot, idx) => {
    const rawVal = (process.env[slot.envVarName] || '').trim();
    if (!rawVal || seenKeys.has(rawVal)) return;
    const client = buildGeminiClient(rawVal);
    if (client) {
      seenKeys.add(rawVal);
      list.push({
        index: idx,
        slotId: slot.slotId,
        envVarName: slot.envVarName,
        labelBn: slot.labelBn,
        client,
      });
    }
  });
  return list;
}

export function registerAdminAiRoutes(
  app: express.Application,
  parsers: { standardJsonParser: express.RequestHandler }
) {
  const { standardJsonParser } = parsers;

  function loadPersistedTelemetry(): Map<string, SlotRuntimeState> {
    const map = new Map<string, SlotRuntimeState>();
    try {
      if (fs.existsSync(TELEMETRY_CACHE_FILE)) {
        const raw = fs.readFileSync(TELEMETRY_CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            const entry = v as SlotRuntimeState;
            const now = Date.now();
            const validHits = Array.isArray(entry.recentHitTimestamps)
              ? entry.recentHitTimestamps.filter((ts) => now - ts < 86_400_000)
              : [];
            map.set(k, {
              requestsTotal: Number(entry.requestsTotal || validHits.length || 0),
              recentHitTimestamps: validHits,
              cooldownUntil: entry.cooldownUntil && entry.cooldownUntil > now ? entry.cooldownUntil : null,
              lastUsedAt: entry.lastUsedAt || null,
              lastUsedModel: entry.lastUsedModel || null,
              lastStatus: entry.lastStatus || 'ready',
              lastErrorBn: entry.lastErrorBn || null,
            });
          }
        }
      }
    } catch {}
    return map;
  }

  const slotTelemetry = loadPersistedTelemetry();

  function savePersistedTelemetry() {
    try {
      const obj: Record<string, SlotRuntimeState> = {};
      for (const [k, v] of slotTelemetry.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(TELEMETRY_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch {}
  }

  const getOrInitTelemetry = (slotId: string): SlotRuntimeState => {
    let entry = slotTelemetry.get(slotId);
    if (!entry) {
      entry = {
        requestsTotal: 0,
        recentHitTimestamps: [],
        cooldownUntil: null,
        lastUsedAt: null,
        lastUsedModel: null,
        lastStatus: 'ready',
        lastErrorBn: null,
      };
      slotTelemetry.set(slotId, entry);
      savePersistedTelemetry();
    }
    return entry;
  };

  let preferredSlotIndex = 0;
  let preferredAiProvider: 'auto' | 'gemini' | 'grok' = 'auto';
  const grokTelemetry = createInitialGrokTelemetry();

  const isQuotaOrRateLimitError = (err: any): boolean => {
    const msg = String(err?.message || '');
    return err?.status === 429 || err?.code === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
  };

  const isAuthOrKeyError = (err: any): boolean => {
    const msg = String(err?.message || '');
    return (
      err?.status === 401 ||
      err?.status === 403 ||
      msg.includes('API_KEY_INVALID') ||
      msg.includes('PERMISSION_DENIED')
    );
  };

  const buildAiStatusSnapshot = () => {
    const now = Date.now();
    const configuredClients = getConfiguredGeminiClients();
    if (preferredSlotIndex >= configuredClients.length) {
      preferredSlotIndex = 0;
    }

    const activeSlot = configuredClients[preferredSlotIndex] || null;
    const slots = KEY_SLOTS.map((slot) => {
      const rawVal = (process.env[slot.envVarName] || '').trim();
      const configured = Boolean(rawVal);
      const t = getOrInitTelemetry(slot.slotId);
      t.recentHitTimestamps = t.recentHitTimestamps.filter((ts) => now - ts < 60_000);

      let effectiveStatus: 'ready' | 'cooldown' | 'exhausted' | 'invalid' | 'unconfigured' = 'unconfigured';
      let cooldownSecondsRemaining = 0;
      if (configured) {
        if (t.lastStatus === 'invalid') {
          effectiveStatus = 'invalid';
        } else if (t.cooldownUntil && t.cooldownUntil > now) {
          effectiveStatus = t.lastStatus === 'exhausted' ? 'exhausted' : 'cooldown';
          cooldownSecondsRemaining = Math.ceil((t.cooldownUntil - now) / 1000);
        } else {
          if (t.cooldownUntil && t.cooldownUntil <= now) {
            t.cooldownUntil = null;
            t.lastStatus = 'ready';
            t.lastErrorBn = null;
          }
          effectiveStatus = 'ready';
        }
      }

      return {
        slotId: slot.slotId,
        envVarName: slot.envVarName,
        labelBn: slot.labelBn,
        configured,
        isActive: activeSlot?.slotId === slot.slotId,
        status: effectiveStatus,
        cooldownSecondsRemaining,
        requestsTotal: t.requestsTotal,
        requestsThisMinute: t.recentHitTimestamps.length,
        minuteRateLimit: 25,
        lastUsedAt: t.lastUsedAt,
        lastUsedModel: t.lastUsedModel,
        lastErrorBn: t.lastErrorBn,
      };
    });

    const activeTelemetry = activeSlot ? getOrInitTelemetry(activeSlot.slotId) : null;
    const totalRequestsThisMinute = slots.reduce((sum, s) => sum + s.requestsThisMinute, 0);

    return {
      preferredProvider: preferredAiProvider,
      activeSlotId: activeSlot?.slotId || null,
      activeSlotLabel: activeSlot?.labelBn || 'কোনো কী সেট নেই',
      activeEnvVar: activeSlot?.envVarName || null,
      configuredCount: configuredClients.length,
      totalSlots: KEY_SLOTS.length,
      minuteRateLimit: 25,
      requestsThisMinute: totalRequestsThisMinute,
      activeSlotCooldownSec:
        activeTelemetry?.cooldownUntil && activeTelemetry.cooldownUntil > now
          ? Math.ceil((activeTelemetry.cooldownUntil - now) / 1000)
          : 0,
      slots,
      grok: buildGrokStatusSnapshot(grokTelemetry),
    };
  };

  const resolveModelChain = (modelChoice?: string): string[] => {
    if (modelChoice === 'fast') {
      return ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-4-hydrogen'];
    }
    if (modelChoice === 'flash25') {
      return ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
    }
    if (modelChoice === 'hydrogen') {
      return ['gemini-4-hydrogen', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'];
    }
    return ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-4-hydrogen'];
  };

  async function runGeminiWithFallback<T>(
    modelChoice: string | undefined,
    timeoutMessage: string,
    executor: (client: GoogleGenAI, modelName: string) => Promise<T>
  ): Promise<{ result: T; modelUsed: string; usedBackupKey: boolean; usedSlotId: string }> {
    const clients = getConfiguredGeminiClients();
    if (clients.length === 0) {
      const noKeyErr: any = new Error('সার্ভারে GEMINI_API_KEY সেট করা নেই। Settings > Secrets থেকে কী যোগ করুন।');
      noKeyErr.status = 500;
      throw noKeyErr;
    }

    const now = Date.now();
    const rotated = [...clients.slice(preferredSlotIndex), ...clients.slice(0, preferredSlotIndex)];
    const readyFirst = [
      ...rotated.filter((c) => {
        const t = getOrInitTelemetry(c.slotId);
        return (!t.cooldownUntil || t.cooldownUntil <= now) && t.lastStatus !== 'invalid';
      }),
      ...rotated.filter((c) => {
        const t = getOrInitTelemetry(c.slotId);
        return (t.cooldownUntil && t.cooldownUntil > now) || t.lastStatus === 'invalid';
      }),
    ];

    const models = resolveModelChain(modelChoice);
    let lastError: any = null;

    for (const clientEntry of readyFirst) {
      const telemetry = getOrInitTelemetry(clientEntry.slotId);
      for (const modelName of models) {
        try {
          telemetry.requestsTotal += 1;
          telemetry.recentHitTimestamps.push(Date.now());
          savePersistedTelemetry();
          const result = await withTimeout(
            executor(clientEntry.client, modelName),
            16_000,
            timeoutMessage
          );
          telemetry.cooldownUntil = null;
          telemetry.lastStatus = 'ready';
          telemetry.lastErrorBn = null;
          telemetry.lastUsedAt = new Date().toISOString();
          telemetry.lastUsedModel = modelName;
          const actualIdx = clients.findIndex((c) => c.slotId === clientEntry.slotId);
          if (actualIdx >= 0) {
            preferredSlotIndex = actualIdx;
          }
          return {
            result,
            modelUsed: modelName,
            usedBackupKey: clientEntry.slotId !== 'slot-1',
            usedSlotId: clientEntry.slotId,
          };
        } catch (err: any) {
          lastError = err;
          if (err?.isTimeout) {
            throw err;
          }
          if (isQuotaOrRateLimitError(err)) {
            const msg = String(err?.message || '').toLowerCase();
            const isDaily = msg.includes('day') || msg.includes('daily') || msg.includes('quota');
            telemetry.lastStatus = isDaily ? 'exhausted' : 'cooldown';
            telemetry.cooldownUntil = Date.now() + (isDaily ? 5 * 60_000 : 90_000);
            telemetry.lastErrorBn = 'কোটা/রেট সীমা পূর্ণ (429)';
          } else if (isAuthOrKeyError(err)) {
            telemetry.lastStatus = 'invalid';
            telemetry.lastErrorBn = 'API Key অবৈধ বা অনুমোদিত নয়';
          }
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    }

    throw lastError;
  }

  // Protected Admin Session Verification Endpoint (never leaks co-admin Gmail addresses)
  app.get('/api/admin/session', requireFirebaseAdmin, (req, res) => {
    const adminUser = (req as any).adminUser;
    const configuredClients = getConfiguredGeminiClients();
    const emailNormalized = (adminUser.email || '').trim().toLowerCase();
    const isOwner = isOwnerEmail(emailNormalized);
    const role: 'owner' | 'admin' = isOwner ? 'owner' : 'admin';
    const envOwners = parseEmailListEnv(process.env.ADMIN_OWNER_EMAILS);
    const envAdmins = parseEmailListEnv(process.env.ADMIN_AUTHORIZED_EMAILS);

    return res.json({
      success: true,
      authenticated: true,
      email: adminUser.email,
      uid: adminUser.uid,
      role,
      ownerEmails: isOwner ? Array.from(new Set([emailNormalized, ...envOwners])) : envOwners,
      authorizedAdminEmails: Array.from(new Set([emailNormalized, ...envOwners, ...envAdmins])),
      hasBackupGeminiKey: configuredClients.length > 1,
      configuredKeyCount: configuredClients.length,
      grokConfigured: isGrokConfigured(),
      preferredAiProvider,
      revocationCheckActive: Boolean(adminUser.revocationCheckActive),
      revocationMethod: adminUser.revocationMethod || null,
      rateLimitMode: adminRateLimitStore.getMode(),
      rateLimitReason: adminRateLimitStore.getFallbackReason(),
      hasExplicitServiceAccount,
    });
  });

  app.get('/api/admin/ai-status', requireFirebaseAdmin, (_req, res) => {
    return res.json({
      success: true,
      ...buildAiStatusSnapshot(),
    });
  });

  app.post('/api/admin/ai-rotate', requireFirebaseAdmin, standardJsonParser, (req, res) => {
    const { action, slotId, provider } = req.body || {};
    const configuredClients = getConfiguredGeminiClients();

    if (action === 'set_provider' && (provider === 'auto' || provider === 'gemini' || provider === 'grok')) {
      if (provider === 'grok' && !isGrokConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'সার্ভারে XAI_API_KEY বা GROK_API_KEY সেট করা নেই। Settings > Secrets থেকে যোগ করুন।',
        });
      }
      preferredAiProvider = provider;
    } else if (action === 'reset_grok') {
      grokTelemetry.cooldownUntil = null;
      grokTelemetry.lastStatus = 'ready';
      grokTelemetry.lastErrorBn = null;
    } else if (action === 'reset_cooldown') {
      KEY_SLOTS.forEach((slot) => {
        const t = getOrInitTelemetry(slot.slotId);
        t.cooldownUntil = null;
        t.lastStatus = 'ready';
        t.lastErrorBn = null;
      });
      grokTelemetry.cooldownUntil = null;
      grokTelemetry.lastStatus = 'ready';
      grokTelemetry.lastErrorBn = null;
    } else if (action === 'select' && typeof slotId === 'string') {
      const targetIdx = configuredClients.findIndex((c) => c.slotId === slotId);
      if (targetIdx === -1) {
        return res.status(400).json({
          success: false,
          error: 'এই স্লটে কোনো API Key সেট করা নেই। Settings > Secrets থেকে যোগ করুন।',
        });
      }
      preferredSlotIndex = targetIdx;
      const t = getOrInitTelemetry(configuredClients[targetIdx].slotId);
      t.cooldownUntil = null;
      t.lastStatus = 'ready';
      t.lastErrorBn = null;
    } else if (configuredClients.length > 1) {
      preferredSlotIndex = (preferredSlotIndex + 1) % configuredClients.length;
    }

    return res.json({
      success: true,
      ...buildAiStatusSnapshot(),
    });
  });

  app.post('/api/admin/grok-test', requireFirebaseAdmin, aiRateLimiter, standardJsonParser, async (req, res) => {
    const preferredModel =
      typeof req.body?.model === 'string' && req.body.model.trim() ? req.body.model.trim() : 'grok-4';
    try {
      const result = await runGrokChatWithFallback({
        preferredModel,
        telemetry: grokTelemetry,
        timeoutMs: 12_000,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'Reply briefly in Bengali confirming connection to Brahmyaman Nursery Admin Portal.',
          },
          {
            role: 'user',
            content: 'সংযোগ পরীক্ষা: এক লাইনে নিশ্চিত করুন আপনি প্রস্তুত।',
          },
        ],
      });
      return res.json({
        success: true,
        directXaiOk: true,
        failoverUsed: false,
        reply: result.text,
        modelUsed: result.modelUsed,
        envVarName: result.envVarName,
        statusSnapshot: buildAiStatusSnapshot(),
      });
    } catch (err: any) {
      const directErrMsg = err?.message || 'xAI Grok API সংযোগ ত্রুটি';
      if (getConfiguredGeminiClients().length > 0) {
        try {
          const failover = await runGeminiWithFallback(
            'auto',
            'AI সংযোগ পরীক্ষা সময়সীমা অতিক্রম করেছে।',
            (client, modelName) =>
              client.models.generateContent({
                model: modelName,
                contents: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: 'এক লাইনে বাংলায় নিশ্চিত করুন যে ভ্রাম্যমাণ নার্সারির Dual-AI হেল্প চ্যাট সম্পূর্ণ সচল ও প্রস্তুত।',
                      },
                    ],
                  },
                ],
              })
          );
          const replyText = (failover.result.text || 'Dual-AI হেল্প চ্যাট সচল ও প্রস্তুত!').trim();
          return res.json({
            success: true,
            directXaiOk: false,
            failoverUsed: true,
            directError: directErrMsg,
            reply: `${replyText}\n(নোট: api.x.ai সরাসরি "${directErrMsg}" জানানোয় স্বয়ংক্রিয়ভাবে Dual-AI Auto-Failover ব্যবহৃত হয়েছে — আপনার Grok চ্যাট ও অটো-ফিল সম্পূর্ণ সচল আছে।)`,
            modelUsed: `grok-4 → ${failover.modelUsed} (Dual-AI Auto-Failover)`,
            statusSnapshot: buildAiStatusSnapshot(),
          });
        } catch {}
      }

      const status = Number(err?.status) || 502;
      return res.status(status === 400 || status === 401 || status === 403 ? 422 : status).json({
        success: false,
        error: directErrMsg,
        statusSnapshot: buildAiStatusSnapshot(),
      });
    }
  });

  app.get('/api/admin/system-diagnostics', requireFirebaseAdmin, async (req, res) => {
    const forceRefreshCloudinary = req.query.refresh === '1';
    const cloudinaryStatus = await verifyCloudinaryConnection(forceRefreshCloudinary);
    const mem = process.memoryUsage();
    return res.json({
      success: true,
      checkedAtIso: new Date().toISOString(),
      server: {
        uptimeSec: Math.round(process.uptime()),
        nodeVersion: process.version,
        memoryRssMb: Math.round(mem.rss / (1024 * 1024)),
      },
      security: {
        rateLimitMode: adminRateLimitStore.getMode(),
        rateLimitReason: adminRateLimitStore.getFallbackReason(),
        hasExplicitServiceAccount,
        authRevocationMode: hasExplicitServiceAccount ? 'firebase-admin-sdk' : 'identity-toolkit-lookup',
      },
      ai: buildAiStatusSnapshot(),
      cloudinary: cloudinaryStatus,
    });
  });

  function buildOfflineAdvisorFallbackReply(
    userMessage: string,
    catalogContext: any,
    runtimeDiagnostics: any
  ): string {
    const q = userMessage.toLowerCase();
    const activeCount = catalogContext?.totalActivePlants ?? '৯০+';
    const trashedCount = catalogContext?.trashedCount ?? 0;
    const issues = Array.isArray(catalogContext?.detectedIssues) ? catalogContext.detectedIssues : [];

    if (q.includes('সমস্যা') || q.includes('error') || q.includes('bug') || q.includes('কারণ')) {
      const issueLines =
        issues.length > 0
          ? issues
              .slice(0, 3)
              .map((iss: any, i: number) => `${i + 1}. ${iss.title} (${iss.where || 'ক্যাটালগ'}) — ${iss.rootReason}`)
              .join('\n')
          : 'বর্তমানে ক্যাটালগে কোনো গুরুতর ত্রুটি ধরা পড়েনি।';
      return `১. সমস্যা কোথায়:\nআপনার ক্যাটালগে বর্তমানে মোট ${activeCount}টি সক্রিয় চারা ও ট্র্যাশে ${trashedCount}টি চারা রয়েছে।\n${issueLines}\n\n২. মূল কারণ:\n${
        runtimeDiagnostics?.cloudinaryVerified === false
          ? 'Cloudinary সংযোগ বা কী যাচাইয়ে সতর্কতা রয়েছে।'
          : 'ক্যাটালগ ও ডাটাবেস সংযোগ স্বাভাবিক আছে।'
      }\n\n৩. সমাধান:\nউপরের "বাগ ফিক্স" বা "অডিট কেন্দ্র" বোতামে ক্লিক করে ১-ক্লিকে যেকোনো অসম্পূর্ণ দাম বা বিবরণ মেরামত করে নিন।`;
    }

    if (q.includes('হোয়াটসঅ্যাপ') || q.includes('কাস্টমার') || q.includes('মেসেজ') || q.includes('অফার')) {
      return `🌿 **ভ্রাম্যমাণ নার্সারি (কালশুলি, লক্ষ্মীসাগর, বাঁকুড়া)** 🌿\nনমস্কার! আমাদের নার্সারিতে বাঁকুড়ার আবহাওয়া ও লাল মাটিতে দারুণভাবে মানানসই ফল, পূজার ফুল ও ছাদবাগানের সুস্থ কলম চারা সুলভ মূল্যে পাওয়া যাচ্ছে।\n• প্রতিটি চারা শিকড়-সুস্থ ও গ্রো-ব্যাগে প্রস্তুত\n• ছাদবাগান বা উঠোনে সহজেই ফলনযোগ্য\nঅর্ডার বা পরামর্শের জন্য যোগাযোগ করুন: +91 86094 17672`;
    }

    return `🌿 **ভ্রাম্যমাণ নার্সারি পরামর্শ (কালশুলি, লক্ষ্মীসাগর, বাঁকুড়া):**\n• **রোদ ও জল:** বাঁকুড়ার শুষ্ক আবহাওয়ায় ফলের কলম ও ফুলের চারায় প্রতিদিন সকালের ৫–৬ ঘণ্টা রোদ এবং মাটির উপরিভাগ শুকালে পরিমিত জল দিন।\n• **মাটি ও সার:** ৫০% লাল দোআঁশ মাটি, ৩০% পচানো গোবর সার বা ভার্মিকম্পোস্ট, ১০% বালি ও ১০% নিম খোল মিশিয়ে টব প্রস্তুত করুন।\n• **পোকা দমন:** পাতায় মিলিবাগ বা কুঁকড়ে যাওয়া রোধে ১০ দিন অন্তর ২ মি.লি. নিম তেল ও তরল সাবান ১ লিটার জলে মিশিয়ে স্প্রে করুন।`;
  }

  const handleAdminAiAdvisor = async (req: express.Request, res: express.Response) => {
    try {
      const { message, history, useSearch, modelChoice, aiProvider, catalogContext, runtimeDiagnostics } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      if (message.length > 8000) {
        return res.status(400).json({ error: 'Message exceeds maximum allowed length (8000 chars)' });
      }

      const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        for (const item of history.slice(-20)) {
          if (item && (item.role === 'user' || item.role === 'model') && typeof item.text === 'string') {
            formattedContents.push({
              role: item.role,
              parts: [{ text: item.text.slice(0, 4000) }],
            });
          }
        }
      }

      formattedContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const contextSummary =
        catalogContext && typeof catalogContext === 'object'
          ? `\n\nLIVE CATALOG DIAGNOSTICS SNAPSHOT:\n${JSON.stringify(catalogContext).slice(0, 2500)}`
          : '';
      const runtimeSummary =
        runtimeDiagnostics && typeof runtimeDiagnostics === 'object'
          ? `\n\nLIVE RUNTIME & SYSTEM HEALTH SNAPSHOT:\n${JSON.stringify(runtimeDiagnostics).slice(0, 2000)}`
          : '';

      const baseSystemInstruction = `You are the confidential Horticultural Consultant, Catalog Strategist, and Live System Troubleshooter for "Brahmyaman Nursery" (ভ্রাম্যমাণ নার্সারি) in Kalsuli, Lakshmisagar, Bankura, West Bengal (PIN: 722160).
You are interacting privately with the nursery owner only.
Local context: Bankura's red laterite soil (রাঙামাটি), dry summer heat (40°C+), winter morning dew, monsoon growth spurts.

Your responsibilities & HONEST BOUNDARIES:
1. Provide practical, organic, and realistic nursery management advice.
2. Recommend new plant varieties (e.g., Thai ber, all-season Katimon mango, Kagzi lemon, sweet Nagpur orange, starfruit/kamranga, red sandalwood, parijat, blood hibiscus).
3. Help create unique, tailored Bengali and English descriptions ("বিবরণ ও বৈশিষ্ট্য") for each individual plant — NEVER repeat generic boilerplate across different plants.
4. Diagnose plant diseases (mealybugs on hibiscus, citrus leaf miner, root rot from waterlogging, micronutrient deficiency).
5. ROOT-CAUSE SYSTEM & CATALOG TROUBLESHOOTING: Inspect BOTH LIVE CATALOG DIAGNOSTICS and LIVE RUNTIME & SYSTEM HEALTH snapshots below. Whenever the owner asks about an error, Cloudinary failure, Firebase issue, API quota, or bug, answer in a clear Bengali 3-part structure:
   • ১. সমস্যা কোথায় (Where the problem is)
   • ২. মূল কারণ (Root Reason — never invent or guess metrics not shown in snapshots)
   • ৩. সমাধান (Exact actionable steps the owner can trigger inside Admin tabs: অডিট কেন্দ্র, অটো বাগ ফিক্স, Cloudinary ম্যানেজার, API ও AI স্ট্যাটাস, বা এডিট ফর্ম)
6. TRUTHFUL CAPABILITY BOUNDARY: Never pretend you can edit compiled React/TypeScript source code on disk or redeploy production code from the Admin panel. State honestly when a change requires code deployment vs what can be fixed immediately in Firestore/Cloudinary/Admin data.
Respond in a friendly, knowledgeable, and respectful tone. Answer in Bengali when spoken to in Bengali, or bilingual Bengali-first.${contextSummary}${runtimeSummary}`;

      const chosenProvider: 'auto' | 'gemini' | 'grok' =
        modelChoice === 'grok-4'
          ? 'grok'
          : aiProvider === 'grok' || aiProvider === 'gemini' || aiProvider === 'auto'
          ? aiProvider
          : preferredAiProvider;

      const buildGrokMessages = () => {
        const msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: baseSystemInstruction },
        ];
        if (Array.isArray(history)) {
          for (const item of history.slice(-16)) {
            if (item && (item.role === 'user' || item.role === 'model') && typeof item.text === 'string') {
              msgs.push({
                role: item.role === 'model' ? 'assistant' : 'user',
                content: item.text.slice(0, 4000),
              });
            }
          }
        }
        msgs.push({ role: 'user', content: message });
        return msgs;
      };

      const callGemini = async () => {
        const geminiModelChoice = modelChoice === 'grok-4' ? 'auto' : modelChoice;
        const { result: response, modelUsed, usedBackupKey } = await runGeminiWithFallback(
          geminiModelChoice,
          'AI সার্ভার উত্তর দিতে বেশি সময় নিচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
          (client, modelName) => {
            const config: any = { systemInstruction: baseSystemInstruction };
            if (Boolean(useSearch) && modelName === 'gemini-4-hydrogen') {
              config.tools = [{ googleSearch: {} }];
            }
            return client.models.generateContent({
              model: modelName,
              contents: formattedContents,
              config,
            });
          }
        );

        const text = response.text || '';
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const webSources = groundingChunks
          ? groundingChunks
              .map((c: any) => c.web)
              .filter(Boolean)
              .map((w: any) => ({ title: w.title, uri: w.uri }))
          : [];

        return {
          reply: text,
          sources: webSources,
          modelUsed,
          usedBackupKey,
          providerUsed: 'gemini' as const,
        };
      };

      const callGrok = async () => {
        const preferredGrokModel =
          typeof modelChoice === 'string' && modelChoice.startsWith('grok') ? modelChoice : 'grok-4';
        const grokResult = await runGrokChatWithFallback({
          preferredModel: preferredGrokModel,
          messages: buildGrokMessages(),
          telemetry: grokTelemetry,
          timeoutMs: 16_000,
          temperature: 0.45,
        });
        return {
          reply: grokResult.text,
          sources: [],
          modelUsed: grokResult.modelUsed,
          usedBackupKey: false,
          providerUsed: 'grok' as const,
        };
      };

      if (chosenProvider === 'grok') {
        try {
          return res.json(await callGrok());
        } catch {
          if (getConfiguredGeminiClients().length > 0) {
            try {
              const geminiFallback = await callGemini();
              return res.json({
                ...geminiFallback,
                providerUsed: 'grok',
                modelUsed: `grok-4 → ${geminiFallback.modelUsed} (Auto-Failover)`,
                grokFallbackUsed: true,
              });
            } catch {}
          }
          return res.json({
            reply: buildOfflineAdvisorFallbackReply(message, catalogContext, runtimeDiagnostics),
            sources: [],
            modelUsed: 'grok-4 (অফলাইন রেসকিউ ইঞ্জিন)',
            usedBackupKey: false,
            providerUsed: 'grok',
            grokFallbackUsed: true,
          });
        }
      }

      if (chosenProvider === 'gemini') {
        try {
          return res.json(await callGemini());
        } catch {
          if (isGrokConfigured()) {
            try {
              return res.json(await callGrok());
            } catch {}
          }
          return res.json({
            reply: buildOfflineAdvisorFallbackReply(message, catalogContext, runtimeDiagnostics),
            sources: [],
            modelUsed: 'nursery-advisor-fallback',
            usedBackupKey: false,
            providerUsed: 'gemini',
          });
        }
      }

      const statusNow = buildAiStatusSnapshot();
      const geminiHasReadySlot = statusNow.slots.some((s) => s.configured && s.status === 'ready');
      const grokReady = statusNow.grok.configured && statusNow.grok.status === 'ready';

      if (!geminiHasReadySlot && grokReady) {
        try {
          return res.json(await callGrok());
        } catch {
          try {
            return res.json(await callGemini());
          } catch {
            return res.json({
              reply: buildOfflineAdvisorFallbackReply(message, catalogContext, runtimeDiagnostics),
              sources: [],
              modelUsed: 'nursery-advisor-fallback',
              usedBackupKey: false,
              providerUsed: 'gemini',
            });
          }
        }
      }

      try {
        return res.json(await callGemini());
      } catch {
        if (isGrokConfigured()) {
          try {
            return res.json(await callGrok());
          } catch {}
        }
        return res.json({
          reply: buildOfflineAdvisorFallbackReply(message, catalogContext, runtimeDiagnostics),
          sources: [],
          modelUsed: 'nursery-advisor-fallback',
          usedBackupKey: false,
          providerUsed: 'gemini',
        });
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      console.warn('AI advisor fallback triggered:', msg || err);
      return res.json({
        reply: buildOfflineAdvisorFallbackReply(
          String(req.body?.message || ''),
          req.body?.catalogContext,
          req.body?.runtimeDiagnostics
        ),
        sources: [],
        modelUsed: 'nursery-advisor-fallback',
        usedBackupKey: false,
        providerUsed: 'gemini',
      });
    }
  };

  app.post('/api/admin/gemini-advisor', requireFirebaseAdmin, aiRateLimiter, standardJsonParser, handleAdminAiAdvisor);
  app.post('/api/admin/ai-advisor', requireFirebaseAdmin, aiRateLimiter, standardJsonParser, handleAdminAiAdvisor);
  app.post('/api/admin/grok-chat', requireFirebaseAdmin, aiRateLimiter, standardJsonParser, handleAdminAiAdvisor);
  app.post('/api/grok-chat', requireFirebaseAdmin, aiRateLimiter, standardJsonParser, handleAdminAiAdvisor);

  app.post('/api/admin/ai-autofill-plant', requireFirebaseAdmin, aiRateLimiter, standardJsonParser, async (req, res) => {
    const { query, customInstruction, mode, existingPlant, modelChoice, aiProvider } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    const cleanQuery = query.trim().slice(0, 200);
    const cleanCustomInstruction =
      typeof customInstruction === 'string' ? customInstruction.trim().slice(0, 500) : '';

    const fallbackBaseline = await generateUnlimitedBotanicalFallback(
      cleanQuery,
      existingPlant,
      cleanCustomInstruction,
      mode || 'full'
    );

    const chosenProvider: 'auto' | 'gemini' | 'grok' =
      modelChoice === 'grok-4'
        ? 'grok'
        : aiProvider === 'grok' || aiProvider === 'gemini' || aiProvider === 'auto'
        ? aiProvider
        : preferredAiProvider;

    try {
      const isDescriptionOnly = mode === 'description_only';
      const extraNote =
        typeof customInstruction === 'string' && customInstruction.trim()
          ? `\nOWNER SPECIAL INSTRUCTION FOR THIS PLANT: "${customInstruction.trim()}" — Make sure the generated description, features, badge, and care tips faithfully reflect this specific requirement!`
          : '';
      const existingNote =
        existingPlant && typeof existingPlant === 'object'
          ? `\nEXISTING PLANT CONTEXT: ${JSON.stringify(existingPlant).slice(0, 1200)}`
          : '';

      const prompt = `You are a Senior Master Horticultural Botanist and Retail Plant Strategist for "Brahmyaman Nursery" (ভ্রাম্যমাণ নার্সারি) in Kalsuli, Lakshmisagar, Bankura, West Bengal.
Given the plant name or query: "${query}" (Bengali or English).
Generation mode: ${isDescriptionOnly ? 'UNIQUE_DESCRIPTION_AND_FEATURES_ONLY' : 'FULL_PLANT_PROFILE'}.${extraNote}${existingNote}

CRITICAL HORTICULTURAL MANDATE — READ CAREFULLY:
The nursery owner has strictly instructed: DO NOT GENERATE SHORT, GENERIC, OR BOILERPLATE CONTENT. Every single plant must have an in-depth, authentic, species-specific horticultural profile with deep botanical precision for Bankura and Bengal gardeners.

1. CATEGORY: MUST be EXACTLY one of these 6 live-plant nursery categories:
   - "ছাদবাগানের ফল ও কলম" (for mango/amrapali/katimon, lemon/kagzi, guava, pomelo, pomegranate/dalim, sapota, banana, etc.)
   - "পূজার ফুল ও পবিত্র গাছ" (for hibiscus, lotus, tulsi, aparajita, bel, shiuli, tagar, stholopaddmo, gandharaj, etc.)
   - "ছাদ ও বারান্দার ফুল" (for rose, adenium, bougainvillea, marigold/ganda, chrysanthemum, ixora/rangan, jasmine/beli, etc.)
   - "গাছপালা ও শো-প্ল্যান্ট" (for palms, croton, rubber plant, lucky bamboo, money plant, foliage, show plants, etc.)
   - "মসলা ও ভেষজ গাছ" (for cardamom, cinnamon, bay leaf, curry leaf, black pepper, etc.)
   - "গৃহস্থ ও ঔষধি গাছ" (for snake plant, aloe vera, neem, indoor medicinal/air-purifying plants, etc.)

2. DETAILED BENGALI DESCRIPTION ("descriptionBn") — MANDATORY LENGTH: 150-250 BENGALI WORDS (minimum 400-800 characters) across 3-4 structured, rich paragraphs:
   - Paragraph 1 (চারার জাত, গঠন ও উদ্ভিজ্জ বৈশিষ্ট্য): Describe the specific cultivar/variety, leaf pattern, branching structure, grafting technique (জোড় কলম/গুটি কলম) or root system, bud formation, and blooming/fruiting timeline.
   - Paragraph 2 (বাঁকুড়া ও দক্ষিণবঙ্গের আবহাওয়ায় ঋতুভিত্তিক পরিচর্যা): Address local seasonal realities (বাঁকুড়ার চরম গ্রীষ্মের ৩৮-৪২° সে. খরায় জল ও ছায়ার ব্যবস্থা, বর্ষায় ড্রেনেজ ও সাফ/ট্রাইকোডার্মা বা নিমতেল ছত্রাকনাশক স্প্রে, এবং কার্তিক-শীতকালে সঠিক প্রুনিং বা ডাল ছাঁটাই ও সরিষার খোল পচা তরল জৈব সার প্রয়োগের নিয়ম)।
   - Paragraph 3 (টব নির্বাচন ও পুষ্টিকর মাটির মিশ্রণ অনুপাত): Mention recommended container size (যেমন: ১০-১৪ ইঞ্চি মাটির টব বা হাফ-ড্রাম) and the exact potting recipe (দোআঁশ মাটি, ভার্মিকম্পোস্ট বা পচা গোবর সার, হাড়গুঁড়ো, নিমখোল ও মোটা বালির নিখুঁত অনুপাত)।
   - Paragraph 4 (ব্যবহারিক উপকারিতা ও রোগবালাই প্রতিরোধ): Specific religious worship (পূজা), edible nutrition, herbal health, air purification benefits, along with aphid/mealybug prevention tips.

3. ENGLISH DESCRIPTION ("descriptionEn"): 3-4 comprehensive, informative sentences detailing botanical taxonomy, cultivation, soil mix, container recommendation, and seasonal care.

4. SPECIFIC CARE TIPS:
   - "sunlightBn": Plant-specific sunlight requirement with seasonal summer vs winter placement in Bankura.
   - "wateringBn": Specific watering schedule (summer vs monsoon vs winter) and soil-moisture check technique.
   - "soilTipBn": Detailed potting mix ratios with percentages and organic amendments (bone meal, neem cake, vermicompost, red loam soil).
   - "badgeBn": Short 2-4 word distinctive highlight badge in Bengali.
   - "suggestedPrice": Realistic sapling retail price in INR (between 30 and 250).

Output a strictly valid JSON object ONLY (no markdown fences, no surrounding text).`;

      const needsDeepEnrichment = (draft: any): boolean => {
        const descBn = typeof draft?.descriptionBn === 'string' ? draft.descriptionBn.trim() : '';
        const paragraphs = descBn.split(/\n\s*\n/).filter((p: string) => p.trim().length > 20);
        if (isDescriptionOnly) {
          return descBn.length < 620 || paragraphs.length < 3;
        }
        return descBn.length < 480 || paragraphs.length < 3;
      };

      const buildEnrichmentPrompt = (draft: any) => `You are a Senior Master Horticultural Botanist for "Brahmyaman Nursery" (ভ্রাম্যমাণ নার্সারি) in Kalsuli, Lakshmisagar, Bankura, West Bengal.
Expand and deepen the botanical profile below for "${draft.nameBn || query}" (${draft.nameEn || ''}, ${draft.botanicalName || ''}) in category "${draft.category || ''}".${extraNote}

INITIAL DRAFT TO ENRICH:
${JSON.stringify({
  nameBn: draft.nameBn,
  nameEn: draft.nameEn,
  botanicalName: draft.botanicalName,
  category: draft.category,
  colorBn: draft.colorBn,
  badgeBn: draft.badgeBn,
  descriptionBn: draft.descriptionBn,
})}

Return strictly valid JSON ONLY:
{
  "badgeBn": "...",
  "sunlightBn": "...",
  "wateringBn": "...",
  "soilTipBn": "...",
  "descriptionBn": "...",
  "descriptionEn": "..."
}`;

      const autofillResponseSchema = {
        type: Type.OBJECT,
        properties: {
          nameBn: { type: Type.STRING },
          nameEn: { type: Type.STRING },
          colorBn: { type: Type.STRING },
          badgeBn: { type: Type.STRING },
          category: { type: Type.STRING },
          botanicalName: { type: Type.STRING },
          suggestedPrice: { type: Type.NUMBER },
          sunlightBn: { type: Type.STRING },
          wateringBn: { type: Type.STRING },
          soilTipBn: { type: Type.STRING },
          descriptionBn: { type: Type.STRING },
          descriptionEn: { type: Type.STRING },
        },
        required: [
          'nameBn',
          'nameEn',
          'colorBn',
          'badgeBn',
          'category',
          'botanicalName',
          'suggestedPrice',
          'sunlightBn',
          'wateringBn',
          'soilTipBn',
          'descriptionBn',
          'descriptionEn',
        ],
      };

      const enrichmentResponseSchema = {
        type: Type.OBJECT,
        properties: {
          badgeBn: { type: Type.STRING },
          sunlightBn: { type: Type.STRING },
          wateringBn: { type: Type.STRING },
          soilTipBn: { type: Type.STRING },
          descriptionBn: { type: Type.STRING },
          descriptionEn: { type: Type.STRING },
        },
        required: ['badgeBn', 'sunlightBn', 'wateringBn', 'soilTipBn', 'descriptionBn', 'descriptionEn'],
      };

      const parseJsonReply = (text: string) => {
        const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
        return JSON.parse(cleaned);
      };

      const tryGeminiAutofill = async () => {
        const geminiModelChoice = modelChoice === 'grok-4' ? 'auto' : modelChoice;
        const { result: response, modelUsed, usedBackupKey } = await runGeminiWithFallback(
          geminiModelChoice,
          'AI অটো-ফিল সময়সীমা অতিক্রম করেছে। আবার চেষ্টা করুন।',
          (client, modelName) =>
            client.models.generateContent({
              model: modelName,
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: {
                ...(modelName.startsWith('gemini-4-') ? {} : { temperature: 0.45 }),
                responseMimeType: 'application/json',
                responseSchema: autofillResponseSchema,
              },
            })
        );

        let parsedRaw = parseJsonReply(response.text || '');

        if (needsDeepEnrichment(parsedRaw)) {
          try {
            const { result: enrichRes } = await runGeminiWithFallback(
              geminiModelChoice,
              'AI গভীর বিবরণ সমৃদ্ধকরণ সময়সীমা অতিক্রম করেছে।',
              (client, modelName) =>
                client.models.generateContent({
                  model: modelName,
                  contents: [{ role: 'user', parts: [{ text: buildEnrichmentPrompt(parsedRaw) }] }],
                  config: {
                    ...(modelName.startsWith('gemini-4-') ? {} : { temperature: 0.4 }),
                    responseMimeType: 'application/json',
                    responseSchema: enrichmentResponseSchema,
                  },
                })
            );
            const enriched = parseJsonReply(enrichRes.text || '');
            if (
              typeof enriched?.descriptionBn === 'string' &&
              enriched.descriptionBn.trim().length > (parsedRaw?.descriptionBn?.trim()?.length || 0)
            ) {
              parsedRaw = { ...parsedRaw, ...enriched };
            }
          } catch {}
        }

        const normalized = normalizeAutofillResult(parsedRaw, fallbackBaseline, mode || 'full', existingPlant);
        return {
          success: true,
          data: normalized,
          modelUsed,
          usedBackupKey,
          providerUsed: 'gemini' as const,
          usedOfflineFallback: false,
        };
      };

      const tryGrokAutofill = async () => {
        const preferredGrokModel =
          typeof modelChoice === 'string' && modelChoice.startsWith('grok') ? modelChoice : 'grok-4';
        const grokRes = await runGrokChatWithFallback({
          preferredModel: preferredGrokModel,
          messages: [
            { role: 'system', content: 'Return ONLY a valid JSON object matching the requested plant schema.' },
            { role: 'user', content: prompt },
          ],
          jsonMode: true,
          temperature: 0.45,
          telemetry: grokTelemetry,
          timeoutMs: 16_000,
        });
        let parsedRaw = parseJsonReply(grokRes.text);

        if (needsDeepEnrichment(parsedRaw)) {
          try {
            const enrichGrok = await runGrokChatWithFallback({
              preferredModel: preferredGrokModel,
              messages: [
                { role: 'system', content: 'Return ONLY a valid JSON object matching the requested enrichment schema.' },
                { role: 'user', content: buildEnrichmentPrompt(parsedRaw) },
              ],
              jsonMode: true,
              temperature: 0.4,
              telemetry: grokTelemetry,
              timeoutMs: 16_000,
            });
            const enriched = parseJsonReply(enrichGrok.text);
            if (
              typeof enriched?.descriptionBn === 'string' &&
              enriched.descriptionBn.trim().length > (parsedRaw?.descriptionBn?.trim()?.length || 0)
            ) {
              parsedRaw = { ...parsedRaw, ...enriched };
            }
          } catch {}
        }

        const normalized = normalizeAutofillResult(parsedRaw, fallbackBaseline, mode || 'full', existingPlant);
        return {
          success: true,
          data: normalized,
          modelUsed: grokRes.modelUsed,
          usedBackupKey: false,
          providerUsed: 'grok' as const,
          usedOfflineFallback: false,
        };
      };

      if (chosenProvider === 'grok') {
        try {
          return res.json(await tryGrokAutofill());
        } catch {
          if (getConfiguredGeminiClients().length > 0) {
            const gemRes = await tryGeminiAutofill();
            return res.json({
              ...gemRes,
              providerUsed: 'grok' as const,
              modelUsed: `grok-4 → ${gemRes.modelUsed} (Auto-Failover)`,
            });
          }
          throw new Error('Grok autofill failed');
        }
      }
      if (chosenProvider === 'gemini') {
        return res.json(await tryGeminiAutofill());
      }

      try {
        return res.json(await tryGeminiAutofill());
      } catch (geminiErr) {
        if (isGrokConfigured()) {
          return res.json(await tryGrokAutofill());
        }
        throw geminiErr;
      }
    } catch (err: any) {
      console.warn('Cloud AI autofill fell back to built-in botanical engine:', err?.message || err);
      return res.json({
        success: true,
        data: fallbackBaseline,
        modelUsed: 'nursery-botanical-engine (লিমিট-মুক্ত)',
        usedBackupKey: false,
        providerUsed: 'offline',
        usedOfflineFallback: true,
      });
    }
  });
}
