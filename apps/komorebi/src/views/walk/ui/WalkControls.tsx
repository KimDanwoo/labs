import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { Joystick } from '@views/walk/ui/Joystick';

export function WalkControls() {
  const { engine, isReady, isPaused, isSprinting, toggleSprint } = useWalkContext();
  const isDisabled = !isReady || isPaused;
  const handleInput = (key: string, pressed: boolean) => engine.current?.setInput(key, pressed);

  return (
    <div className="mobile-controls" aria-label="터치 이동">
      <Joystick disabled={isDisabled} onInput={handleInput} />
      <div className="action-buttons">
        <button className="jump-button" aria-label="점프" disabled={isDisabled} onClick={() => handleInput(' ', true)}>
          점프 ↑
        </button>
        <button className="run-button" disabled={isDisabled} aria-pressed={isSprinting} onClick={toggleSprint}>
          {isSprinting ? '달리기로 전환' : '전력 질주'}
        </button>
      </div>
    </div>
  );
}
