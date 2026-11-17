import crypto from 'node:crypto';

export interface PublicChallengePayload {
  token: string;
  difficulty: number;
  issuedAt: number;
  expiresAt: number;
}

export interface ChallengeVerificationResult {
  ok: boolean;
  code?: 'CHALLENGE_REQUIRED' | 'CHALLENGE_INVALID' | 'CHALLENGE_EXPIRED' | 'CHALLENGE_REPLAYED' | 'CHALLENGE_FAILED';
  error?: string;
}

const DEFAULT_DIFFICULTY_BITS = 10; // ~1024 hashes avg (<10ms in browser WebCrypto; blocks blind HTTP floods)
const CHALLENGE_TTL_MS = 10 * 60_000;
const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

// Bounded single-use nonce cache (nonce -> expiresAtMs) to block replay attacks without external Redis/DB
const usedChallengeNonces = new Map<string, number>();
const MAX_TRACKED_NONCES = 10_000;

function resolveChallengeSecret(): string {
  const configured =
    process.env.PUBLIC_CHALLENGE_SECRET ||
    process.env.CLOUDINARY_API_SECRET ||
    process.env.GEMINI_API_KEY ||
    '';
  if (configured.trim()) {
    return crypto.createHash('sha256').update(`brahmyaman:${configured.trim()}`).digest('hex');
  }
  return EPHEMERAL_FALLBACK_SECRET;
}

function pruneExpiredNonces(nowMs: number): void {
  if (usedChallengeNonces.size === 0) return;
  for (const [nonce, exp] of usedChallengeNonces.entries()) {
    if (exp <= nowMs) {
      usedChallengeNonces.delete(nonce);
    }
  }
  while (usedChallengeNonces.size > MAX_TRACKED_NONCES) {
    const oldestKey = usedChallengeNonces.keys().next().value;
    if (!oldestKey) break;
    usedChallengeNonces.delete(oldestKey);
  }
}

export function countLeadingZeroBits(buf: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < buf.length; i += 1) {
    const byte = buf[i];
    if (byte === 0) {
      count += 8;
    } else {
      count += Math.clz32(byte) - 24;
      break;
    }
  }
  return count;
}

export function issuePublicChallenge(
  difficulty = DEFAULT_DIFFICULTY_BITS,
  nowMs = Date.now()
): PublicChallengePayload {
  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = nowMs;
  const expiresAt = issuedAt + CHALLENGE_TTL_MS;
  const cleanDifficulty = Math.min(18, Math.max(4, Math.round(difficulty)));
  const body = `${nonce}.${issuedAt}.${expiresAt}.${cleanDifficulty}`;
  const sig = crypto
    .createHmac('sha256', resolveChallengeSecret())
    .update(body)
    .digest('base64url');
  return {
    token: `${body}.${sig}`,
    difficulty: cleanDifficulty,
    issuedAt,
    expiresAt,
  };
}

export function solvePublicChallengeSync(token: string, difficulty = DEFAULT_DIFFICULTY_BITS): string {
  for (let candidate = 0; candidate < 5_000_000; candidate += 1) {
    const sol = candidate.toString(36);
    const digest = crypto.createHash('sha256').update(`${token}:${sol}`).digest();
    if (countLeadingZeroBits(digest) >= difficulty) {
      return sol;
    }
  }
  throw new Error('Could not solve proof-of-work challenge');
}

export function verifyPublicChallengeResponse(
  token: unknown,
  solution: unknown,
  options: { nowMs?: number; consumeNonce?: boolean } = {}
): ChallengeVerificationResult {
  const nowMs = options.nowMs ?? Date.now();
  const consumeNonce = options.consumeNonce ?? true;

  if (typeof token !== 'string' || !token.trim() || typeof solution !== 'string' || !solution.trim()) {
    return {
      ok: false,
      code: 'CHALLENGE_REQUIRED',
      error: 'নিরাপত্তা যাচাই সম্পন্ন হয়নি। অনুগ্রহ করে পেজ রিলোড করে আবার চেষ্টা করুন।',
    };
  }

  const trimmedToken = token.trim();
  const trimmedSolution = solution.trim();
  if (trimmedSolution.length > 32) {
    return {
      ok: false,
      code: 'CHALLENGE_INVALID',
      error: 'অবৈধ নিরাপত্তা টোকেন। অনুগ্রহ করে আবার চেষ্টা করুন।',
    };
  }

  const parts = trimmedToken.split('.');
  if (parts.length !== 5) {
    return {
      ok: false,
      code: 'CHALLENGE_INVALID',
      error: 'অবৈধ নিরাপত্তা টোকেন ফরম্যাট।',
    };
  }

  const [nonce, issuedAtStr, expiresAtStr, difficultyStr, providedSig] = parts;
  const issuedAt = Number(issuedAtStr);
  const expiresAt = Number(expiresAtStr);
  const difficulty = Number(difficultyStr);

  if (
    !/^[a-f0-9]{16,64}$/i.test(nonce) ||
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    !Number.isFinite(difficulty) ||
    difficulty < 4 ||
    difficulty > 20
  ) {
    return {
      ok: false,
      code: 'CHALLENGE_INVALID',
      error: 'অবৈধ নিরাপত্তা টোকেন তথ্য।',
    };
  }

  const expectedSig = crypto
    .createHmac('sha256', resolveChallengeSecret())
    .update(`${nonce}.${issuedAtStr}.${expiresAtStr}.${difficultyStr}`)
    .digest('base64url');

  const sigBufA = Buffer.from(providedSig);
  const sigBufB = Buffer.from(expectedSig);
  if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
    return {
      ok: false,
      code: 'CHALLENGE_INVALID',
      error: 'নিরাপত্তা যাচাই স্বাক্ষর মিলছে না। পেজ রিলোড করে আবার চেষ্টা করুন।',
    };
  }

  if (nowMs > expiresAt || issuedAt > nowMs + 60_000) {
    return {
      ok: false,
      code: 'CHALLENGE_EXPIRED',
      error: 'নিরাপত্তা যাচাইয়ের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার সাবমিট করুন।',
    };
  }

  pruneExpiredNonces(nowMs);
  if (usedChallengeNonces.has(nonce)) {
    return {
      ok: false,
      code: 'CHALLENGE_REPLAYED',
      error: 'এই নিরাপত্তা টোকেনটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    };
  }

  const digest = crypto.createHash('sha256').update(`${trimmedToken}:${trimmedSolution}`).digest();
  if (countLeadingZeroBits(digest) < difficulty) {
    return {
      ok: false,
      code: 'CHALLENGE_FAILED',
      error: 'নিরাপত্তা যাচাই ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    };
  }

  if (consumeNonce) {
    usedChallengeNonces.set(nonce, expiresAt);
  }

  return { ok: true };
}
