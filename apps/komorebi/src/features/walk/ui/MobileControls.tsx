import { Joystick } from './Joystick';

type Props = {
  isReady: boolean;
  isPaused: boolean;
  isSprinting: boolean;
  onInput: (key: string, pressed: boolean) => void;
  onToggleSprint: () => void;
};

export function MobileControls({ isReady, isPaused, isSprinting, onInput, onToggleSprint }: Props) {
  return (
    <div className="mobile-controls" aria-label="터치 이동">
      <Joystick disabled={!isReady || isPaused} onInput={onInput} />
      <div className="action-buttons">
        <button
          className="jump-button"
          aria-label="점프"
          disabled={!isReady || isPaused}
          onClick={() => onInput(' ', true)}
        >
          점프 ↑
        </button>
        <button
          className="run-button"
          disabled={!isReady || isPaused}
          aria-pressed={isSprinting}
          onClick={onToggleSprint}
        >
          {isSprinting ? '걷기로 전환' : '달리기'}
        </button>
      </div>
    </div>
  );
}
