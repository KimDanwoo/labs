import type { Routine } from '@entities/routine/model/types';
import { SPLIT, type Split } from '@shared/training';
import { RoutineSplitSection } from './RoutineSplitSection';

type SplitGroup = {
  split: Split;
  routines: Routine[];
};

function groupBySplit(routines: readonly Routine[]): SplitGroup[] {
  const orderMap = new Map<Split, number>();
  const groupMap = new Map<Split, Routine[]>();

  for (const routine of routines) {
    if (!orderMap.has(routine.split)) {
      orderMap.set(routine.split, orderMap.size);
      groupMap.set(routine.split, []);
    }
    groupMap.get(routine.split)?.push(routine);
  }

  const result: SplitGroup[] = [];
  for (const [split, grouped] of groupMap) {
    result.push({ split, routines: grouped });
  }

  result.sort((a, b) => (orderMap.get(a.split) ?? 0) - (orderMap.get(b.split) ?? 0));
  return result;
}

type Props = {
  routines: readonly Routine[];
  onStart: (routine: Routine) => void;
  excludeSplit?: Split;
};

export function RoutinePicker({ routines, onStart, excludeSplit }: Props) {
  const groups = groupBySplit(routines).filter((group) => group.split !== excludeSplit);

  return (
    <div className="flex flex-col gap-3xl">
      {groups.map(({ split, routines }) => (
        <RoutineSplitSection key={split} splitLabel={SPLIT[split]} routines={routines} onStart={onStart} />
      ))}
    </div>
  );
}
