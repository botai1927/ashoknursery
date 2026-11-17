import type { DecodedIdToken } from 'firebase-admin/auth';

export interface RevocationVerificationSuccess {
  ok: true;
  uid: string;
  email: string;
  emailVerified: boolean;
  revocationCheckActive: true;
  revocationMethod: 'firebase-admin-sdk' | 'identity-toolkit-lookup';
}

export interface RevocationVerificationFailure {
  ok: false;
  status: 401 | 503;
  code: string;
  revoked?: boolean;
  error: string;
}

export type RevocationVerificationOutcome =
  | RevocationVerificationSuccess
  | RevocationVerificationFailure;

export interface FirebaseRevocationVerifierDeps {
  verifyIdToken: (idToken: string, checkRevoked?: boolean) => Promise<DecodedIdToken>;
  hasExplicitServiceAccount: boolean;
  webApiKey: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

const REVOKED_CODES = new Set([
  'auth/id-token-revoked',
  'auth/user-disabled',
  'auth/user-not-found',
]);

const JWT_REJECT_CODES = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/invalid-id-token',
  'auth/invalid-argument',
]);

/**
 * Identifies errors caused solely by missing cross-project ADC permissions or disabled
 * Identity Toolkit API on a host container project (e.g., AI Studio container ADC),
 * distinct from transient network failures or genuine token invalidity.
 */
export function isAdcCredentialUnavailableError(err: any): boolean {
  const code = String(err?.code || '');
  const message = String(err?.message || '').toLowerCase();

  if (code === 'auth/insufficient-permission' || code === 'app/invalid-credential') {
    return true;
  }

  if (code === 'auth/internal-error') {
    return (
      message.includes('identitytoolkit.googleapis.com') ||
      message.includes('could not load the default credentials') ||
      message.includes('permission_denied') ||
      message.includes('does not have permission') ||
      message.includes('insufficient authentication scopes') ||
      message.includes('has not been used in project') ||
      message.includes('it is disabled')
    );
  }

  return false;
}

/**
 * Strictly fail-closed Identity Toolkit lookup for the target Firebase Auth project.
 * Never returns `ok: true` unless the Identity Toolkit backend explicitly confirms
 * the user exists, is not disabled, and has not revoked tokens since `auth_time`.
 */
export async function verifyLiveRevocationViaIdentityToolkit(
  idToken: string,
  decodedToken: { uid?: string; auth_time?: number },
  options: {
    webApiKey: string;
    fetchFn?: typeof fetch;
    timeoutMs?: number;
  }
): Promise<
  | { ok: true; accountEmail?: string; accountEmailVerified?: boolean }
  | { ok: false; status: 401 | 503; code: string; revoked?: boolean; error: string }
> {
  if (!options.webApiKey) {
    return {
      ok: false,
      status: 503,
      code: 'auth/revocation-check-unavailable',
      error: 'সেশন বাতিলকরণ যাচাই কনফিগার করা নেই। নিরাপত্তার স্বার্থে অনুরোধ বাতিল করা হয়েছে।',
    };
  }

  const fetchImpl = options.fetchFn || fetch;
  const timeoutMs = options.timeoutMs ?? 4500;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(options.webApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      }
    );

    const data: any = await res.json().catch(() => null);

    if (!res.ok) {
      const apiMsg = String(data?.error?.message || '').toUpperCase();
      if (apiMsg.includes('USER_DISABLED')) {
        return {
          ok: false,
          status: 401,
          code: 'auth/user-disabled',
          revoked: true,
          error: 'আপনার অ্যাডমিন অ্যাকাউন্ট নিষ্ক্রিয় (disabled) করা হয়েছে।',
        };
      }
      if (apiMsg.includes('USER_NOT_FOUND')) {
        return {
          ok: false,
          status: 401,
          code: 'auth/user-not-found',
          revoked: true,
          error: 'অ্যাডমিন অ্যাকাউন্টটি আর সক্রিয় নেই।',
        };
      }
      if (
        apiMsg.includes('INVALID_ID_TOKEN') ||
        apiMsg.includes('TOKEN_EXPIRED') ||
        apiMsg.includes('CREDENTIAL_TOO_OLD_LOGIN_AGAIN')
      ) {
        return {
          ok: false,
          status: 401,
          code: 'auth/id-token-revoked',
          revoked: true,
          error: 'আপনার অ্যাডমিন সেশন বাতিল (revoke) বা মেয়াদোত্তীর্ণ হয়েছে। অনুগ্রহ করে পুনরায় Google দিয়ে লগইন করুন।',
        };
      }

      // 5xx or indeterminate Identity Toolkit response -> fail closed (503)
      return {
        ok: false,
        status: 503,
        code: 'auth/revocation-check-unavailable',
        error: 'সেশন বাতিলকরণ যাচাই সার্ভার অস্থায়ীভাবে অনুপলব্ধ। নিরাপত্তার স্বার্থে অনুরোধ বাতিল করা হয়েছে।',
      };
    }

    const account = Array.isArray(data?.users) ? data.users[0] : null;
    if (!account) {
      return {
        ok: false,
        status: 401,
        code: 'auth/user-not-found',
        revoked: true,
        error: 'অ্যাডমিন অ্যাকাউন্টটি পাওয়া যায়নি। পুনরায় লগইন করুন।',
      };
    }

    if (decodedToken.uid && account.localId && account.localId !== decodedToken.uid) {
      return {
        ok: false,
        status: 401,
        code: 'auth/invalid-id-token',
        revoked: true,
        error: 'টোকেন ও ব্যবহারকারীর পরিচয় মেলেনি। পুনরায় লগইন করুন।',
      };
    }

    if (account.disabled === true) {
      return {
        ok: false,
        status: 401,
        code: 'auth/user-disabled',
        revoked: true,
        error: 'আপনার অ্যাডমিন অ্যাকাউন্ট নিষ্ক্রিয় (disabled) করা হয়েছে।',
      };
    }

    if (account.validSince && typeof decodedToken.auth_time === 'number') {
      const rawValidSince = Number(account.validSince);
      const validSinceSec =
        rawValidSince > 1e12 ? Math.floor(rawValidSince / 1000) : rawValidSince;
      // Allow up to 2s clock skew during brand-new federated user creation while rejecting all revoked sessions
      if (Number.isFinite(validSinceSec) && validSinceSec - decodedToken.auth_time > 2) {
        return {
          ok: false,
          status: 401,
          code: 'auth/id-token-revoked',
          revoked: true,
          error: 'আপনার অ্যাডমিন সেশন বাতিল (revoke) করা হয়েছে। নিরাপত্তার স্বার্থে পুনরায় Google দিয়ে লগইন করুন।',
        };
      }
    }

    return {
      ok: true,
      accountEmail: typeof account.email === 'string' ? account.email.trim().toLowerCase() : undefined,
      accountEmailVerified: typeof account.emailVerified === 'boolean' ? account.emailVerified : undefined,
    };
  } catch {
    // Fail-closed on timeout (AbortError), DNS error, or connection reset
    return {
      ok: false,
      status: 503,
      code: 'auth/revocation-check-unavailable',
      error: 'নিরাপত্তা যাচাই (Identity Toolkit) টাইমআউট বা নেটওয়ার্ক ত্রুটি হয়েছে। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন।',
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verifies Firebase ID token signature, expiry, and LIVE revocation status strictly fail-closed.
 * Prefers `adminAuth.verifyIdToken(token, true)` via ADC / server credentials; if host runtime ADC
 * lacks cross-project Identity Toolkit permission on the target Firebase project, enforces strict
 * cryptographic JWT verification + mandatory fail-closed Identity Toolkit lookup.
 */
export async function verifyAdminTokenWithRevocation(
  idToken: string,
  deps: FirebaseRevocationVerifierDeps
): Promise<RevocationVerificationOutcome> {
  try {
    const decoded = await deps.verifyIdToken(idToken, true);
    return {
      ok: true,
      uid: decoded.uid,
      email: (decoded.email || '').trim().toLowerCase(),
      emailVerified: decoded.email_verified === true,
      revocationCheckActive: true,
      revocationMethod: 'firebase-admin-sdk',
    };
  } catch (err: any) {
    const code = String(err?.code || '');

    if (REVOKED_CODES.has(code)) {
      return {
        ok: false,
        status: 401,
        code,
        revoked: true,
        error: 'আপনার অ্যাডমিন সেশন বাতিল (revoke) বা নিষ্ক্রিয় করা হয়েছে। নিরাপত্তার স্বার্থে পুনরায় Google দিয়ে লগইন করুন।',
      };
    }

    if (JWT_REJECT_CODES.has(code)) {
      return {
        ok: false,
        status: 401,
        code,
        error: 'লগইন সেশনের মেয়াদ শেষ বা টোকেন অবৈধ। অনুগ্রহ করে পুনরায় Google দিয়ে লগইন করুন।',
      };
    }

    // Only attempt Identity Toolkit REST verification when cross-project ADC lacks permission
    // and no explicit service account JSON was supplied.
    if (!deps.hasExplicitServiceAccount && isAdcCredentialUnavailableError(err)) {
      let decoded: DecodedIdToken;
      try {
        decoded = await deps.verifyIdToken(idToken, false);
      } catch (jwtErr: any) {
        const jwtCode = String(jwtErr?.code || 'auth/invalid-id-token');
        return {
          ok: false,
          status: 401,
          code: jwtCode,
          error: 'লগইন সেশনের মেয়াদ শেষ বা টোকেন অবৈধ। অনুগ্রহ করে পুনরায় Google দিয়ে লগইন করুন।',
        };
      }

      const toolkitResult = await verifyLiveRevocationViaIdentityToolkit(idToken, decoded, {
        webApiKey: deps.webApiKey,
        fetchFn: deps.fetchFn,
        timeoutMs: deps.timeoutMs,
      });

      if (!toolkitResult.ok) {
        return {
          ok: false,
          status: toolkitResult.status,
          code: toolkitResult.code,
          revoked: toolkitResult.revoked,
          error: toolkitResult.error,
        };
      }

      return {
        ok: true,
        uid: decoded.uid,
        email: (decoded.email || toolkitResult.accountEmail || '').trim().toLowerCase(),
        emailVerified: decoded.email_verified === true || toolkitResult.accountEmailVerified === true,
        revocationCheckActive: true,
        revocationMethod: 'identity-toolkit-lookup',
      };
    }

    // Indeterminate upstream failure (timeout/5xx/ADC outage with explicit SA) -> FAIL CLOSED (503)
    return {
      ok: false,
      status: 503,
      code: code || 'auth/revocation-check-unavailable',
      error: 'সেশন যাচাই সার্ভার অস্থায়ীভাবে অনুপলব্ধ। নিরাপত্তার স্বার্থে অনুরোধ বাতিল করা হয়েছে।',
    };
  }
}
