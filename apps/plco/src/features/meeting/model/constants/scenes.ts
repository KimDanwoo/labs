import type { CharacterId } from '@shared/types';
import type { ConversationScene } from '../types';

// 예준 (yeko 💜) — 팥/양고기/커피/매운 음식, 작곡/기타/러닝, 크아, 다정/열정
const SCENES_YEKO: ConversationScene[] = [
  {
    id: 'yeko-redbean',
    category: 'food',
    prompt: '"오늘 팥붕어빵 사 먹었어 ㅋㅋㅋ 진짜 행복."',
    options: [
      { text: '팥 최고지! 같이 먹으러 가자', outcome: 'good', reaction: '"꺄 통한다! 팥파끼리 모이자 🫘"' },
      { text: '슈크림 더 좋은데', outcome: 'ok', reaction: '"... 슈크림은 인정"' },
      { text: '팥 싫어해', outcome: 'awkward', reaction: '"... 헐 우리 안 맞을지도..."' },
    ],
  },
  {
    id: 'yeko-lamb',
    category: 'food',
    prompt: '"양꼬치 가자! 양고기 진짜 좋아해."',
    options: [
      { text: '나도! 향 있는 게 진짜야', outcome: 'good', reaction: '"오 너 양고기 진심이구나 💜"' },
      { text: '먹어볼 순 있어', outcome: 'ok', reaction: '"같이 가서 한번 도전!"' },
      { text: '양고기 냄새나서 못 먹어', outcome: 'awkward', reaction: '"... 그게 매력인데..."' },
    ],
  },
  {
    id: 'yeko-coffee',
    category: 'food',
    prompt: '"오늘 새로 발견한 원두 카페 있는데 가볼래?"',
    options: [
      { text: '좋아! 커피 얘기하면서 가자', outcome: 'good', reaction: '"역시 너랑은 통해 ☕"' },
      { text: '커피는 그냥 마시는 정도', outcome: 'ok', reaction: '"한번 같이 마셔보자~"' },
      { text: '커피 안 마셔', outcome: 'awkward', reaction: '"... 음 아쉽다"' },
    ],
  },
  {
    id: 'yeko-running',
    category: 'hobby',
    prompt: '"내일 한강 러닝 같이 갈래?"',
    options: [
      { text: '콜! 따라갈게 🏃', outcome: 'good', reaction: '"우와 진짜? 같이 뛰자!"' },
      { text: '난 걷는 정도만 가능', outcome: 'ok', reaction: '"걸어도 좋아, 같이 가자"' },
      { text: '운동 진짜 싫어', outcome: 'awkward', reaction: '"... 한번만 해보지?"' },
    ],
  },
  {
    id: 'yeko-songwriting',
    category: 'hobby',
    prompt: '"새 곡 가사 쓰는 중인데 한번 들어볼래?"',
    options: [
      { text: '응! 솔직한 감상 말해줄게', outcome: 'good', reaction: '"... 너한테 제일 먼저 들려준 거야 🎸"' },
      { text: '가볍게 들어볼게', outcome: 'ok', reaction: '"고마워 들어줘서~"' },
      { text: '가사 잘 모르겠어', outcome: 'awkward', reaction: '"... 아 알겠어"' },
    ],
  },
  {
    id: 'yeko-crazyarcade',
    category: 'hobby',
    prompt: '"크아 한 판 어때? 진심이다 진짜."',
    options: [
      { text: '꺄 콜! 물풍선 갈긴다', outcome: 'good', reaction: '"오 진짜 좋아! 캐릭터 뭐 골라? 💣"' },
      { text: '룰 가르쳐주면', outcome: 'ok', reaction: '"내가 다 알려줄게!"' },
      { text: '게임 시간 낭비야', outcome: 'awkward', reaction: '"... 크아는 인생인데..."' },
    ],
  },
];

// 노아 (ako 💛) — 노래/웨이트/영화, 커피, 아이스 된장찌개, 튀김, 완벽주의/맏형
const SCENES_AKO: ConversationScene[] = [
  {
    id: 'ako-singing',
    category: 'hobby',
    prompt: '"오늘 노래방 가서 한 시간만 부르고 싶다."',
    options: [
      { text: '같이 가자! 듀엣 곡 정하자', outcome: 'good', reaction: '"오 좋아! 발라드 부르고 싶다 🎤"' },
      { text: '듣기만 해도 돼?', outcome: 'ok', reaction: '"청자가 있어야 신나지~"' },
      { text: '노래방 못 가', outcome: 'awkward', reaction: '"... 음 아쉽다"' },
    ],
  },
  {
    id: 'ako-weight',
    category: 'hobby',
    prompt: '"오늘 웨이트 너무 빡세게 했어 ㅠㅠ 같이 운동 가자!"',
    options: [
      { text: '나도 같이! 자세 봐줘', outcome: 'good', reaction: '"좋아 좋아! 자세 진짜 중요해 💪"' },
      { text: '난 가벼운 운동만', outcome: 'ok', reaction: '"오케이 천천히 시작하자"' },
      { text: '운동 왜 해', outcome: 'awkward', reaction: '"... 형 그러면 안 돼"' },
    ],
  },
  {
    id: 'ako-movie',
    category: 'hobby',
    prompt: '"새로 나온 영화 봤어? 너무 좋았어."',
    options: [
      { text: '아직! 디테일 얘기해줘', outcome: 'good', reaction: '"스포 없이 잘 얘기해줄게 🎬"' },
      { text: '영화는 그냥저냥', outcome: 'ok', reaction: '"오 한번 같이 보자~"' },
      { text: '영화 잘 안 봐', outcome: 'awkward', reaction: '"... 음 알겠어"' },
    ],
  },
  {
    id: 'ako-icejjigae',
    category: 'food',
    prompt: '"아이스 된장찌개 알아? 진짜 별미야."',
    options: [
      { text: '안 먹어봤어! 알려줘', outcome: 'good', reaction: '"오 진짜? 우리 집에서 끓여줄게!"' },
      { text: '음... 들어보긴 했어', outcome: 'ok', reaction: '"한번 도전해봐!"' },
      { text: '뭐 그런 걸 먹어', outcome: 'awkward', reaction: '"... 형 진심인데..."' },
    ],
  },
  {
    id: 'ako-tempura',
    category: 'food',
    prompt: '"떡볶이 시킬 때 떡 빼고 튀김만 시켜도 돼?"',
    options: [
      { text: '오 튀김 소스 콜라보 ㅋㅋ 인정', outcome: 'good', reaction: '"이해해주는 사람 처음이다 ㅠㅠ"' },
      { text: '취향 존중', outcome: 'ok', reaction: '"고마워 ㅎㅎ"' },
      { text: '떡 빼면 무슨 떡볶이야', outcome: 'awkward', reaction: '"... 음 그렇긴 한데..."' },
    ],
  },
  {
    id: 'ako-perfect',
    category: 'comfort',
    prompt: '"오늘 무대에서 한 박자 놓친 거 같아... 계속 신경 쓰여."',
    options: [
      { text: '아무도 몰랐을 거야, 충분히 잘했어', outcome: 'good', reaction: '"... 너밖에 위로해줄 사람 없다 🥲"' },
      { text: '다음에 잘하면 돼', outcome: 'ok', reaction: '"맞아, 다시 연습할게"' },
      { text: '왜 그런 거에 집착해', outcome: 'awkward', reaction: '"... 그런 게 아닌데"' },
    ],
  },
];

// 밤비 (bamko 🩷) — 평양냉면, 강아지, 춤/연기/넷플릭스/스포츠, 카트라이더, 엉뚱/순함
const SCENES_BAMKO: ConversationScene[] = [
  {
    id: 'bamko-naengmyeon',
    category: 'food',
    prompt: '"오늘 점심 평양냉면 어때? 진짜 좋아해."',
    options: [
      { text: '오 좋아! 슴슴한 거 사랑이지', outcome: 'good', reaction: '"꺄 통한다 너!! 🍜"' },
      { text: '먹어보긴 할게', outcome: 'ok', reaction: '"맛 알아가는 재미!"' },
      { text: '맛없어서 별로', outcome: 'awkward', reaction: '"... 엥 그건 무슨 말이야 ㅠ"' },
    ],
  },
  {
    id: 'bamko-puppy',
    category: 'small-talk',
    prompt: '"강아지 산책시키는 영상 진짜 좋아해 ㅎㅎ"',
    options: [
      { text: '나도! 같이 강아지 카페 가자', outcome: 'good', reaction: '"꺄아 진짜? 약속 잡자 🐶"' },
      { text: '귀엽긴 해 ㅎ', outcome: 'ok', reaction: '"맞아 맞아~"' },
      { text: '동물 별로 안 좋아함', outcome: 'awkward', reaction: '"... 엥 ㅠㅠ"' },
    ],
  },
  {
    id: 'bamko-dance',
    category: 'hobby',
    prompt: '"오늘 짠 안무 진짜 잘 나왔는데 보러 올래?"',
    options: [
      { text: '꺄 보고 싶어! 가르쳐줘', outcome: 'good', reaction: '"좋아 좋아! 같이 추자 💃"' },
      { text: '영상으로 보여줘', outcome: 'ok', reaction: '"오케 보내줄게~"' },
      { text: '춤 관심 없어', outcome: 'awkward', reaction: '"... 우엥 슬프다"' },
    ],
  },
  {
    id: 'bamko-netflix',
    category: 'small-talk',
    prompt: '"오늘 넷플릭스 정주행 모드인데 같이 볼래?"',
    options: [
      { text: '꺄 좋아! 뭐 볼지 정하자', outcome: 'good', reaction: '"역시 너야 🎬🍿"' },
      { text: '난 잠깐만 같이 볼래', outcome: 'ok', reaction: '"짧게라도 콜!"' },
      { text: '난 영상 잘 안 봐', outcome: 'awkward', reaction: '"... 엥 어떻게 살아 ㅠ"' },
    ],
  },
  {
    id: 'bamko-kart',
    category: 'hobby',
    prompt: '"카트라이더 한 판 콜?"',
    options: [
      { text: '콜! 다같이 모래시계 ㄱㄱ', outcome: 'good', reaction: '"꺄 너 좀 하는데? 🏎️"' },
      { text: '나 못해도 괜찮으면', outcome: 'ok', reaction: '"같이 연습하자!"' },
      { text: '게임 별로야', outcome: 'awkward', reaction: '"... 음 ㅠ"' },
    ],
  },
  {
    id: 'bamko-yes-man',
    category: 'plan',
    prompt: '"오늘 갑자기 노을 보러 가자!"',
    options: [
      { text: '오 바로 콜! 출발하자', outcome: 'good', reaction: '"꺄 진심 너 최고 🌅"' },
      { text: '음 옷 갈아입고', outcome: 'ok', reaction: '"기다릴게~"' },
      { text: '갑자기 무슨', outcome: 'awkward', reaction: '"... 칫 노잼"' },
    ],
  },
];

// 은호 (eunko 🔵) — 진라면 매운맛/슈붕/치즈/아아/바지락 칼국수, 게임(FPS/공포)/맛집/웨이트/수영, ENTP
const SCENES_EUNKO: ConversationScene[] = [
  {
    id: 'eunko-spicy-ramen',
    category: 'food',
    prompt: '"오늘 야식으로 진라면 매운맛 콜?"',
    options: [
      { text: '콜! 치즈 토핑 추가하자', outcome: 'good', reaction: '"오 너 좀 아네 🌶️🧀"' },
      { text: '난 순한맛 좋아', outcome: 'ok', reaction: '"각자 끓여 먹자~"' },
      { text: '라면은 살쪄', outcome: 'awkward', reaction: '"... 형이 운동도 같이 가줄게"' },
    ],
  },
  {
    id: 'eunko-bbongpie',
    category: 'food',
    prompt: '"슈붕파이 진짜 좋아하는데 같이 사다 먹을래?"',
    options: [
      { text: '오 슈붕 인정! 같이 가', outcome: 'good', reaction: '"오 통한다! 🥧"' },
      { text: '음 한 번 도전', outcome: 'ok', reaction: '"가즈아~"' },
      { text: '단 거 별로야', outcome: 'awkward', reaction: '"... 음 알겠어"' },
    ],
  },
  {
    id: 'eunko-fps',
    category: 'hobby',
    prompt: '"오늘 FPS 한 판 어때? 너 에임 어때?"',
    options: [
      { text: '같이 듀오! 에임 맞춰보자', outcome: 'good', reaction: '"오 좋아! 에임 좋았죠 ㅋㅋ 🎮"' },
      { text: '나 게임 약한데 가르쳐줄래?', outcome: 'ok', reaction: '"오케 코치모드 가즈아"' },
      { text: '폭력 게임 싫어', outcome: 'awkward', reaction: '"... 그래?"' },
    ],
  },
  {
    id: 'eunko-horror',
    category: 'hobby',
    prompt: '"오늘 공포게임 같이 할래? 나 멀쩡해 ㅎㅎ"',
    options: [
      { text: '꺄 무서워 죽겠지만 콜', outcome: 'good', reaction: '"내가 옆에서 지켜줄게 👻"' },
      { text: '구경만 할게', outcome: 'ok', reaction: '"옆에 있어줘~"' },
      { text: '공포는 진짜 못해', outcome: 'awkward', reaction: '"... 음 알겠어"' },
    ],
  },
  {
    id: 'eunko-foodie',
    category: 'food',
    prompt: '"바지락 칼국수 진짜 잘하는 집 있는데 갈래?"',
    options: [
      { text: '오 콜! 맛집 가즈아', outcome: 'good', reaction: '"오 너 맛집러구나 🍜"' },
      { text: '음 한번 가볼게', outcome: 'ok', reaction: '"기대해!"' },
      { text: '칼국수 별로야', outcome: 'awkward', reaction: '"... 형 맛 모르네"' },
    ],
  },
  {
    id: 'eunko-swim',
    category: 'plan',
    prompt: '"이번 주말에 수영장 가자!"',
    options: [
      { text: '좋아! 자유형 누가 빠른지 보자', outcome: 'good', reaction: '"오 자신 있어? 🏊"' },
      { text: '나 수영 잘 못해', outcome: 'ok', reaction: '"내가 가르쳐줄게~"' },
      { text: '물 무서워', outcome: 'awkward', reaction: '"... 음 그럼 다른 거 하자"' },
    ],
  },
];

// 하민 (hako) — 라면(스낵면) 진심, INFJ, 막내인데 듬직, 순수/낯가림, 랩/댄스
const SCENES_HAKO: ConversationScene[] = [
  {
    id: 'hako-snackmyeon',
    category: 'food',
    prompt: '"오늘도 라면 먹었어... 스낵면 진짜 사랑해."',
    options: [
      { text: '스낵면 미친 맛이지 ㅋㅋ 인정', outcome: 'good', reaction: '"꺄 형이 알아주네 진짜로?! 🍜"' },
      { text: '난 신라면 좋아', outcome: 'ok', reaction: '"신라면도 인정이긴 한데..."' },
      { text: '라면 그만 먹어', outcome: 'awkward', reaction: '"... 칫 잔소리..."' },
    ],
  },
  {
    id: 'hako-jjapaghetti',
    category: 'food',
    prompt: '"짜파게티 끓여줄까? 비밀 레시피 있어."',
    options: [
      { text: '오! 비밀 알려줘', outcome: 'good', reaction: '"형한테만 알려줄게 ㅎㅎ 🍝"' },
      { text: '짜파게티 좋지', outcome: 'ok', reaction: '"같이 먹자~"' },
      { text: '인스턴트 싫어', outcome: 'awkward', reaction: '"... 형은 너무 어른 같아"' },
    ],
  },
  {
    id: 'hako-shy',
    category: 'comfort',
    prompt: '"오늘 처음 본 사람들이랑 있는 자리에서 너무 떨었어..."',
    options: [
      { text: '낯가림은 천천히 풀리는 거야, 잘했어', outcome: 'good', reaction: '"... 형 진심 위로된다 ㅠㅠ"' },
      { text: '다 그래, 익숙해질 거야', outcome: 'ok', reaction: '"고마워 ㅎㅎ"' },
      { text: '아 그냥 말 좀 해 ㅋㅋ', outcome: 'awkward', reaction: '"... 그게 안 되는데 ㅠ"' },
    ],
  },
  {
    id: 'hako-mature',
    category: 'compliment',
    prompt: '"형들이 자꾸 나보고 막내 같지 않대..."',
    options: [
      { text: '맞아 너 진짜 어른스러워, 멋있어', outcome: 'good', reaction: '"... 그렇게 봐줘서 고마워 🥺"' },
      { text: '귀여운 막내 맞잖아', outcome: 'ok', reaction: '"히힝 그건 또 좋아"' },
      { text: '나이 비밀이라며 ㅋ', outcome: 'awkward', reaction: '"... 형 짓궂어"' },
    ],
  },
  {
    id: 'hako-rap',
    category: 'hobby',
    prompt: '"새 랩 가사 들어봐줄래? 좀 부끄러운데..."',
    options: [
      { text: '꼭 듣고 싶어! 진심으로 들어줄게', outcome: 'good', reaction: '"... 형한테만 들려주는 거야 🎤"' },
      { text: '편하게 해봐~', outcome: 'ok', reaction: '"고마워 ㅎㅎ"' },
      { text: '랩 잘 모르겠어', outcome: 'awkward', reaction: '"... 음 형 그래도 들어줘 ㅠ"' },
    ],
  },
  {
    id: 'hako-dance-practice',
    category: 'hobby',
    prompt: '"오늘 안무 연습 같이 해줄래? 부족해서..."',
    options: [
      { text: '좋아! 같이 거울 보고 맞춰보자', outcome: 'good', reaction: '"꺄 형 진짜 고마워 💃"' },
      { text: '구경하면서 박수쳐줄게', outcome: 'ok', reaction: '"든든해~"' },
      { text: '연습은 알아서 해', outcome: 'awkward', reaction: '"... 칫"' },
    ],
  },
];

export const SCENES_BY_CHARACTER: Record<CharacterId, ConversationScene[]> = {
  yeko: SCENES_YEKO,
  ako: SCENES_AKO,
  bamko: SCENES_BAMKO,
  eunko: SCENES_EUNKO,
  hako: SCENES_HAKO,
};

function shuffleOptions(scene: ConversationScene): ConversationScene {
  return {
    ...scene,
    options: [...scene.options].sort(() => Math.random() - 0.5),
  };
}

export function pickScenesForCharacter(
  characterId: CharacterId,
  count: number,
): ConversationScene[] {
  const pool = SCENES_BY_CHARACTER[characterId] ?? [];
  return [...pool]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(shuffleOptions);
}
