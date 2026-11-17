import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';
import { NURSERY_CONTACT } from '../data/brahmyamanCatalog';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown render error',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught render error:', error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F3F6F1] text-[#142318] flex items-center justify-center p-4 font-sans-bn">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#D5DFD1] p-6 sm:p-8 shadow-xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#B34728]/10 text-[#B34728] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif-bn text-xl sm:text-2xl font-bold text-[#142318]">
                একটি অস্থায়ী সমস্যা হয়েছে — পেজ রিফ্রেশ করুন
              </h1>
              <p className="text-xs sm:text-sm text-[#526356] leading-relaxed">
                দুঃখিত, এই অংশটি লোড করতে সাময়িক বিঘ্ন ঘটেছে। নিচের বোতামে ট্যাপ করে পুনরায় লোড করলে সবকিছু ঠিকভাবে চালু হবে।
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1B8354] hover:bg-[#146c44] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পুনরায় লোড করুন (Reload)</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-[#CEDAC9] bg-[#F3F6F1] hover:bg-[#E4ECE0] text-[#142318] text-xs font-bold transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>হোমপেজ</span>
              </button>
            </div>

            <div className="pt-3 border-t border-[#DFE7DC] text-[11px] text-[#785942]">
              জরুরি সহায়তার জন্য কল করুন:{' '}
              <a
                href={`tel:${NURSERY_CONTACT.phone}`}
                className="font-mono-num font-bold text-[#142318] hover:underline"
              >
                {NURSERY_CONTACT.phone}
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
