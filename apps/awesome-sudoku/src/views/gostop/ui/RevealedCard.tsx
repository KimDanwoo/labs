import { cn } from '@shared/lib/cn';
import styles from '@views/gostop/styles/hwatuMotion.module.css';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface RevealedCardProps {
  id: number;
}

export function RevealedCard({ id }: RevealedCardProps) {
  return (
    <div data-card={id} className="absolute inset-0 z-10">
      <HwatuCard id={id} className={cn('shadow-[0_6px_14px_rgb(0_0_0/0.5)]', styles.reveal)} />
    </div>
  );
}
