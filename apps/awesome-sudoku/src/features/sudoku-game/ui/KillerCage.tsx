import { KillerCageLine } from '@entities/game/ui';
import { useKillerCage } from '@features/sudoku-game/model/hooks';
import { memo, useMemo } from 'react';

import { CageSumLabel } from './CageSumLabel';

export const KillerCage = memo(() => {
  const { overlayRef, cageInfo, cellSize } = useKillerCage();

  const fontSize = useMemo(() => `${Math.max(0.5, Math.min(0.65, cellSize / 75))}rem`, [cellSize]);

  const svgStyle = useMemo(() => ({ position: 'absolute' as const, top: 0, left: 0 }), []);

  return (
    <div ref={overlayRef} className="absolute top-0 left-0 pointer-events-none z-10">
      <svg aria-hidden="true" width="100%" height="100%" style={svgStyle}>
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

KillerCage.displayName = 'KillerCage';
