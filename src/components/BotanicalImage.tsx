import { useState } from 'react';
import { Sprout } from 'lucide-react';

interface BotanicalImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  eager?: boolean;
}

export function BotanicalImage({
  src,
  alt,
  title,
  className = 'w-full h-full object-cover',
  eager = false,
}: BotanicalImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F1F3F1] to-[#E5E9E5] text-[#5A635D] p-6 text-center"
      >
        <Sprout className="w-8 h-8 text-[#1B4332]/60 mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#141916]/80 max-w-[16rem] truncate">
          {title || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
