export const GROK_DEFAULT_MODELS = ['grok-4', 'grok-3-mini', 'grok-3', 'grok-2-latest'] as const;

export interface ResolvedGrokCredentials {
  configured: boolean;
  apiKey: string;
  envVarName: 'XAI_API_KEY' | 'GROK_API_KEY' | null;
}

export interface GrokKeySlotInfo {
  envVarName: 'XAI_API_KEY' | 'GROK_API_KEY';
  apiKey: string;
  maskedPreview: string;
}

export interface GrokTelemetryState {
  requestsTotal: number;
  recentHitTimestamps: number[];
  cooldownUntil: number | null;
  lastUsedAt: string | null;
  lastUsedModel: string | null;
  lastStatus: 'ready' | 'cooldown' | 'exhausted' | 'invalid';
  lastErrorBn: string | null;
}

export interface GrokStatusSnapshot {
  provider?: 'grok';
  configured: boolean;
  envVarName: 'XAI_API_KEY' | 'GROK_API_KEY' | null;
  configuredEnvVars: Array<'XAI_API_KEY' | 'GROK_API_KEY'>;
  maskedKeys: Array<{ envVarName: 'XAI_API_KEY' | 'GROK_API_KEY'; maskedPreview: string }>;
  acceptedEnvVars: string[];
  status: 'ready' | 'cooldown' | 'exhausted' | 'invalid' | 'unconfigured';
  cooldownSecondsRemaining: number;
  requestsTotal: number;
  requestsThisMinute: number;
  minuteRateLimit: number;
  lastUsedAt: string | null;
  lastUsedModel: string | null;
  lastErrorBn: string | null;
  availableModels: string[];
}

function stripSurroundingQuotes(raw: string): string {
  const trimmed = (raw || '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function maskKeyPreview(key: string): string {
  if (!key) return '';
  if (key.length <= 10) return `${key.slice(0, 2)}***`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

/**
 * Returns all configured server-side xAI Grok API keys from `XAI_API_KEY` and `GROK_API_KEY`
 * in priority order so the server can automatically try `GROK_API_KEY` if `XAI_API_KEY` fails.
 */
export function resolveAllGrokCredentials(
  env: Record<string, string | undefined> = process.env
): GrokKeySlotInfo[] {
  const slots: GrokKeySlotInfo[] = [];
  const seen = new Set<string>();

  const xaiVal = stripSurroundingQuotes(env.XAI_API_KEY || '');
  if (xaiVal && !seen.has(xaiVal)) {
    seen.add(xaiVal);
    slots.push({
      envVarName: 'XAI_API_KEY',
      apiKey: xaiVal,
      maskedPreview: maskKeyPreview(xaiVal),
    });
  }

  const grokVal = stripSurroundingQuotes(env.GROK_API_KEY || '');
  if (grokVal && !seen.has(grokVal)) {
    seen.add(grokVal);
    slots.push({
      envVarName: 'GROK_API_KEY',
      apiKey: grokVal,
      maskedPreview: maskKeyPreview(grokVal),
    });
  }

  return slots;
}

/**
 * Resolves the primary server-side xAI Grok API key from `XAI_API_KEY` or `GROK_API_KEY`.
 * Never exposes the secret value in telemetry snapshots.
 */
export function resolveGrokCredentials(
  env: Record<string, string | undefined> = process.env
): ResolvedGrokCredentials {
  const all = resolveAllGrokCredentials(env);
  if (all.length > 0) {
    return {
      configured: true,
      apiKey: all[0].apiKey,
      envVarName: all[0].envVarName,
    };
  }
  return {
    configured: false,
    apiKey: '',
    envVarName: null,
  };
}

export function isGrokConfigured(
  env: Record<string, string | undefined> = process.env
): boolean {
  return resolveAllGrokCredentials(env).length > 0;
}

export function createInitialGrokTelemetry(): GrokTelemetryState {
  return {
    requestsTotal: 0,
    recentHitTimestamps: [],
    cooldownUntil: null,
    lastUsedAt: null,
    lastUsedModel: null,
    lastStatus: 'ready',
    lastErrorBn: null,
  };
}

export function buildGrokStatusSnapshot(
  telemetry: GrokTelemetryState,
  env: Record<string, string | undefined> = process.env
): GrokStatusSnapshot {
  const now = Date.now();
  const allCreds = resolveAllGrokCredentials(env);
  const creds = resolveGrokCredentials(env);
  telemetry.recentHitTimestamps = telemetry.recentHitTimestamps.filter((ts) => now - ts < 60_000);

  let effectiveStatus: GrokStatusSnapshot['status'] = 'unconfigured';
  let cooldownSecondsRemaining = 0;

  if (creds.configured) {
    if (telemetry.lastStatus === 'invalid') {
      effectiveStatus = 'invalid';
    } else if (telemetry.cooldownUntil && telemetry.cooldownUntil > now) {
      effectiveStatus = telemetry.lastStatus === 'exhausted' ? 'exhausted' : 'cooldown';
      cooldownSecondsRemaining = Math.ceil((telemetry.cooldownUntil - now) / 1000);
    } else {
      if (telemetry.cooldownUntil && telemetry.cooldownUntil <= now) {
        telemetry.cooldownUntil = null;
        telemetry.lastStatus = 'ready';
        telemetry.lastErrorBn = null;
      }
      effectiveStatus = 'ready';
    }
  }

  return {
    provider: 'grok',
    configured: creds.configured,
    envVarName: creds.envVarName,
    configuredEnvVars: allCreds.map((c) => c.envVarName),
    maskedKeys: allCreds.map((c) => ({
      envVarName: c.envVarName,
      maskedPreview: c.maskedPreview,
    })),
    acceptedEnvVars: ['XAI_API_KEY', 'GROK_API_KEY'],
    status: effectiveStatus,
    cooldownSecondsRemaining,
    requestsTotal: telemetry.requestsTotal,
    requestsThisMinute: telemetry.recentHitTimestamps.length,
    minuteRateLimit: 25,
    lastUsedAt: telemetry.lastUsedAt,
    lastUsedModel: telemetry.lastUsedModel,
    lastErrorBn: telemetry.lastErrorBn,
    availableModels: [...GROK_DEFAULT_MODELS],
  };
}

export function isGrokQuotaOrRateError(status: number, message = ''): boolean {
  const lower = message.toLowerCase();
  return status === 429 || lower.includes('rate limit') || lower.includes('quota') || lower.includes('credits');
}

export function isGrokAuthError(status: number, message = ''): boolean {
  const lower = message.toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    lower.includes('invalid api key') ||
    lower.includes('incorrect api key') ||
    (status === 400 && lower.includes('api key'))
  );
}

export interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RunGrokChatParams {
  messages: GrokChatMessage[];
  temperature?: number;
  jsonMode?: boolean;
  preferredModel?: string;
  timeoutMs?: number;
  telemetry?: GrokTelemetryState;
  env?: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
}

export interface RunGrokChatResult {
  text: string;
  modelUsed: string;
  envVarName: 'XAI_API_KEY' | 'GROK_API_KEY';
}

export async function runGrokChatWithFallback(
  params: RunGrokChatParams
): Promise<RunGrokChatResult> {
  const allCreds = resolveAllGrokCredentials(params.env);
  if (allCreds.length === 0) {
    const err: any = new Error(
      'সার্ভারে Grok API Key (XAI_API_KEY বা GROK_API_KEY) সেট করা নেই। Settings > Secrets থেকে যোগ করুন।'
    );
    err.status = 503;
    err.code = 'GROK_UNCONFIGURED';
    throw err;
  }

  const telemetry = params.telemetry;
  const fetchImpl = params.fetchFn || fetch;
  const timeoutMs = params.timeoutMs ?? 16_000;

  const modelOrder = params.preferredModel
    ? [params.preferredModel, ...GROK_DEFAULT_MODELS.filter((m) => m !== params.preferredModel)]
    : [...GROK_DEFAULT_MODELS];

  let lastError: any = null;
  let allKeysFailedAuth = true;

  for (const cred of allCreds) {
    let thisKeyFailedAuth = false;

    for (const modelName of modelOrder) {
      try {
        if (telemetry) {
          telemetry.requestsTotal += 1;
          telemetry.recentHitTimestamps.push(Date.now());
        }

        const body: Record<string, any> = {
          model: modelName,
          messages: params.messages,
          temperature: params.temperature ?? 0.45,
        };
        if (params.jsonMode) {
          body.response_format = { type: 'json_object' };
        }

        const res = await fetchImpl('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cred.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });

        const payload: any = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errMsg =
            payload?.error?.message ||
            payload?.message ||
            (typeof payload?.error === 'string' ? payload.error : '') ||
            `xAI API error (${res.status})`;
          const err: any = new Error(String(errMsg));
          err.status = res.status;

          if (isGrokAuthError(res.status, err.message)) {
            thisKeyFailedAuth = true;
            lastError = err;
            // Break model loop for this key and try the next key (e.g. GROK_API_KEY after XAI_API_KEY)
            break;
          }

          allKeysFailedAuth = false;

          if (isGrokQuotaOrRateError(res.status, err.message)) {
            const isDailyOrCredit =
              err.message.toLowerCase().includes('credit') ||
              err.message.toLowerCase().includes('quota') ||
              err.message.toLowerCase().includes('exhausted');
            if (telemetry) {
              telemetry.lastStatus = isDailyOrCredit ? 'exhausted' : 'cooldown';
              telemetry.cooldownUntil = Date.now() + (isDailyOrCredit ? 5 * 60_000 : 90_000);
              telemetry.lastErrorBn = isDailyOrCredit
                ? 'Grok ক্রেডিট বা দৈনিক কোটা শেষ'
                : 'Grok রেট সীমা পূর্ণ (429)';
            }
            lastError = err;
            continue;
          }

          // Model not found (404) or transient 5xx: try next Grok model in cascade
          lastError = err;
          continue;
        }

        allKeysFailedAuth = false;
        const replyText = String(payload?.choices?.[0]?.message?.content || '').trim();
        if (!replyText) {
          const emptyErr: any = new Error('Grok API থেকে খালি উত্তর এসেছে।');
          emptyErr.status = 502;
          lastError = emptyErr;
          continue;
        }

        if (telemetry) {
          telemetry.cooldownUntil = null;
          telemetry.lastStatus = 'ready';
          telemetry.lastErrorBn = null;
          telemetry.lastUsedAt = new Date().toISOString();
          telemetry.lastUsedModel = modelName;
        }

        return {
          text: replyText,
          modelUsed: modelName,
          envVarName: cred.envVarName,
        };
      } catch (err: any) {
        lastError = err;
        if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
          allKeysFailedAuth = false;
          const tErr: any = new Error('Grok API উত্তর দিতে বেশি সময় নিচ্ছে। আবার চেষ্টা করুন।');
          tErr.isTimeout = true;
          tErr.status = 504;
          throw tErr;
        }
        if (isGrokAuthError(Number(err?.status || 0), String(err?.message || ''))) {
          thisKeyFailedAuth = true;
          break;
        }
        allKeysFailedAuth = false;
      }
    }

    if (thisKeyFailedAuth) {
      continue;
    }
  }

  if (allKeysFailedAuth && telemetry) {
    telemetry.lastStatus = 'invalid';
    telemetry.lastErrorBn =
      'সার্ভারের XAI_API_KEY / GROK_API_KEY কী-টি console.x.ai কর্তৃক অনুমোদিত নয় (Incorrect API key) — Dual-AI Auto-Failover সচল আছে';
  }

  throw lastError || new Error('Grok AI সংযোগে সমস্যা হয়েছে।');
}
