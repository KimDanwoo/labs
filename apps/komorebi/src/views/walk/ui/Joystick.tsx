'use client';

import { useJoystick } from '../model/hooks/useJoystick';

interface JoystickProps {
  onInput: (key: string, pressed: boolean) => void;
  disabled: boolean;
}

export function Joystick({ onInput, disabled }: JoystickProps) {
  const { padRef, thumbRef, padHandlers } = useJoystick({ onInput, disabled });

  return (
    <div
      ref={padRef}
      className="joystick"
      role="group"
      aria-label="이동 패드: 원하는 방향으로 끌고 손을 떼면 정지"
      aria-disabled={disabled}
      onContextMenu={(event) => event.preventDefault()}
      {...padHandlers}
    >
      <span className="joystick-arrows" aria-hidden="true">
        ✥
      </span>
      <span ref={thumbRef} className="joystick-thumb" aria-hidden="true" />
      <span className="joystick-label">이동</span>
    </div>
  );
}
