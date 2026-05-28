import Link from 'next/link';

type GuideScreenProps = {
  imageSrc: string;
  href: string;
  buttonLabel?: string;
  onSkip?: () => void;
};

export function GuideScreen({
  imageSrc,
  href,
  buttonLabel = '입력하기',
  onSkip,
}: GuideScreenProps) {
  return (
    <div
      className="relative flex-1 overflow-hidden bg-background bg-cover bg-center"
      style={{ backgroundImage: `url(${imageSrc})` }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <Link
          href={href}
          className="flex items-center justify-center w-full h-13 rounded-full bg-gold text-[#0a0a1a] font-bold tracking-wide shadow-lg shadow-gold/20 hover:bg-gold-bright active:scale-[0.97] transition-all duration-200 touch-manipulation"
        >
          {buttonLabel}
        </Link>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-foreground/50 active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}
