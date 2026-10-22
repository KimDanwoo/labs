'use client';

import type { RunnerAction } from '@features/runner-control/model/constants';
import { setRunnerAction } from '@features/runner-control/model/store';
import type { PointerEvent } from 'react';

function handlePress(event: PointerEvent<HTMLButtonElement>, action: RunnerAction) {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  setRunnerAction(action, true);
}

export function TouchActions() {
  return (
    <div className="prairie-touch-actions absolute right-md bottom-lg z-40 hidden gap-xs text-prairie-paper grid-cols-2 pointer-coarse:grid">
      <button
        type="button"
        aria-label="길게 눌러 질주"
        onPointerDown={(event) => handlePress(event, 'sprint')}
        onPointerUp={() => setRunnerAction('sprint', false)}
        onPointerCancel={() => setRunnerAction('sprint', false)}
        onLostPointerCapture={() => setRunnerAction('sprint', false)}
        className="flex size-14 touch-none flex-col items-center justify-center gap-xs rounded-full border border-prairie-paper/30 bg-prairie-ink/65 text-xs backdrop-blur-md active:bg-prairie-ink focus-visible:outline-2 focus-visible:outline-prairie-accent"
      >
        <span aria-hidden className="text-xl">
          »
        </span>
        질주
      </button>
      <button
        type="button"
        aria-label="비행 중 제로백 가속"
        onPointerDown={(event) => handlePress(event, 'dash')}
        onPointerUp={() => setRunnerAction('dash', false)}
        onPointerCancel={() => setRunnerAction('dash', false)}
        onLostPointerCapture={() => setRunnerAction('dash', false)}
        className="flex size-14 touch-none flex-col items-center justify-center gap-xs rounded-full border border-prairie-paper/30 bg-prairie-ink/65 text-xs backdrop-blur-md active:bg-prairie-ink focus-visible:outline-2 focus-visible:outline-prairie-accent"
      >
        <span aria-hidden className="text-xl">
          ⚡
        </span>
        제로백
      </button>
      <button
        type="button"
        aria-label="비행 중 회전 (충분히 높이 오른 뒤 사용)"
        onPointerDown={(event) => handlePress(event, 'spin')}
        onPointerUp={() => setRunnerAction('spin', false)}
        onPointerCancel={() => setRunnerAction('spin', false)}
        onLostPointerCapture={() => setRunnerAction('spin', false)}
        className="flex size-14 touch-none flex-col items-center justify-center gap-xs rounded-full border border-prairie-paper/30 bg-prairie-ink/65 text-xs backdrop-blur-md active:bg-prairie-ink focus-visible:outline-2 focus-visible:outline-prairie-accent"
      >
        <span aria-hidden className="text-xl">
          ↻
        </span>
        회전
      </button>
      <button
        type="button"
        aria-label="길게 눌러 하강, 지면 가까이에서 자동 감속"
        onPointerDown={(event) => handlePress(event, 'descend')}
        onPointerUp={() => setRunnerAction('descend', false)}
        onPointerCancel={() => setRunnerAction('descend', false)}
        onLostPointerCapture={() => setRunnerAction('descend', false)}
        className="flex size-14 touch-none flex-col items-center justify-center gap-xs rounded-full border border-prairie-paper/30 bg-prairie-ink/65 text-xs backdrop-blur-md active:bg-prairie-ink focus-visible:outline-2 focus-visible:outline-prairie-accent"
      >
        <span aria-hidden className="text-xl">
          ↓
        </span>
        하강
      </button>
      <button
        type="button"
        aria-label="누르면 점프, 길게 눌러 비행"
        onPointerDown={(event) => handlePress(event, 'jump')}
        onPointerUp={() => setRunnerAction('jump', false)}
        onPointerCancel={() => setRunnerAction('jump', false)}
        onLostPointerCapture={() => setRunnerAction('jump', false)}
        className="flex size-14 touch-none flex-col items-center justify-center gap-xs rounded-full border border-prairie-paper/30 bg-prairie-ink/65 text-xs backdrop-blur-md active:bg-prairie-ink focus-visible:outline-2 focus-visible:outline-prairie-accent"
      >
        <span aria-hidden className="text-xl">
          ↑
        </span>
        비행
      </button>
    </div>
  );
}
