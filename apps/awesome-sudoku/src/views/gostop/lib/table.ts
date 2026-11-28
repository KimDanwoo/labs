import { monthOf } from '@views/gostop/lib/cards';

export function floorSlots(floor: readonly number[]): Record<number, number[]> {
  const slots: Record<number, number[]> = {};
  floor.forEach((id) => {
    const month = monthOf(id);
    slots[month] = [...(slots[month] ?? []), id];
  });
  return slots;
}
