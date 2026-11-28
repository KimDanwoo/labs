import { cn } from '@shared/lib/cn';
import { FLOOR_CELL } from '@views/gostop/config/table';
import styles from '@views/gostop/styles/table.module.css';
import { FloorCard } from '@views/gostop/ui/FloorCard';

interface FloorSlotProps {
  month: number;
  ids: readonly number[];
}

export function FloorSlot({ month, ids }: FloorSlotProps) {
  const isEmpty = ids.length === 0;

  return (
    <li aria-hidden={isEmpty || undefined} className={cn('flex flex-col', styles.slot, FLOOR_CELL[month])}>
      {ids.map((id, index) => (
        <FloorCard key={id} id={id} isStacked={index > 0} />
      ))}
    </li>
  );
}
