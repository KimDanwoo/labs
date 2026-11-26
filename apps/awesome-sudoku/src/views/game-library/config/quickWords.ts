interface WordPuzzle {
  answer: string;
  aliases?: readonly string[];
  category: string;
  hints: readonly [string, ...string[]];
}

export const WORD_PUZZLES: [WordPuzzle, ...WordPuzzle[]] = [
  {
    answer: '반딧불이',
    aliases: ['반딧불'],
    category: '곤충',
    hints: [
      '여름밤, 물가나 풀숲에서 볼 수 있어요.',
      '배 끝에서 빛을 내 짝에게 신호를 보내요.',
      '초성은 ㅂㄷㅂㅇ이에요.',
    ],
  },
  {
    answer: '해시계',
    category: '옛날 도구',
    hints: [
      '맑은 날 바깥에서 시간을 알아볼 때 썼어요.',
      '햇빛이 막대에 만든 그림자가 눈금 위를 움직여요.',
      '초성은 ㅎㅅㄱ예요.',
    ],
  },
  {
    answer: '나이테',
    aliases: ['연륜'],
    category: '나무',
    hints: [
      '나무줄기가 한 해 자랄 때마다 하나씩 생겨요.',
      '줄기를 가로로 자른 면에서 동그란 줄무늬로 보여요.',
      '초성은 ㄴㅇㅌ예요.',
    ],
  },
  {
    answer: '현무암',
    category: '암석',
    hints: [
      '화산에서 나온 용암이 지표에서 식어 생긴 어두운색 돌이에요.',
      '제주 돌담에 자주 쓰이고, 가스가 빠져나간 구멍이 남아 있기도 해요.',
      '초성은 ㅎㅁㅇ이에요.',
    ],
  },
];

type WordResult = 'playing' | 'invalid' | 'retry' | 'solved' | 'revealed';

export interface QuickWordRound {
  position: number;
  hintCount: number;
  input: string;
  result: WordResult;
}

export const INITIAL_WORD_ROUND: QuickWordRound = { position: 0, hintCount: 1, input: '', result: 'playing' };
export const WORD_MAX_LENGTH = 8;
export const WORD_PATTERN = /^[가-힣]{1,8}$/u;
export const WORD_MESSAGES: Record<WordResult, string> = {
  playing: '',
  invalid: '한글 단어를 입력해 주세요.',
  retry: '다른 단어예요. 아래에서 다음 힌트를 볼 수 있어요.',
  solved: '',
  revealed: '',
};
