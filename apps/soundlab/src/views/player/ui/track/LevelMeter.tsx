'use client';

import { LEVEL_BAR_TRANSFORMS } from '@views/player/config/display';
import { useLevelMeter } from '@views/player/model/hooks/useLevelMeter';

export function LevelMeter() {
  const rootRef = useLevelMeter();

  return (
    <span ref={rootRef} aria-hidden className="flex h-[11px] shrink-0 items-end gap-2xs">
      {LEVEL_BAR_TRANSFORMS.map((transform) => (
        <i key={transform} className="bg-brass w-2xs h-[11px] origin-bottom" style={{ transform }} />
      ))}
    </span>
  );
}
