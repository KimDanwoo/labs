export const SLITHERLINK_COPY = {
  title: '슬리더링크',
  boardLabel: '슬리더링크 판',
  generating: '새 퍼즐을 만드는 중…',
  wrongLoop: '아직 아니에요. 숫자를 다시 살펴보세요.',
  levelGroup: '난이도',
  timerLabel: '걸린 시간',
  hintsLabel: '남은 힌트',
  undo: '되돌리기',
  redo: '다시하기',
  hint: '힌트',
  newGame: '새 게임',
  resultTitle: '고리를 완성했어요!',
  resultTime: '완료 시간',
  resultNext: '다음 판',
  confirmTitle: '새 게임을 시작할까요?',
  confirmMessage: '지금 그린 선은 저장되지 않고 사라져요.',
  confirmKeep: '계속하기',
  rulesTitle: '규칙',
} as const;

export const SLITHERLINK_RULES = [
  '점을 이어 끊기지 않는 고리 하나를 만들어요. 고리는 갈라지거나 겹치지 않아요.',
  '칸의 숫자는 그 칸을 둘러싼 선의 개수예요. 숫자가 없는 칸은 몇 개든 괜찮아요.',
  '변을 누르면 선 → X → 빈칸 순으로 바뀌어요. 점에서 점으로 끌면 선이 이어져요.',
] as const;
