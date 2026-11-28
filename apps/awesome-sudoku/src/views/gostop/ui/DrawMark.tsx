import { cn } from '@shared/lib/cn';
import { OUTCOME_TITLE } from '@views/gostop/config/copy';
import styles from '@views/gostop/styles/result.module.css';
import { CardBack } from '@views/gostop/ui/CardBack';

export function DrawMark() {
  return (
    <p className="flex items-center gap-2 pl-1">
      <span className={cn(styles.tumble, 'block w-7 -rotate-12')}>
        <CardBack />
      </span>
      <span className="text-[26px] leading-none font-black tracking-[-0.04em] whitespace-nowrap text-text-primary">
        {OUTCOME_TITLE.draw}
      </span>
    </p>
  );
}
