import { ArrowLeft, Loader2, ShieldCheck, Smartphone } from 'lucide-react';

interface AdminLoginViewProps {
  onNavigateToShop: () => void;
  loginError: string;
  isAuthChecking: boolean;
  isVerifying: boolean;
  onGoogleSignIn: () => void;
}

export function AdminLoginView({
  onNavigateToShop,
  loginError,
  isAuthChecking,
  isVerifying,
  onGoogleSignIn,
}: AdminLoginViewProps) {
  return (
    <div className="min-h-screen bg-[#142318] text-[#E8EDE9] flex flex-col justify-between p-4 sm:p-6 font-sans-bn selection:bg-[#A3E635] selection:text-[#142318]">
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onNavigateToShop}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#213526] hover:bg-[#2e4735] text-xs font-semibold text-[#CBD5E1] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>নার্সারি ওয়েবসাইট</span>
        </button>
        <span className="text-xs text-[#A3E635] font-mono">Admin Portal</span>
      </div>

      <div className="w-full max-w-md mx-auto my-auto bg-white text-[#142318] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#304836]">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center mx-auto mb-3 border border-[#1B8354]/20">
            <Smartphone className="w-7 h-7" />
          </div>
          <h1 className="font-serif-bn text-2xl font-bold tracking-tight text-[#142318]">
            ভ্রাম্যমাণ নার্সারি · Admin ও Owner পোর্টাল
          </h1>
          <p className="text-sm text-[#526356] mt-1 font-medium">
            মোবাইল ও ডেস্কটপ থেকে গাছের ছবি, স্টক ও দাম বদলানোর সুরক্ষিত পোর্টাল
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[#F5EFE6] border border-[#E8E1D5] rounded-2xl text-sm text-[#526356] space-y-2">
            <div className="flex items-center gap-2 text-[#142318] font-bold">
              <ShieldCheck className="w-5 h-5 text-[#1B8354] shrink-0" />
              <span>নিরাপদ Google অ্যাকাউন্ট যাচাই</span>
            </div>
            <p className="text-xs leading-relaxed">
              শুধুমাত্র সার্ভার-অনুমোদিত Owner ও Admin Google অ্যাকাউন্ট দিয়েই প্রবেশ করা যাবে। অন্য কোনো পাসওয়ার্ড বা PIN মনে রাখার দরকার নেই।
            </p>
          </div>

          {loginError && (
            <p className="text-sm text-[#B34728] font-semibold bg-[#B34728]/10 border border-[#B34728]/20 p-3 rounded-xl text-center">
              {loginError}
            </p>
          )}

          <button
            type="button"
            disabled={isAuthChecking || isVerifying}
            onClick={onGoogleSignIn}
            className="w-full h-14 bg-[#142318] hover:bg-[#203425] active:scale-[0.99] disabled:opacity-60 text-white font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-md text-base"
          >
            {isAuthChecking || isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#A3E635]" />
                <span>{isAuthChecking ? 'যাচাই করা হচ্ছে...' : 'Google লগইন চলছে...'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-[#A3E635]" />
                <span>Google দিয়ে লগইন করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-[#7B9584] py-3">
        ভ্রাম্যমাণ নার্সারি, কালশুলি গ্রাম · বাঁকুড়া, ৭২২১৬০
      </div>
    </div>
  );
}
