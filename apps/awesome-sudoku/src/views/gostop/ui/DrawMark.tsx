import { cn } from '@shared/lib/cn';
import { OUTCOME_TITLE } from '@views/gostop/config/copy';
import styles from '@views/gostop/styles/result.module.css';
import { CardBack } from '@views/gostop/ui/CardBack';

export function DrawMark() {
  return (
    <p className="grid justify-items-center gap-2">
      <span className={cn(styles.tumble, 'block w-9 -rotate-12')}>
        <CardBack />
      </span>
      <span className="text-[30px] leading-none font-black tracking-[-0.04em] text-text-primary">
        {OUTCOME_TITLE.draw}
      </span>
    </p>
  );
}
