import { GUESS_STATUS, NOTICE_KIND, RANK_TONE } from '@views/guess-word/config/game';
import type { GuessStatus, NoticeKind, RankTone } from '@views/guess-word/model/types/guessWord';

export const GUESS_WORD_COPY = {
  title: '맞춰봐',
  description: '오늘의 단어를 맞혀 보세요. 뜻이 가까운 명사일수록 유사도가 높아요.',
  puzzleNumber: (day: number) => `${day}번째 문제`,
  inputLabel: '추측할 단어',
  inputPlaceholder: '명사를 입력하세요',
  submit: '확인',
  hintsTitle: '오늘의 힌트',
  hintLabel: (rank: number) => `${rank}위 유사도`,
  listTitle: '추측한 단어',
  latestTitle: '방금 입력한 단어',
  columnOrder: '#',
  columnWord: '단어',
  columnSimilarity: '유사도',
  columnRank: '순위',
  empty: '아직 추측한 단어가 없어요.',
  giveUp: '포기하고 정답 보기',
  giveUpConfirm: '정말 포기할까요? 누르면 정답이 공개돼요.',
  close: '닫기',
  tomorrow: '내일 자정(한국 시간)에 새 문제가 열려요.',
  triesText: (count: number) => `${count}번 만에 맞혔어요`,
  rulesTitle: '규칙',
} as const;

export const NOTICE_TEXT: Record<NoticeKind, (word: string) => string> = {
  [NOTICE_KIND.INVALID]: () => '한글 단어 하나만 입력할 수 있어요 (8자 이하).',
  [NOTICE_KIND.UNKNOWN]: (word) => `'${word}'은(는) 사전에 없거나 명사가 아니에요.`,
  [NOTICE_KIND.DUPLICATE]: (word) => `'${word}'은(는) 이미 입력했어요.`,
  [NOTICE_KIND.NETWORK]: () => '서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.',
};

export const RANK_TEXT: Record<RankTone, (rank: number | null) => string> = {
  [RANK_TONE.ANSWER]: () => '정답!',
  [RANK_TONE.RANKED]: (rank) => `${rank}위`,
  [RANK_TONE.FAR]: () => '1000위 밖',
};

export const RESULT_TITLE: Record<GuessStatus, string> = {
  [GUESS_STATUS.PLAYING]: '',
  [GUESS_STATUS.SOLVED]: '정답이에요!',
  [GUESS_STATUS.GAVE_UP]: '오늘의 정답',
};

export const GUESS_WORD_RULES = [
  '명사만 입력할 수 있어요. 동사·형용사·부사와 대부분의 고유명사는 받지 않아요.',
  '유사도는 단어의 뜻이 얼마나 가까운지를 -100~100으로 나타내요. 정답은 100이에요.',
  '정답과 가장 가까운 1000개 단어 안에 들면 순위가 보여요. 1위가 정답 다음으로 가까운 단어예요.',
  '문제는 하루에 하나, 한국 시간 자정에 바뀌어요.',
] as const;

export const GUESS_WORD_CREDITS = [
  {
    label: '단어 벡터: fastText 한국어 벡터 (Facebook AI Research, CC BY-SA 3.0)',
    href: 'https://fasttext.cc/docs/en/crawl-vectors.html',
  },
  {
    label: '정답 목록: 국립국어원 「한국어 학습용 어휘 목록」 (공공누리 제1유형)',
    href: 'https://www.korean.go.kr/front_eng/down/down_02V.do?etc_seq=70',
  },
] as const;
