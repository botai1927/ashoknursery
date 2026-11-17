import crypto from 'node:crypto';
import type express from 'express';

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetEpochSec: number;
  retryAfterSec: number;
  backend: 'firestore-shared' | 'in-memory';
}

export interface RateLimitStore {
  checkAndRecord(
    bucket: string,
    key: string,
    windowMs: number,
    maxRequests: number
  ): Promise<RateLimitDecision>;
}

/**
 * Bounded process-local sliding-window store.
 * Serves as the primary limiter for high-frequency public routes (saving Firestore Spark writes)
 * and as an automatic fail-safe fallback when shared Firestore transactions are unavailable.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly hits = new Map<string, number[]>();
  private readonly maxTrackedKeys: number;
  private readonly nowFn: () => number;
  private opsSinceSweep = 0;

  constructor(options?: { maxTrackedKeys?: number; nowFn?: () => number }) {
    this.maxTrackedKeys = options?.maxTrackedKeys ?? 2000;
    this.nowFn = options?.nowFn ?? (() => Date.now());
  }

  getTrackedKeyCount(): number {
    return this.hits.size;
  }

  private pruneExpired(now: number, windowMs: number): void {
    for (const [k, list] of this.hits.entries()) {
      if (list.every((ts) => now - ts >= windowMs)) {
        this.hits.delete(k);
      }
    }
  }

  async checkAndRecord(
    bucket: string,
    key: string,
    windowMs: number,
    maxRequests: number
  ): Promise<RateLimitDecision> {
    const now = this.nowFn();
    const mapKey = `${bucket}:${key}`;
    const recent = (this.hits.get(mapKey) || []).filter((ts) => now - ts < windowMs);
    this.opsSinceSweep += 1;

    if (recent.length >= maxRequests) {
      this.hits.set(mapKey, recent);
      const oldestTs = recent[0] ?? now;
      const resetMs = oldestTs + windowMs;
      const retryAfterSec = Math.max(1, Math.ceil((resetMs - now) / 1000));
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetEpochSec: Math.ceil(resetMs / 1000),
        retryAfterSec,
        backend: 'in-memory',
      };
    }

    recent.push(now);
    this.hits.set(mapKey, recent);

    if (this.opsSinceSweep >= 200 || this.hits.size > this.maxTrackedKeys) {
      this.opsSinceSweep = 0;
      this.pruneExpired(now, windowMs);
      // Hard LRU cap if still oversized under burst attack
      while (this.hits.size > this.maxTrackedKeys) {
        const oldestKey = this.hits.keys().next().value;
        if (!oldestKey) break;
        this.hits.delete(oldestKey);
      }
    }

    const oldestTs = recent[0] ?? now;
    return {
      allowed: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - recent.length),
      resetEpochSec: Math.ceil((oldestTs + windowMs) / 1000),
      retryAfterSec: 0,
      backend: 'in-memory',
    };
  }
}

export interface FirestoreTransactionAdapter {
  runTransaction: <T>(
    updateFunction: (tx: {
      get: (docId: string) => Promise<{ exists: boolean; data: () => any }>;
      set: (docId: string, data: Record<string, any>) => void;
    }) => Promise<T>
  ) => Promise<T>;
}

/**
 * Shared multi-instance rate limiter backed by Cloud Firestore atomic transactions (`_rate_limits` collection).
 * Zero additional paid infrastructure (no Redis/Memorystore/Cloud SQL).
 * Automatically falls back to MemoryRateLimitStore if Admin Firestore ADC/IAM is unavailable in a container.
 */
export class FirestoreHybridRateLimitStore implements RateLimitStore {
  private readonly fallback: MemoryRateLimitStore;
  private readonly adapter: FirestoreTransactionAdapter | null;
  private readonly nowFn: () => number;
  private readonly cooldownOnErrorMs: number;
  private disabledUntilMs = 0;
  private lastBackendMode: 'firestore-shared' | 'in-memory-fallback' = 'in-memory-fallback';
  private lastFallbackReason: 'no-adapter' | 'cross-project-adc-denied' | 'firestore-error' | null = null;

  constructor(options: {
    adapter: FirestoreTransactionAdapter | null;
    fallback?: MemoryRateLimitStore;
    nowFn?: () => number;
    cooldownOnErrorMs?: number;
  }) {
    this.adapter = options.adapter;
    this.fallback = options.fallback ?? new MemoryRateLimitStore({ nowFn: options.nowFn });
    this.nowFn = options.nowFn ?? (() => Date.now());
    this.cooldownOnErrorMs = options.cooldownOnErrorMs ?? 5 * 60_000;
    if (!this.adapter) {
      this.lastFallbackReason = 'no-adapter';
    }
  }

  getMode(): 'firestore-shared' | 'in-memory-fallback' {
    if (!this.adapter || this.nowFn() < this.disabledUntilMs) {
      return 'in-memory-fallback';
    }
    return this.lastBackendMode;
  }

  getFallbackReason(): 'no-adapter' | 'cross-project-adc-denied' | 'firestore-error' | null {
    if (this.getMode() === 'firestore-shared') {
      return null;
    }
    return this.lastFallbackReason;
  }

  private buildDocId(bucket: string, key: string): string {
    const hash = crypto.createHash('sha256').update(`${bucket}:${key}`).digest('hex').slice(0, 32);
    const safeBucket = bucket.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    return `${safeBucket}_${hash}`;
  }

  async checkAndRecord(
    bucket: string,
    key: string,
    windowMs: number,
    maxRequests: number
  ): Promise<RateLimitDecision> {
    const now = this.nowFn();
    if (!this.adapter || now < this.disabledUntilMs) {
      return this.fallback.checkAndRecord(bucket, key, windowMs, maxRequests);
    }

    const docId = this.buildDocId(bucket, key);
    try {
      const decision = await this.adapter.runTransaction(async (tx) => {
        const snap = await tx.get(docId);
        const rawData = snap.exists ? snap.data() : null;
        const rawTimestamps = Array.isArray(rawData?.timestamps) ? rawData.timestamps : [];
        const recent = rawTimestamps
          .filter((ts: unknown): ts is number => typeof ts === 'number' && now - ts < windowMs)
          .sort((a: number, b: number) => a - b);

        if (recent.length >= maxRequests) {
          const oldestTs = recent[0] ?? now;
          const resetMs = oldestTs + windowMs;
          return {
            allowed: false,
            limit: maxRequests,
            remaining: 0,
            resetEpochSec: Math.ceil(resetMs / 1000),
            retryAfterSec: Math.max(1, Math.ceil((resetMs - now) / 1000)),
            backend: 'firestore-shared' as const,
          };
        }

        recent.push(now);
        tx.set(docId, {
          bucket,
          timestamps: recent.slice(-maxRequests),
          expiresAtMs: now + windowMs * 2,
          updatedAtMs: now,
        });

        const oldestTs = recent[0] ?? now;
        return {
          allowed: true,
          limit: maxRequests,
          remaining: Math.max(0, maxRequests - recent.length),
          resetEpochSec: Math.ceil((oldestTs + windowMs) / 1000),
          retryAfterSec: 0,
          backend: 'firestore-shared' as const,
        };
      });

      this.lastBackendMode = 'firestore-shared';
      this.lastFallbackReason = null;
      return decision;
    } catch (err: unknown) {
      // Cross-project ADC or transient Firestore outage -> fail over cleanly to bounded local limiter
      const msg = err instanceof Error ? err.message : String(err || '');
      this.lastFallbackReason = msg.toUpperCase().includes('PERMISSION_DENIED')
        ? 'cross-project-adc-denied'
        : 'firestore-error';
      this.disabledUntilMs = now + this.cooldownOnErrorMs;
      this.lastBackendMode = 'in-memory-fallback';
      return this.fallback.checkAndRecord(bucket, key, windowMs, maxRequests);
    }
  }
}

export function createRateLimitMiddleware(options: {
  bucket: string;
  windowMs: number;
  maxRequests: number;
  errorMessage: string;
  store: RateLimitStore;
  keyFn?: (req: express.Request) => string;
}): express.RequestHandler {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key =
      options.keyFn?.(req) ||
      (req as any).adminUser?.uid ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    const decision = await options.store.checkAndRecord(
      options.bucket,
      key,
      options.windowMs,
      options.maxRequests
    );

    res.setHeader('X-RateLimit-Limit', String(decision.limit));
    res.setHeader('X-RateLimit-Remaining', String(decision.remaining));
    res.setHeader('X-RateLimit-Reset', String(decision.resetEpochSec));

    if (!decision.allowed) {
      res.setHeader('Retry-After', String(decision.retryAfterSec));
      return res.status(429).json({
        success: false,
        code: 'rate_limit_exceeded',
        retryAfterSec: decision.retryAfterSec,
        error: options.errorMessage,
      });
    }

    return next();
  };
}
