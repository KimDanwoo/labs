import Image from 'next/image';

import { cn } from '@shared/lib/cn';
import { CARD_BACK, HWATU_IMAGE } from '@views/gostop/config/cardStyle';

interface CardBackProps {
  className?: string;
}

export function CardBack({ className }: CardBackProps) {
  return (
    <span aria-hidden="true" className={cn(CARD_BACK, className)}>
      <Image src={HWATU_IMAGE.back} alt="" fill sizes={HWATU_IMAGE.sizes} draggable={false} className="object-cover" />
    </span>
  );
}
