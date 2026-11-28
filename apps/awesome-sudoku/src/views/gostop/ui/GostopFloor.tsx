import { cn } from '@shared/lib/cn';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { MONTHS } from '@views/gostop/config/table';
import { floorSlots } from '@views/gostop/lib/table';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { ChoicePrompt } from '@views/gostop/ui/ChoicePrompt';
import { DeckPile } from '@views/gostop/ui/DeckPile';
import { FloorSlot } from '@views/gostop/ui/FloorSlot';

export function GostopFloor() {
  const { floor } = useGostopContext();
  const slots = floorSlots(floor);

  return (
    <section
      aria-label={GOSTOP_COPY.floorLabel}
      className={cn('rounded-[20px] [grid-area:floor] py-2.5 lg:px-3 lg:py-2', styles.felt)}
    >
      <ChoicePrompt />
      <ul className="relative grid grid-cols-7 grid-rows-[auto_auto] justify-items-center gap-x-[2px] gap-y-2 lg:gap-x-3 lg:gap-y-3">
        {MONTHS.map((month) => (
          <FloorSlot key={month} month={month} ids={slots[month] ?? []} />
        ))}
        <DeckPile />
      </ul>
    </section>
  );
}
