import { useEffect } from 'react';
import { KEY_BINDINGS } from '../constants';
import { resetRunnerInput, setRunnerAction } from '../store/runner-input';

// 키보드 입력을 공유 스토어에 반영한다(WASD + 방향키). 터치 컨트롤과 동일 스토어를 쓴다.
export function useRunnerControls(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const action = KEY_BINDINGS[event.code];
      if (!action) return;
      event.preventDefault();
      setRunnerAction(action, true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const action = KEY_BINDINGS[event.code];
      if (action) setRunnerAction(action, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetRunnerInput);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetRunnerInput);
    };
  }, []);
}
