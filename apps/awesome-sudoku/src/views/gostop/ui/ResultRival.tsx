import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/rival.module.css';
import { RivalAvatar } from '@views/gostop/ui/RivalAvatar';

export function ResultRival() {
  const { rival } = useGostopContext();
  const hasLine = rival.line !== null;

  return (
    <p className="relative z-10 -mt-3 flex items-center gap-3 px-2">
      <RivalAvatar className="size-10" />
      {hasLine && <span className={styles.quote}>{rival.line}</span>}
    </p>
  );
}
