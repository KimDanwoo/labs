import { cn } from '@shared/lib/cn';
import { BUBBLE_TIMING } from '@views/gostop/config/rival';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/rival.module.css';

export function RivalBubble() {
  const { rivalBubble } = useGostopContext();
  if (!rivalBubble) return null;

  return (
    <span
      key={rivalBubble.id}
      aria-hidden="true"
      style={BUBBLE_TIMING}
      className={cn(styles.bubble, styles.tableBubble)}
    >
      {rivalBubble.line}
    </span>
  );
}
