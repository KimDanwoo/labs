'use client';

import { ExplorationHud } from '@views/ride/ui/exploration/ExplorationHud';
import { PrairieMark } from '@views/ride/ui/hud/PrairieMark';
import { RideCameraControls } from '@views/ride/ui/hud/RideCameraControls';
import { RideControls } from '@views/ride/ui/hud/RideControls';
import { RideTelemetry } from '@views/ride/ui/hud/RideTelemetry';
import { RiverGuide } from '@views/ride/ui/hud/RiverGuide';
import { useState } from 'react';

export function Hud() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="prairie-hud pointer-events-none absolute inset-0 z-40 flex flex-col justify-between gap-lg text-prairie-paper">
      <header className="flex items-start justify-between gap-md">
        {isVisible && <PrairieMark />}
        <div className="ml-auto flex flex-col items-end gap-sm">
          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-pressed={!isVisible}
            aria-label={isVisible ? '안내를 숨기고 풍경만 보기' : '화면 안내 다시 보기'}
            className="pointer-events-auto rounded-full border border-prairie-paper/25 bg-prairie-ink/55 px-md py-sm text-xs backdrop-blur-md transition-colors hover:bg-prairie-ink/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-prairie-accent"
          >
            {isVisible ? '풍경만 보기 ↗' : '안내 보기 +'}
          </button>
          {isVisible && <RiverGuide />}
        </div>
      </header>

      {isVisible && <ExplorationHud />}

      {isVisible && (
        <footer className="flex items-end justify-between gap-sm">
          <div className="flex flex-col gap-md">
            <RideTelemetry />
            <RideCameraControls />
          </div>
          <RideControls />
        </footer>
      )}
    </div>
  );
}
