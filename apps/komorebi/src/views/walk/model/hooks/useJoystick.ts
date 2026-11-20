import { useEffect, useEffectEvent, useRef, type PointerEvent } from 'react';

import { JOYSTICK_DIRECTIONS, JOYSTICK_REACH_RATIO } from '@views/walk/config/joystick';
import { padDirection } from '@views/walk/lib/input';

interface JoystickInput {
  onInput: (key: string, pressed: boolean) => void;
  disabled: boolean;
}

export function useJoystick({ onInput, disabled }: JoystickInput) {
  const pointer = useRef<number | null>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  function placeThumb(x: number, y: number) {
    if (thumbRef.current) thumbRef.current.style.transform = `translate(${x}px, ${y}px)`;
  }
  function stop() {
    const id = pointer.current;
    pointer.current = null;
    const pad = padRef.current;
    const isCapturing = id !== null && pad?.hasPointerCapture(id) === true;
    if (isCapturing) pad?.releasePointerCapture(id);
    placeThumb(0, 0);
    JOYSTICK_DIRECTIONS.forEach((key) => onInput(key, false));
  }
  const handleLeave = useEffectEvent(stop);
  const releaseKeys = useEffectEvent(() => JOYSTICK_DIRECTIONS.forEach((key) => onInput(key, false)));
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
    const radius = bounds.width * JOYSTICK_REACH_RATIO;
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    const ratio = Math.min(1, radius / Math.max(1, Math.hypot(x, y)));
    placeThumb(x * ratio, y * ratio);
    const active = padDirection(x / radius, y / radius);
    JOYSTICK_DIRECTIONS.forEach((key) => onInput(key, active.includes(key)));
  }

  function stopPointer(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current === event.pointerId) stop();
  }

  const padHandlers = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (pointer.current !== null) return;
      pointer.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      move(event);
    },
    onPointerMove: move,
    onPointerUp: stopPointer,
    onPointerCancel: stopPointer,
    onLostPointerCapture: stopPointer,
  };

  return { padRef, thumbRef, padHandlers };
}
