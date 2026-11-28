import { cn } from '@shared/lib/cn';
import styles from '@views/gostop/styles/hwatuMotion.module.css';

export function GatherGlow() {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[5px] shadow-[0_0_0_2px_rgb(var(--rgb-lemon)),0_0_18px_rgba(255,225,77,0.6)]',
        styles.gatherGlow,
      )}
    />
  );
}
