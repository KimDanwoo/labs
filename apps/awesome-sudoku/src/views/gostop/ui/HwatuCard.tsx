import Image from 'next/image';

import { cn } from '@shared/lib/cn';
import { CARD_FACE, HWATU_IMAGE } from '@views/gostop/config/cardStyle';
import { cardImageSrc, cardLabel } from '@views/gostop/lib/view';
import { CardMarks } from '@views/gostop/ui/CardMarks';

interface HwatuCardProps {
  id: number;
  className?: string;
}

export function HwatuCard({ id, className }: HwatuCardProps) {
  return (
    <span role="img" aria-label={cardLabel(id)} className={cn(CARD_FACE, className)}>
      <Image
        src={cardImageSrc(id)}
        alt=""
        fill
        sizes={HWATU_IMAGE.sizes}
        draggable={false}
        className="object-cover select-none"
      />
      <CardMarks id={id} />
    </span>
  );
}
