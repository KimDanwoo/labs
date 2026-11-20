import { BALL_PHASE, canReturnBall, type BallGame } from '@views/walk/model/ballGame';

export function ballMessage(game: BallGame, name: string): string {
  if (game.phase === BALL_PHASE.complete) return '다섯 번이나 이어 받았다! 다음에도 같이 놀자.';
  if (game.phase === BALL_PHASE.missed) return '앗, 공이 지나갔다. 한 번 더 해 볼까?';
  if (game.phase === BALL_PHASE.ready) return `${name}가 공을 던질 준비를 해요.`;
  if (game.phase === BALL_PHASE.caught) return '잡았다! 다시 친구에게 던져요.';
  if (canReturnBall(game)) return '지금! 공을 받아 돌려줘요.';
  if (game.phase === BALL_PHASE.returning) return `${name}에게 공이 가고 있어요.`;
  return '공이 가까워지면 E를 누르세요.';
}
