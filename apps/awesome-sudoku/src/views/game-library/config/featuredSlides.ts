import { QuickGomoku } from '@views/game-library/ui/QuickGomoku';
import { QuickKiller } from '@views/game-library/ui/QuickKiller';
import { QuickLoop } from '@views/game-library/ui/QuickLoop';
import { QuickPuzzle } from '@views/game-library/ui/QuickPuzzle';
import { QuickWord } from '@views/game-library/ui/QuickWord';

export const SLIDES = [
  {
    id: 'gomoku',
    layout: 'board',
    title: '오목',
    hint: '흑돌로 시작해 두 수 안에 다섯 알을 이으세요. 백이 한 수를 막아요.',
    Play: QuickGomoku,
  },
  {
    id: 'sudoku',
    layout: 'tools',
    title: '미니 스도쿠',
    hint: '빈칸을 골라 1부터 6까지 넣으세요. 가로줄, 세로줄, 2×3 구역에서 숫자를 한 번씩 써요.',
    Play: QuickPuzzle,
  },
  {
    id: 'slitherlink',
    layout: 'board',
    title: '슬리더링크',
    hint: '점 사이를 눌러 선을 이으세요. 각 칸의 숫자만큼 선이 닿고, 모든 선이 한 고리로 이어져야 해요.',
    Play: QuickLoop,
  },
  {
    id: 'guess',
    layout: 'word',
    title: '단어 맞히기',
    hint: '주제와 글자 수를 보고 정답 한 단어를 입력하세요. 막히면 다음 힌트나 초성을 볼 수 있어요.',
    Play: QuickWord,
  },
  {
    id: 'killer',
    layout: 'tools',
    title: '킬러 스도쿠',
    hint: '칸을 골라 1부터 6까지 넣으세요. 스도쿠 규칙에 더해, 점선 구역마다 숫자의 합을 맞추고 중복을 피하세요.',
    Play: QuickKiller,
  },
  {
    id: 'walls',
    layout: 'tools',
    title: '담쌓기',
    hint: '연두색 말을 최대 두 칸 옮기고 담을 세우세요. 이번 수로 상대와 구역을 갈라 더 넓은 땅을 차지하면 이겨요.',
  },
] as const;

export const SWIPE_DISTANCE = 48;
export const FULL_GAME_LINK_TEXT = '본게임 하기';

export type TrialSlide = (typeof SLIDES)[number];

export const TRIAL_TEXT = {
  title: '한 수 맛보기',
  description: `체험판 ${SLIDES.length}개, 옆으로 넘겨 보세요`,
  tabsLabel: '체험판 고르기',
  previous: '이전 체험판',
  next: '다음 체험판',
} as const;
