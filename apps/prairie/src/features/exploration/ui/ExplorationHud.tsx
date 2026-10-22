'use client';

import { resetCourse, useExploration } from '@shared/exploration/store';
import { GATES, LANDMARKS } from '@shared/exploration/world';
import { useState } from 'react';

export function ExplorationHud() {
  const progress = useExploration();
  const [open, setOpen] = useState(false);
  const button =
    'pointer-events-auto rounded-full border border-prairie-paper/25 bg-prairie-ink/55 px-4 py-2 text-xs backdrop-blur-md focus-visible:outline-2 focus-visible:outline-prairie-accent';
  return (
    <section
      className="absolute left-4 top-24 max-w-[min(340px,calc(100vw-2rem))] text-prairie-paper sm:left-8"
      aria-label="초원 탐험"
    >
      <button
        className={button}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="exploration-journal"
      >
        발견 기록 {progress.discovered.length} / {LANDMARKS.length}
      </button>
      {open && (
        <div
          id="exploration-journal"
          className="pointer-events-auto mt-2 rounded-2xl border border-prairie-paper/20 bg-prairie-ink/80 p-4 text-sm backdrop-blur-md"
        >
          <p className="mb-3 text-xs opacity-75">
            출발점 앞 하늘의 별빛 고리에서 바람길이 시작돼요.
            <br />
            고리는 출발점에서 멀어지는 방향으로 통과하세요.
          </p>
          <ul className="space-y-3">
            {LANDMARKS.map((place) => (
              <li key={place.id}>
                {progress.discovered.includes(place.id) ? (
                  <>
                    <span>{place.name}</span>
                    <p className="mt-1 text-xs opacity-70">{place.description}</p>
                  </>
                ) : (
                  <span className="opacity-60">아직 발견하지 않은 장소</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs">
            바람길 최고 기록 · {progress.best === null ? '아직 기록이 없어요' : `${progress.best.toFixed(1)}초`}
          </p>
          <p className="mt-2 text-xs opacity-60">
            {progress.storageUnavailable
              ? '저장 공간에 접근할 수 없어 이번 탐험에서만 기록돼요.'
              : '발견과 최고 기록은 이 브라우저에 저장돼요.'}
          </p>
        </div>
      )}
      {progress.active && (
        <div className="mt-3 rounded-xl bg-prairie-ink/65 px-4 py-3 text-sm backdrop-blur-md">
          <p>
            바람길 · {progress.nextGate} / {GATES.length} · {progress.elapsed.toFixed(1)}초
          </p>
          <button className={`${button} mt-2`} onClick={resetCourse}>
            코스 나가기
          </button>
        </div>
      )}
      {progress.nextGate === GATES.length && (
        <button className={`${button} mt-3 block`} onClick={resetCourse}>
          다시 도전 · 첫 고리로
        </button>
      )}
      <div role="status" aria-live="polite" aria-atomic="true" className="mt-3 text-sm drop-shadow-md">
        {progress.notice || progress.nearby}
      </div>
    </section>
  );
}
