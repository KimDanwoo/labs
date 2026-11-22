import { cn } from '@shared/lib/cn';
import { WALLS_COPY } from '@views/walls/config/copy';
import { edgeCenter } from '@views/walls/lib/edgeGeometry';
import { isEastEdge } from '@views/walls/lib/grid';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

export function WallChoices() {
  const { wallOptions, pickWall } = useWallsContext();

  return wallOptions.map((edge) => (
    <button
      key={edge}
      type="button"
      aria-label={WALLS_COPY.wallOption}
      onClick={() => pickWall(edge)}
      style={edgeCenter(edge)}
      className={cn(
        'absolute z-20 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-dashed border-goban-line bg-white/80 before:absolute before:-inset-2 hover:animate-none hover:border-solid hover:bg-white focus-visible:animate-none focus-visible:bg-white focus-visible:outline-none',
        isEastEdge(edge) ? 'h-[11%] w-[3.4%]' : 'h-[3.4%] w-[11%]',
      )}
    />
  ));
}
