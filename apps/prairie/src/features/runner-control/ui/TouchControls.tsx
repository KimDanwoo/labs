'use client';

import type { PointerEvent, ReactNode } from 'react';
import type { RunnerAction } from '../model/constants';
import { setRunnerAction } from '../model/store/runner-input';

type ControlButtonProps = {
  action: RunnerAction;
  label: ReactNode;
  ariaLabel: string;
};

// 누르는 동안 액션을 true로. 포인터 캡처로 손가락이 버튼 밖으로 미끄러져도 release를 놓치지 않는다.
function ControlButton({ action, label, ariaLabel }: ControlButtonProps) {
  const press = (event: PointerEvent<HTMLButtonElement>, pressed: boolean) => {
    if (pressed) event.currentTarget.setPointerCapture(event.pointerId);
    setRunnerAction(action, pressed);
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="pointer-events-auto flex h-16 w-16 touch-none select-none items-center justify-center rounded-full bg-background/55 text-2xl text-foreground shadow-glow backdrop-blur-md transition-colors active:bg-primary/80 active:text-primary-foreground"
      onPointerDown={(event) => press(event, true)}
      onPointerUp={(event) => press(event, false)}
      onPointerCancel={(event) => press(event, false)}
      onLostPointerCapture={() => setRunnerAction(action, false)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {label}
    </button>
  );
}

// 모바일/터치 전용 온스크린 컨트롤. (pointer: coarse) 미디어로만 노출돼 데스크톱에선 DOM에서 사라진다.
export function TouchControls() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 hidden select-none items-end justify-between p-lg pointer-coarse:flex">
      <div className="flex gap-md">
        <ControlButton action="left" label="◀" ariaLabel="왼쪽으로 조향" />
        <ControlButton action="right" label="▶" ariaLabel="오른쪽으로 조향" />
      </div>
      <div className="flex flex-col gap-md">
        <ControlButton action="forward" label="▲" ariaLabel="가속" />
        <ControlButton action="backward" label="▼" ariaLabel="감속 · 후진" />
      </div>
    </div>
  );
}
