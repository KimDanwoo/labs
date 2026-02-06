import { KillerCageLine } from "@entities/board/ui";
import { useKillerCage } from "@features/sudoku-game/model/hooks";
import { memo, useMemo } from "react";

interface CageSumLabelProps {
  sum: number;
  x: number;
  y: number;
  fontSize: string;
}

const CageSumLabel = memo<CageSumLabelProps>(({ sum, x, y, fontSize }) => (
  <div
    className="absolute font-medium text-blue-600 z-20"
    style={{
      top: `${y}px`,
      left: `${x}px`,
      fontSize,
      lineHeight: "1",
      backgroundColor: "white",
    }}
  >
    {sum}
  </div>
));

CageSumLabel.displayName = "CageSumLabel";

export const KillerCage = memo(() => {
  const { overlayRef, cageInfo, cellSize } = useKillerCage();

  const fontSize = useMemo(
    () => `${Math.max(0.5, Math.min(0.65, cellSize / 75))}rem`,
    [cellSize],
  );

  const svgStyle = useMemo(
    () => ({ position: "absolute" as const, top: 0, left: 0 }),
    [],
  );

  return (
    <div ref={overlayRef} className="absolute top-0 left-0 pointer-events-none z-10">
      <svg width="100%" height="100%" style={svgStyle}>
        {cageInfo.paths.map(({ id, path }) => (
          <KillerCageLine key={`cage-${id}`} path={path} />
        ))}
      </svg>

      {cageInfo.sums.map(({ id, sum, x, y }) => (
        <CageSumLabel key={`sum-${id}`} sum={sum} x={x} y={y} fontSize={fontSize} />
      ))}
    </div>
  );
});

KillerCage.displayName = "KillerCage";
