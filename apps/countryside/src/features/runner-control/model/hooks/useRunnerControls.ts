import { useEffect, useRef } from 'react';
import { KEY_BINDINGS, type RunnerAction } from '../constants';

export type RunnerInput = Record<RunnerAction, boolean>;

function createInput(): RunnerInput {
  return { forward: false, backward: false, left: false, right: false };
}

// 눌린 키를 ref에 모은다. useFrame 루프가 매 프레임 읽되 리렌더는 일으키지 않는다.
export function useRunnerControls(): { current: RunnerInput } {
  const inputRef = useRef<RunnerInput>(createInput());

  useEffect(() => {
    const setAction = (code: string, pressed: boolean) => {
      const action = KEY_BINDINGS[code];
      if (!action) return;
      inputRef.current[action] = pressed;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code in KEY_BINDINGS) event.preventDefault();
      setAction(event.code, true);
    };
    const handleKeyUp = (event: KeyboardEvent) => setAction(event.code, false);
    const reset = () => {
      inputRef.current = createInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', reset);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', reset);
    };
  }, []);

  return inputRef;
}
