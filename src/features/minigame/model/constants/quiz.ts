import type { QuizQuestion } from '../types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // 예코 💜
  {
    id: 'yeko-lamb',
    characterId: 'yeko',
    question: '예코이가 진심으로 좋아하는 고기는?',
    options: ['양고기', '삼겹살', '닭갈비', '소고기'],
    correctIndex: 0,
    fact: '오히려 향 나는 양고기를 더 선호할 정도로 진심입니다 🐑',
  },
  {
    id: 'yeko-redbean',
    characterId: 'yeko',
    question: '예코이가 좋아하는 단 음식은?',
    options: [
      '팥붕어빵·비비빅·양갱 (단팥)',
      '초콜릿',
      '캐러멜',
      '단 거 안 좋아함',
    ],
    correctIndex: 0,
    fact: '단팥 들어간 건 다 좋아할 정도로 단팥파입니다 🫘',
  },
  {
    id: 'yeko-game',
    characterId: 'yeko',
    question: '예코이가 게임 중에 유일하게 진심인 게임은?',
    options: ['크레이지 아케이드', '리그 오브 레전드', '배틀그라운드', '오버워치'],
    correctIndex: 0,
    fact: '게임에 관심이 적은 편이지만 크아만큼은 진심입니다 💣',
  },

  // 아코 💛
  {
    id: 'ako-jjigae',
    characterId: 'ako',
    question: '아코의 별미 음식은?',
    options: [
      '아이스 된장찌개',
      '차가운 김치찌개',
      '미지근한 미역국',
      '시원한 갈비탕',
    ],
    correctIndex: 0,
    fact: '진심으로 아이스 된장찌개를 좋아한다고 했어요 🥶',
  },
  {
    id: 'ako-ddeokbokki',
    characterId: 'ako',
    question: '아코가 떡볶이에서 안 먹는 것은?',
    options: ['떡과 어묵', '튀김', '라면 사리', '다 잘 먹는다'],
    correctIndex: 0,
    fact: '튀김에 떡볶이 소스 찍어 먹는 건 좋아해요 🍢',
  },
  {
    id: 'ako-hobby',
    characterId: 'ako',
    question: '아코의 취미 중 하나가 아닌 것은?',
    options: ['게임', '노래', '웨이트', '영화 보기'],
    correctIndex: 0,
    fact: '맏형은 멤버 중에서 게임에 가장 관심이 없습니다 😅',
  },

  // 밤코 🩷
  {
    id: 'bamko-noodle',
    characterId: 'bamko',
    question: '밤코가 즐겨 먹는 면 요리는?',
    options: ['평양냉면', '비빔국수', '잔치국수', '우동'],
    correctIndex: 0,
    fact: '담백한 평양냉면 매니아입니다 🥶',
  },
  {
    id: 'bamko-game',
    characterId: 'bamko',
    question: '밤코가 좋아하는 게임 스타일은?',
    options: [
      '카트라이더 / 크레이지 아케이드 (캐주얼)',
      'FPS / 슈팅',
      'RPG',
      '격투게임',
    ],
    correctIndex: 0,
    fact: '단순하고 전략 부담 없는 캐주얼 게임을 좋아해요 🏎️',
  },
  {
    id: 'bamko-pet',
    characterId: 'bamko',
    question: '밤코가 좋아하는 것은?',
    options: ['강아지와 산책', '고양이 카페', '햄스터 키우기', '동물 관심 없음'],
    correctIndex: 0,
    fact: '강아지 진심이고 산책도 좋아합니다 🐶',
  },

  // 은코 🔵
  {
    id: 'eunko-ramen',
    characterId: 'eunko',
    question: '은코의 라면 취향은?',
    options: ['진라면 매운맛', '신라면', '안성탕면', '너구리'],
    correctIndex: 0,
    fact: '무조건 진라면 매운맛파입니다 🌶️',
  },
  {
    id: 'eunko-kalguksu',
    characterId: 'eunko',
    question: '은코가 가장 좋아하는 음식으로 매번 꼽는 것은?',
    options: ['바지락 칼국수', '김치 칼국수', '들깨 칼국수', '해물 칼국수'],
    correctIndex: 0,
    fact: '바지락 칼국수를 정말 자주 언급해요 🍜',
  },
  {
    id: 'eunko-game',
    characterId: 'eunko',
    question: '은코의 게임 별명은?',
    options: ['PLAVE 대표 겜돌이', '게임 입문자', '게임 안 함', '게임 트롤'],
    correctIndex: 0,
    fact: '공포게임에서도 침착하게 "에임 좋았죠?" 할 정도의 실력파 🎮',
  },

  // 하코
  {
    id: 'hako-meal',
    characterId: 'hako',
    question: '하코이가 먹은 음식의 80%를 차지하는 것은?',
    options: ['라면', '빵', '김밥', '햄버거'],
    correctIndex: 0,
    fact: '뭘 먹었냐 물어보면 매번 라면이라고 답해요 🍜',
  },
  {
    id: 'hako-ramen',
    characterId: 'hako',
    question: '하코이가 가장 좋아하는 라면은?',
    options: ['스낵면', '신라면', '짜파게티', '진라면'],
    correctIndex: 0,
    fact: '라면 중에서도 스낵면을 최애로 꼽았어요 ✨',
  },
  {
    id: 'hako-mbti',
    characterId: 'hako',
    question: '하코이의 MBTI는?',
    options: ['INFJ-A', 'ENFP-T', 'ISTP-A', 'ENTP-T'],
    correctIndex: 0,
    fact: '낯가리는 INFJ, 막내인데 어른스러운 이유 🌙',
  },
];

function shuffleOptions(q: QuizQuestion): QuizQuestion {
  const indices = q.options.map((_, i) => i);
  indices.sort(() => Math.random() - 0.5);
  const newOptions = indices.map((i) => q.options[i]);
  const newCorrectIndex = indices.indexOf(q.correctIndex);
  return { ...q, options: newOptions, correctIndex: newCorrectIndex };
}

export function pickQuizQuestions(count: number): QuizQuestion[] {
  return [...QUIZ_QUESTIONS]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(shuffleOptions);
}

export const QUIZ_ROUNDS = 3;
