import { GRID_VIEW } from '@views/gomoku/config/boardView';

export function BoardGrid() {
  const { start, end } = GRID_VIEW;

  return (
    <svg aria-hidden="true" viewBox={GRID_VIEW.viewBox} className="absolute inset-0 size-full">
      <g className="stroke-goban-line" strokeWidth={GRID_VIEW.lineWidth} strokeLinecap="square">
        {GRID_VIEW.lines.map((at) => (
          <path key={at} d={`M${start} ${at}H${end}M${at} ${start}V${end}`} />
        ))}
      </g>
      <g className="fill-goban-line">
        {GRID_VIEW.stars.map(({ x, y }) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={GRID_VIEW.starRadius} />
        ))}
      </g>
    </svg>
  );
}
