import Image from 'next/image';

import { Button } from '@shared/ui';

type GuideScreenProps = {
  imageSrc: string;
  onNext: () => void;
  buttonLabel?: string;
};

export function GuideScreen({
  imageSrc,
  onNext,
  buttonLabel = '입력하기',
}: GuideScreenProps) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <Image
        src={imageSrc}
        alt="사주 입력 안내"
        fill
        className="object-cover"
        preload
      />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <Button onClick={onNext} fullWidth>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
