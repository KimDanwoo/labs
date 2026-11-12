import { useId, type JSX } from 'react';
import { gameKey } from '../lib/input';
import { BALL_PHASE, BALL_TIMING, canReturnBall, type BallGame } from '../model/ballGame';
import { useBallGame } from '../model/hooks/useBallGame';
import { useModal } from '../model/hooks/useModal';
import { Icon } from './Icon';

type Props = { name: string; onFrame: (frame: BallGame | null) => boolean; onClose: () => void };
function ballMessage(game: BallGame, name: string): string {
  if (game.phase === BALL_PHASE.complete) return '다섯 번이나 이어 받았다! 다음에도 같이 놀자.';
  if (game.phase === BALL_PHASE.missed) return '앗, 공이 지나갔다. 한 번 더 해 볼까?';
  if (game.phase === BALL_PHASE.ready) return `${name}가 공을 던질 준비를 해요.`;
  if (game.phase === BALL_PHASE.caught) return '잡았다! 다시 친구에게 던져요.';
  if (canReturnBall(game)) return '지금! 공을 받아 돌려줘요.';
  if (game.phase === BALL_PHASE.returning) return `${name}에게 공이 가고 있어요.`;
  return '공이 가까워지면 E를 누르세요.';
}
export function BallGameHud({ name, onFrame, onClose }: Props): JSX.Element {
  const ref = useModal(true);
  const titleId = useId();
  const { game, handleReturn, handleRetry } = useBallGame({ onFrame });
  const isFinished = game.phase === BALL_PHASE.complete;
  const hasMissed = game.phase === BALL_PHASE.missed;
  const canCatch = canReturnBall(game);
  const message = ballMessage(game, name);
  function handleCatch() {
    handleReturn();
    ref.current?.focus({ preventScroll: true });
  }
  function handleRestart() {
    handleRetry();
    ref.current?.focus({ preventScroll: true });
  }
  return (
    <dialog
      ref={ref}
      className="map-dialog schoolmate-dialog ball-game"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-phase={game.phase}
      data-rallies={game.rallies}
      data-can-catch={canCatch}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (gameKey(event) === 'e' && !event.repeat) {
          event.preventDefault();
          event.stopPropagation();
          handleCatch();
        }
      }}
    >
      <div className="dialog-heading">
        <div>
          <h2 id={titleId}>{name}와 공 주고받기</h2>
        </div>
        <button className="tool" aria-label="공놀이 끝내기" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <p role="status">{message}</p>
      <div className="ball-score">
        <progress aria-label="이어 받은 공" value={game.rallies} max={BALL_TIMING.target} />
        <span>
          {game.rallies} / {BALL_TIMING.target}
        </span>
      </div>
      <div className="schoolmate-actions">
        {hasMissed || isFinished ? (
          <button className="wardrobe-done" onClick={handleRestart}>
            다시 놀기
          </button>
        ) : (
          <button className="wardrobe-done" onClick={handleCatch} disabled={!canCatch}>
            받아 돌려주기 <kbd>E</kbd>
          </button>
        )}
        <button className="wardrobe-done" onClick={onClose}>
          산책 계속하기
        </button>
      </div>
    </dialog>
  );
}
