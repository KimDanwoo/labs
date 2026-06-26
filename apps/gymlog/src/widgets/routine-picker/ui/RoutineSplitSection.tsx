import type { Routine } from '@entities/routine/model/types';
import { Badge } from '@ui/react';
import { RoutineCard } from './RoutineCard';

type Props = {
  splitLabel: string;
  routines: readonly Routine[];
  onStart: (routine: Routine) => void;
  tag?: string;
};

export function RoutineSplitSection({ splitLabel, routines, onStart, tag }: Props) {
  return (
    <section className="flex flex-col gap-md">
      <div className="flex items-center gap-sm">
        <h2 className="text-base font-semibold text-muted">{splitLabel}</h2>
        {tag && <Badge>{tag}</Badge>}
      </div>
      <div className="flex flex-col gap-md">
        {routines.map((routine) => (
          <RoutineCard key={routine.id} routine={routine} onStart={onStart} />
        ))}
      </div>
    </section>
  );
}
