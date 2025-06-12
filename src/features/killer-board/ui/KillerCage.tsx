import { KillerCageLine } from "@entities/cell/ui";
import { useKillerCage } from "@features/game-board/model/hooks";

export const KillerCage: React.FC = () => {
  const { overlayRef, cageInfo, cellSize } = useKillerCage();

  return (
    <div ref={overlayRef} className="absolute top-0 left-0 pointer-events-none z-10">
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
        {cageInfo.paths.map(({ id, path }) => (
          <KillerCageLine key={`cage-${id}`} path={path} />
        ))}
      </svg>

      {cageInfo.sums.map(({ id, sum, x, y }) => (
        <div
          key={`sum-${id}`}
          className="absolute font-medium text-blue-600 z-20"
          style={{
            top: `${y}px`,
            left: `${x}px`,
            fontSize: `${Math.max(0.5, Math.min(0.65, cellSize / 75))}rem`,
            lineHeight: "1",
            backgroundColor: "white",
          }}
        >
          {sum}
        </div>
      ))}
    </div>
  );
};
