import { cn } from '@shared/lib/cn';
import styles from '@views/gostop/styles/table.module.css';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface HeldCardProps {
  id: number;
}

export function HeldCard({ id }: HeldCardProps) {
  return (
    <div data-card={id} className={cn('absolute inset-0 z-10', styles.held)}>
      <HwatuCard id={id} className="shadow-[0_0_0_2px_rgb(var(--rgb-lemon)),0_14px_24px_rgb(0_0_0/0.6)]" />
    </div>
  );
}
