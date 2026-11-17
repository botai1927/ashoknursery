const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(num: number): string {
  return String(num)
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0) - 48;
      return code >= 0 && code <= 9 ? BENGALI_DIGITS[code] : ch;
    })
    .join('');
}

export function normalizeBengaliNumberInput(raw: string): number | null {
  const ascii = raw
    .trim()
    .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  if (!/^\d+$/.test(ascii)) return null;
  const parsed = Number(ascii);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface BengaliHumanMathPuzzle {
  a: number;
  b: number;
  answer: number;
  questionBn: string;
}

export function createBengaliMathPuzzle(): BengaliHumanMathPuzzle {
  const a = 2 + Math.floor(Math.random() * 7); // 2..8
  const b = 1 + Math.floor(Math.random() * 6); // 1..6
  return {
    a,
    b,
    answer: a + b,
    questionBn: `${toBengaliDigits(a)} + ${toBengaliDigits(b)} = ?`,
  };
}

function countLeadingZeroBitsBrowser(bytes: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    if (byte === 0) {
      count += 8;
    } else {
      for (let bit = 7; bit >= 0; bit -= 1) {
        if ((byte & (1 << bit)) !== 0) return count;
        count += 1;
      }
    }
  }
  return count;
}

async function solveProofOfWorkWebCrypto(token: string, difficulty: number): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('WebCrypto unavailable');
  }
  const encoder = new TextEncoder();
  for (let i = 0; i < 200_000; i += 1) {
    const candidate = i.toString(36);
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(`${token}:${candidate}`));
    if (countLeadingZeroBitsBrowser(new Uint8Array(buf)) >= difficulty) {
      return candidate;
    }
  }
  throw new Error('Challenge solve limit exceeded');
}

/**
 * Fetches a free, zero-billing server-signed single-use challenge and computes the
 * lightweight WebCrypto proof-of-work headers for public review & inquiry requests.
 */
export async function getPublicChallengeHeaders(): Promise<Record<string, string>> {
  if (typeof fetch !== 'function') return {};
  try {
    const res = await fetch('/api/public/challenge', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const data = (await res.json()) as {
      token?: string;
      difficulty?: number;
    };
    if (!data?.token) return {};
    const difficulty = Number(data.difficulty) || 10;
    const solution = await solveProofOfWorkWebCrypto(data.token, difficulty);
    return {
      'X-Public-Challenge': data.token,
      'X-Public-Solution': solution,
    };
  } catch {
    return {};
  }
}
