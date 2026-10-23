'use client';

import { padDirection } from '@features/walk/lib/input';
import { useEffect, useEffectEvent, useRef, type PointerEvent } from 'react';

const directions = ['w', 'a', 's', 'd'] as const;
type Props = { onInput: (key: string, pressed: boolean) => void; disabled: boolean };

export function Joystick({ onInput, disabled }: Props) {
  const pointer = useRef<number | null>(null);
  const pad = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  // The thumb follows the finger every pointermove; styling it directly avoids a React render per event.
  function placeThumb(x: number, y: number) {
    if (thumb.current) thumb.current.style.transform = `translate(${x}px, ${y}px)`;
  }
  function stop() {
    const id = pointer.current;
    pointer.current = null;
    if (id !== null && pad.current?.hasPointerCapture(id)) pad.current.releasePointerCapture(id);
    placeThumb(0, 0);
    directions.forEach((key) => onInput(key, false));
  }
  const handleLeave = useEffectEvent(stop);
  const releaseKeys = useEffectEvent(() => directions.forEach((key) => onInput(key, false)));
  useEffect(() => {
    window.addEventListener('blur', handleLeave);
    document.addEventListener('visibilitychange', handleLeave);
    return () => {
      window.removeEventListener('blur', handleLeave);
      document.removeEventListener('visibilitychange', handleLeave);
      releaseKeys();
    };
  }, []);
  const handleDisabled = useEffectEvent(stop);
  useEffect(() => {
    if (disabled) handleDisabled();
  }, [disabled]);
  function move(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = bounds.width * 0.3;
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    const ratio = Math.min(1, radius / Math.max(1, Math.hypot(x, y)));
    placeThumb(x * ratio, y * ratio);
    const active = padDirection(x / radius, y / radius);
    directions.forEach((key) => onInput(key, active.includes(key)));
  }
  return (
    <div
      ref={pad}
      className="joystick"
      role="group"
      aria-label="이동 패드: 원하는 방향으로 끌고 손을 떼면 정지"
      aria-disabled={disabled}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (disabled || pointer.current !== null) return;
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={move}
      onPointerUp={(event) => {
        if (pointer.current === event.pointerId) stop();
      }}
      onPointerCancel={(event) => {
        if (pointer.current === event.pointerId) stop();
      }}
      onLostPointerCapture={(event) => {
        if (pointer.current === event.pointerId) stop();
      }}
    >
      <span className="joystick-arrows" aria-hidden="true">
        ✥
      </span>
      <span ref={thumb} className="joystick-thumb" aria-hidden="true" />
      <span className="joystick-label">이동</span>
    </div>
  );
}
