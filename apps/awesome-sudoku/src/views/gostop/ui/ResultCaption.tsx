import { cn } from '@shared/lib/cn';
import { RESULT_CAPTION } from '@views/gostop/config/copy';
import { MOOD_CAPTION } from '@views/gostop/config/purse';
import { allInMoodOf } from '@views/gostop/lib/moneyView';
import { outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/money.module.css';

export function ResultCaption() {
  const { result, settlement } = useGostopContext();
  const mood = allInMoodOf(settlement);

  if (mood === 'none') {
    return <p className="text-[13px] font-semibold opacity-80 break-keep">{RESULT_CAPTION[outcomeOf(result)]}</p>;
  }

  const caption = MOOD_CAPTION[mood];
  return (
    <p
      data-mood={mood}
      className={cn('rounded-xl px-3 py-1.5 text-[13px] leading-[1.45] font-semibold break-keep', styles[mood])}
    >
      <span className={cn('mr-1.5 inline-block rounded-md px-1.5 py-0.5 text-[13px] font-black', styles.badge)}>
        {caption.badge}
      </span>
      {caption.note}
    </p>
  );
}
