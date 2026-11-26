export const SITE_NAME = '미니게임';
export const SITE_URL = 'https://game.danwoo.dev';
export const SITE_HEADLINE = '잠깐의 여유, 미니게임 한 판';
export const SITE_TITLE = '미니게임 · 무료 퍼즐과 보드게임';
export const SITE_DESCRIPTION = '스도쿠, 오목, 슬리더링크와 매일 새로운 단어 퍼즐을 설치 없이 바로 즐겨요.';

export const GAMES = {
  sudoku: {
    href: '/sudoku',
    name: '클래식 스도쿠',
    category: '숫자 퍼즐',
    title: '무료 온라인 스도쿠 · 난이도 4단계',
    description: '빈칸에 1부터 9까지 채워요. 쉬움부터 전문가까지 네 가지 난이도에서 메모와 힌트를 쓸 수 있어요.',
  },
  killer: {
    href: '/killer',
    name: '킬러 스도쿠',
    category: '숫자 퍼즐',
    title: '킬러 스도쿠 · 합계 단서로 푸는 퍼즐',
    description: '점선으로 묶인 칸의 합을 단서로 숫자를 채워요.',
  },
  slitherlink: {
    href: '/slitherlink',
    name: '슬리더링크',
    category: '논리 퍼즐',
    title: '슬리더링크 · 숫자에 맞춰 고리 잇기',
    description: '숫자만큼 칸의 변을 따라 선을 그어 고리 하나를 완성해요.',
  },
  gomoku: {
    href: '/gomoku',
    name: '오목',
    category: '보드게임',
    title: '온라인 오목 · 컴퓨터와 렌주룰 대국',
    description: '컴퓨터와 번갈아 돌을 놓아 먼저 다섯 알을 이어요.',
  },
  walls: {
    href: '/walls',
    name: '담쌓기',
    category: '보드게임',
    title: '담쌓기 · 컴퓨터와 땅따먹기',
    description: '말을 옮기고 담을 세워 상대보다 넓은 땅을 차지해요.',
  },
  guess: {
    href: '/guess',
    name: '맞춰봐',
    category: '단어 추리',
    title: '맞춰봐 · 오늘의 단어 유사도 게임',
    description: '명사를 입력하고 뜻이 얼마나 가까운지 살펴 오늘의 단어를 찾아요.',
  },
} as const;

export type GameId = keyof typeof GAMES;
const GAME_IDS = ['sudoku', 'killer', 'slitherlink', 'gomoku', 'walls', 'guess'] as const;
export const GAME_LIST = GAME_IDS.map((id) => [id, GAMES[id]] as const);
