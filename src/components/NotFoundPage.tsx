interface NotFoundPageProps {
  lang: 'bn' | 'en';
  onHome: () => void;
}

export function NotFoundPage({ lang, onHome }: NotFoundPageProps) {
  return (
    <section className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center">
      <p className="text-[13px] font-semibold tracking-wide text-[#B34728]">404</p>
      <h1 className="mt-2 font-serif-bn text-3xl sm:text-4xl text-[#142318]">
        {lang === 'bn' ? 'এই পাতাটি নেই' : 'This page is not on the nursery site'}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#526356] font-sans-bn">
        {lang === 'bn'
          ? 'ঠিকানাটি মিলছে না। ক্যাটালগে ফিরে কালশুলির চারা দেখুন, অথবা WhatsApp-এ জিজ্ঞাসা করুন।'
          : 'That address does not match a page. Go back to the catalog, or ask on WhatsApp.'}
      </p>
      <button
        type="button"
        onClick={onHome}
        className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#15803D] text-white text-[15px] font-semibold"
      >
        {lang === 'bn' ? 'ক্যাটালগে ফিরুন' : 'Back to the catalog'}
      </button>
    </section>
  );
}
