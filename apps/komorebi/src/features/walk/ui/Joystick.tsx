'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { padDirection } from '../lib/input';

const directions = ['w', 'a', 's', 'd'] as const;
export function Joystick({
  onInput,
  disabled,
}: {
  onInput: (key: string, pressed: boolean) => void;
  disabled: boolean;
}) {
  const pointer = useRef<number | null>(null);
  const input = useRef(onInput);
  input.current = onInput;
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  function stop() {
    pointer.current = null;
    setOffset({ x: 0, y: 0 });
    directions.forEach((key) => input.current(key, false));
  }
  useEffect(() => {
    const clear = () => stop();
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    return () => {
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
      directions.forEach((key) => input.current(key, false));
    };
  }, []);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);
  function move(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = bounds.width * 0.3;
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    const ratio = Math.min(1, radius / Math.max(1, Math.hypot(x, y)));
    setOffset({ x: x * ratio, y: y * ratio });
    const active = padDirection(x / radius, y / radius);
    directions.forEach((key) => input.current(key, active.includes(key)));
  }
  return (
    <div
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
      <span
        className="joystick-thumb"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        aria-hidden="true"
      />
      <span className="joystick-label">이동</span>
    </div>
  );
}
