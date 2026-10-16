'use client';

import { JOYSTICK } from '@features/runner-control/model/constants';
import { setRunnerAction } from '@features/runner-control/model/store';
import { type PointerEvent, useRef, useState } from 'react';
import { TouchActions } from './TouchActions';

type Vec = { x: number; y: number };

// 손 댄 자리에 조이스틱이 생기고, 끄는 방향으로 가속·조향한다(플로팅 조이스틱).
// (pointer: coarse)에서만 노출 → PC에선 DOM에서 사라져 캔버스 드래그(시점 회전)와 충돌하지 않는다.
export function TouchControls() {
  const [origin, setOrigin] = useState<Vec | null>(null);
  const [knob, setKnob] = useState<Vec>({ x: 0, y: 0 });
  const originRef = useRef<Vec>({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  const applyDirection = (dx: number, dy: number) => {
    const { deadzone } = JOYSTICK;
    setRunnerAction('forward', dy < -deadzone); // 화면 위로 = 가속
    setRunnerAction('backward', dy > deadzone);
    setRunnerAction('left', dx < -deadzone);
    setRunnerAction('right', dx > deadzone);
  };

  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    originRef.current = { x: event.clientX, y: event.clientY };
    setOrigin({ x: event.clientX, y: event.clientY });
    setKnob({ x: 0, y: 0 });
  };

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    let dx = event.clientX - originRef.current.x;
    let dy = event.clientY - originRef.current.y;
    const distance = Math.hypot(dx, dy);
    if (distance > JOYSTICK.maxRadius) {
      const scale = JOYSTICK.maxRadius / distance;
      dx *= scale;
      dy *= scale;
    }
    setKnob({ x: dx, y: dy });
    applyDirection(dx, dy);
  };

  const handleEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    pointerIdRef.current = null;
    setOrigin(null);
    setRunnerAction('forward', false);
    setRunnerAction('backward', false);
    setRunnerAction('left', false);
    setRunnerAction('right', false);
  };

  return (
    <div className="absolute inset-0 z-30 hidden touch-none select-none pointer-coarse:block">
      <div
        className="absolute inset-0"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
        onContextMenu={(event) => event.preventDefault()}
      />

      {origin ? (
        <>
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-prairie-paper/50 bg-prairie-ink/20 backdrop-blur-sm"
            style={{ left: origin.x, top: origin.y, width: JOYSTICK.maxRadius * 2, height: JOYSTICK.maxRadius * 2 }}
          />
          <span
            className="pointer-events-none absolute size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-prairie-paper/60 bg-prairie-paper/60"
            style={{ left: origin.x + knob.x, top: origin.y + knob.y }}
          />
        </>
      ) : null}
      <TouchActions />
    </div>
  );
}
