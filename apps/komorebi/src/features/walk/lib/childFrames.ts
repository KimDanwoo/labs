const WALK_COLUMNS = [1, 2, 3, 4] as const;
// Passing poses separate the two extended running contacts.
const RUN_COLUMNS = [5, 2, 6, 4] as const;
const FULL_CYCLE = Math.PI * 2;

export function atlasColumn(isAirborne: boolean, isStepping: boolean, phase: number, running = false) {
  if (isAirborne) return 7;
  if (!isStepping) return 0;
  const columns = running ? RUN_COLUMNS : WALK_COLUMNS;
  const cycle = ((phase % FULL_CYCLE) + FULL_CYCLE) % FULL_CYCLE;
  return columns[Math.floor((cycle / FULL_CYCLE) * columns.length)]!;
}
