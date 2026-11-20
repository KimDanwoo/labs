import { KEY_BINDINGS } from '@views/ride/model/runner-control/constants';
import { resetRunnerInput, setRunnerAction } from '@views/ride/model/runner-control/store/runnerInput';
import { useEffect } from 'react';

export function useRunnerControls(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.target instanceof Element) {
        if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
        const isSpaceOnControl = event.code === 'Space' && event.target.closest('button, a, summary');
        if (isSpaceOnControl) return;
      }
      const action = KEY_BINDINGS[event.code];
      if (!action) return;
      event.preventDefault();
      setRunnerAction(action, true, event.code);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const action = KEY_BINDINGS[event.code];
      if (action) setRunnerAction(action, false, event.code);
    };

    const handleVisibility = () => {
      if (document.hidden) resetRunnerInput();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetRunnerInput);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      resetRunnerInput();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetRunnerInput);
    };
  }, []);
}
