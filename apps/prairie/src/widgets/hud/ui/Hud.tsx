'use client';

import { useState } from 'react';
import { PrairieMark } from './PrairieMark';
import { RideControls } from './RideControls';
import { RiverGuide } from './RiverGuide';

export function Hud() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="prairie-hud pointer-events-none absolute inset-0 z-40 flex flex-col justify-between gap-lg text-prairie-paper">
      <header className="flex items-start justify-between gap-md">
        {isVisible && <PrairieMark />}
        <div className="ml-auto flex flex-col items-end gap-md">
          {isVisible && <RiverGuide />}
          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-pressed={!isVisible}
            aria-label={isVisible ? '안내를 숨기고 풍경만 보기' : '화면 안내 다시 보기'}
            className="pointer-events-auto rounded-full border border-prairie-paper/25 bg-prairie-ink/55 px-md py-sm text-xs backdrop-blur-md transition-colors hover:bg-prairie-ink/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-prairie-accent"
          >
            {isVisible ? '풍경만 보기 ↗' : '안내 보기 +'}
          </button>
        </div>
      </header>

      {isVisible && (
        <footer className="flex flex-col gap-lg">
          <div className="flex items-end justify-between gap-lg">
            <div>
              <p className="mb-sm text-xs tracking-widest text-prairie-accent">WANDER AT YOUR OWN PACE</p>
              <h1 className="text-3xl font-medium leading-tight sm:text-5xl">바람이 이끄는 대로.</h1>
              <p className="mt-md text-sm text-prairie-paper/80">정해진 길도, 서두를 이유도 없는 곳.</p>
            </div>
            <p className="hidden text-right font-mono text-xs leading-loose tracking-widest text-prairie-paper/60 md:block">
              OPEN FIELDS
              <br />
              OPEN POSSIBILITIES
            </p>
          </div>
          <div className="flex items-center justify-between gap-lg border-t border-prairie-paper/25 pt-md">
            <RideControls />
            <span className="hidden shrink-0 text-xs text-prairie-paper/60 lg:block">그저, 달려도 좋아요.</span>
          </div>
        </footer>
      )}
    </div>
  );
}
