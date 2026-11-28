import { cn } from '@shared/lib/cn';
import { RIVAL_BACKS_MAX } from '@views/gostop/config/cardStyle';
import styles from '@views/gostop/styles/hwatuMotion.module.css';
import { CardBack } from '@views/gostop/ui/CardBack';

interface RivalBacksProps {
  count: number;
}

export function RivalBacks({ count }: RivalBacksProps) {
  const backs = Array.from({ length: Math.min(count, RIVAL_BACKS_MAX) }, (_, index) => index);

  return (
    <span aria-hidden="true" className="flex h-[30px] w-[78px] shrink-0 items-center">
      {backs.map((index) => (
        <span key={index} className={cn('-ml-3.5 w-5 shrink-0 first:ml-0', styles.deal)}>
          <CardBack />
        </span>
      ))}
    </span>
  );
}
