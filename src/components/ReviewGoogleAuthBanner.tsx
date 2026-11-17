import { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { ShieldCheck, LogOut, RefreshCw, AlertCircle, Lock } from 'lucide-react';
import { loadFirebaseCore, loadFirebaseAuthSdk } from '../firebaseLazy';

interface ReviewGoogleAuthBannerProps {
  user: FirebaseUser | null;
  onUserSignedIn?: (user: FirebaseUser) => void;
  compact?: boolean;
}

function mapGoogleAuthErrorBn(err: any): string {
  const code = String(err?.code || '');
  const message = String(err?.message || '').toLowerCase();
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google সাইন-ইন উইন্ডোটি সম্পূর্ণ হওয়ার আগেই বন্ধ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
  }
  if (code === 'auth/popup-blocked') {
    return 'ব্রাউজারে পপ-আপ ব্লক করা আছে। অনুগ্রহ করে Pop-up অনুমতি দিয়ে আবার চেষ্টা করুন।';
  }
  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return 'এই ডোমেইনটি Firebase অথেনটিকেশনে অনুমোদিত নয়।';
  }
  if (code === 'auth/network-request-failed') {
    return 'ইন্টারনেট সংযোগে সমস্যা হচ্ছে। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।';
  }
  return 'Google দিয়ে সাইন-ইন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
}

export function ReviewGoogleAuthBanner({
  user,
  onUserSignedIn,
  compact = false,
}: ReviewGoogleAuthBannerProps) {
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (signingIn) return;
    setAuthError(null);
    setSigningIn(true);
    try {
      const { signInWithGooglePopup } = await loadFirebaseCore();
      const signedInUser = await signInWithGooglePopup();
      onUserSignedIn?.(signedInUser);
    } catch (err: any) {
      setAuthError(mapGoogleAuthErrorBn(err));
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      const [{ auth }, { signOut }] = await Promise.all([
        loadFirebaseCore(),
        loadFirebaseAuthSdk(),
      ]);
      await signOut(auth);
    } catch {
      // Ignore sign-out errors
    }
  };

  if (user) {
    return (
      <div
        className={`rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] ${
          compact ? 'px-3 py-2' : 'px-3.5 py-2.5'
        } flex flex-wrap items-center justify-between gap-2 font-sans-bn`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-6 h-6 rounded-full object-cover border border-[#86EFAC] shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#166534] truncate">
              ✓ Google যাচাইকৃত: {user.displayName || 'উদ্যানপ্রেমী গ্রাহক'}
            </p>
            {user.email && (
              <p className="text-xs text-[#15803D] truncate">
                {user.email} (শুধুমাত্র যাচাইয়ের জন্য · প্রকাশিত হবে না)
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#DCFCE7] border border-[#86EFAC] text-xs font-bold text-[#166534] cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${signingIn ? 'animate-spin' : ''}`} />
            <span>অ্যাকাউন্ট বদলান</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#FEF2F2] border border-[#CEDAC9] text-xs font-bold text-[#526356] hover:text-[#B34728] cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-[#F3F6F1] border border-[#CEDAC9] ${
        compact ? 'p-4' : 'p-5'
      } space-y-3 text-center font-sans-bn`}
    >
      <div className="w-10 h-10 mx-auto rounded-full bg-[#1B8354]/12 flex items-center justify-center text-[#1B8354]">
        <Lock className="w-5 h-5" />
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        <h4 className="font-serif-bn text-sm sm:text-base font-bold text-[#142318]">
          রিভিউ ও ছবি জমা দিতে Google দিয়ে সাইন-ইন করুন
        </h4>
        <p className="text-xs text-[#4C6252] leading-relaxed">
          ভুয়া ও স্প্যাম রিভিউ ঠেকাতে এবং প্রকৃত ক্রেতা যাচাইয়ের জন্য Google অ্যাকাউন্ট দিয়ে সাইন-ইন করা বাধ্যতামূলক। আপনার জিমেইল ঠিকানা ওয়েবসাইটে দেখানো হবে না।
        </p>
      </div>

      {authError && (
        <div className="max-w-md mx-auto p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#B34728] flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-[#EBF1E8] border border-[#CEDAC9] hover:border-[#1B8354] text-[#142318] text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          <span>{signingIn ? 'Google সাইন-ইন হচ্ছে...' : 'Google দিয়ে সাইন-ইন করুন'}</span>
        </button>
      </div>
    </div>
  );
}
