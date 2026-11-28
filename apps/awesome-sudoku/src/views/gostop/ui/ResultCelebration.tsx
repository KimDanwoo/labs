import { cn } from '@shared/lib/cn';
import { CONFETTI, CONFETTI_TONE } from '@views/gostop/config/result';
import { confettiStyle } from '@views/gostop/lib/confetti';
import styles from '@views/gostop/styles/result.module.css';

export function ResultCelebration() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <span className={styles.rays} />
      {CONFETTI.map((piece) => (
        <span key={piece.left} className={cn(styles.piece, CONFETTI_TONE[piece.tone])} style={confettiStyle(piece)} />
      ))}
    </span>
  );
}
