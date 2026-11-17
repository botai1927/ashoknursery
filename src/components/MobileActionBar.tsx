import { MessageCircle, Phone, ShoppingBag } from 'lucide-react';
import { NURSERY_CONTACT } from '../data/brahmyamanCatalog';

interface MobileActionBarProps {
  lang: 'bn' | 'en';
  cartCount: number;
  onOpenCart: () => void;
}

export function MobileActionBar({ lang, cartCount, onOpenCart }: MobileActionBarProps) {
  const whatsappHref = `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${encodeURIComponent(
    'নমস্কার, ভ্রম্যমাণ নার্সারি। আমি চারা সম্পর্কে জানতে চাই।'
  )}`;

  return (
    <nav
      aria-label={lang === 'bn' ? 'দ্রুত যোগাযোগ' : 'Quick actions'}
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#D5DFD1] bg-[#F7F3EA]/95 backdrop-blur-md pb-[max(0.4rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-0.5 py-2 text-[13px] font-semibold text-[#146c44]"
        >
          <MessageCircle className="w-5 h-5" />
          <span>WhatsApp</span>
        </a>
        <a
          href={`tel:${NURSERY_CONTACT.phone}`}
          className="flex flex-col items-center justify-center gap-0.5 py-2 text-[13px] font-semibold text-[#142318]"
        >
          <Phone className="w-5 h-5" />
          <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
        </a>
        <button
          type="button"
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center gap-0.5 py-2 text-[13px] font-semibold text-[#B34728]"
        >
          <span className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#15803D] text-white text-[13px] leading-4 text-center">
                {cartCount}
              </span>
            )}
          </span>
          <span>{lang === 'bn' ? 'ঝুড়ি' : 'Cart'}</span>
        </button>
      </div>
    </nav>
  );
}
