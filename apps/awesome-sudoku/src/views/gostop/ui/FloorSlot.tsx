import { FloorCard } from '@views/gostop/ui/FloorCard';

interface FloorSlotProps {
  slot: number;
  ids: readonly number[];
}

export function FloorSlot({ slot, ids }: FloorSlotProps) {
  const isEmpty = ids.length === 0;

  return (
    <li className="relative aspect-[25/51]">
      {isEmpty && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 grid aspect-[2/3] place-items-center rounded-[5px] border border-dashed border-border-medium text-[11px] font-semibold text-text-tertiary/60"
        >
          {slot + 1}
        </span>
      )}
      {ids.map((id, index) => (
        <FloorCard key={id} id={id} stack={index} slot={slot} />
      ))}
    </li>
  );
}
