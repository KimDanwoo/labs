import type {
  CharacterId,
  CharacterInfo,
  FoodId,
  FoodItem,
  GameState,
  LevelReward,
} from '@shared/types';

export const GAME_STORAGE_KEY = 'plco-damagochi-saves';
export const GAME_STORAGE_LEGACY_KEY = 'plco-damagochi-state';

export const CHARACTERS: Record<CharacterId, CharacterInfo> = {
  yeko: {
    id: 'yeko',
    name: '예코',
    color: '#2D2D5E',
    bgColor: '#F0F0FF',
    borderColor: '#8B7EC8',
    emoji: '💜',
  },
  ako: {
    id: 'ako',
    name: '아코',
    color: '#FFD93D',
    bgColor: '#FFFDF0',
    borderColor: '#FFC107',
    emoji: '💛',
  },
  bamko: {
    id: 'bamko',
    name: '밤코',
    color: '#FF6B9D',
    bgColor: '#FFF0F5',
    borderColor: '#FF69B4',
    emoji: '🩷',
  },
  eunko: {
    id: 'eunko',
    name: '은코',
    color: '#B0C4DE',
    bgColor: '#F5F8FF',
    borderColor: '#A0B4CE',
    emoji: '🤍',
  },
  hako: {
    id: 'hako',
    name: '하코',
    color: '#4A90D9',
    bgColor: '#F0F8FF',
    borderColor: '#6BB5FF',
    emoji: '💙',
  },
};

export const FOODS: Record<FoodId, FoodItem> = {
  bread: { id: 'bread', name: '빵', price: 10, hungerRestore: 10, emoji: '🍞' },
  riceball: {
    id: 'riceball',
    name: '주먹밥',
    price: 20,
    hungerRestore: 25,
    emoji: '🍙',
  },
  meat: { id: 'meat', name: '고기', price: 50, hungerRestore: 50, emoji: '🍖' },
  cake: {
    id: 'cake',
    name: '케이크',
    price: 100,
    hungerRestore: 100,
    emoji: '🎂',
  },
};

export const MAX_HUNGER = 100;
export const MAX_CLEANLINESS = 100;
export const MAX_HEARTS = 100;

// 배고픔: 가득 찬 상태에서 약 2일에 걸쳐 소진되도록 분당 감소량을 파생
export const HUNGER_FULL_DRAIN_DAYS = 2;
export const HUNGER_DECAY_PER_MINUTE =
  MAX_HUNGER / (HUNGER_FULL_DRAIN_DAYS * 24 * 60);
export const CLEANLINESS_PER_POOP = 10;
// 먹인 뒤 똥이 나오기까지 지연. 여러 번 먹여도 마지막 먹인 시점 기준 1개만 생성
export const POOP_DELAY_MS = 20_000;
export const DEATH_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3일 방치 시 사망

export const EXP_FEED = 5;
export const EXP_CLEAN = 3;
export const EXP_MINIGAME_MIN = 10;
export const EXP_MINIGAME_MAX = 30;
export const EXP_MEETING = 15;

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700,
];

export const SLEEP_START_HOUR = 22;
export const SLEEP_END_HOUR = 8;
export const WAKE_UP_GRACE_MS = 5 * 60_000;

// 질병 시스템
export const SICK_POOP_THRESHOLD = 4;
export const MEDICINE_PRICE = 15;

// 코인 경제
export const COINS_PER_CLEAN = 2;
export const COINS_CLEAN_ALL_BONUS = 3;
export const COINS_PER_MEETING = 5;

// 행복도(hearts) 확장
export const HEARTS_PER_FEED = 3;
export const HEARTS_PER_CLEAN = 2;
export const HEART_DECAY_WHEN_SICK = 1;
export const HEART_HUNGER_BUFF_THRESHOLD = 50;
export const HEART_HUNGER_BUFF_RATE = 0.8;
export const HEART_UNHAPPY_DEBUFF_RATE = 1.5;
export const OVERFEED_HEART_PENALTY = 3;
export const OVERFEED_TOAST_DURATION = 2500;
export const OVERFEED_MESSAGE = '이제 배가 너무 불러요!';

// 만남 규칙
export const MEETING_COOLDOWN_MS = 5 * 60_000;
export const MEETING_DAILY_LIMIT = 3;
export const MEETING_PLAY_SCENE_MS = 5000; // 만남 후 공원에서 함께 노는 시간
export const MEETING_ROUNDS = 3;
export const MEETING_REWARD_GOOD = 6;
export const MEETING_REWARD_OK = 3;
export const MEETING_REWARD_AWKWARD = 0;
export const MEETING_PERFECT_COIN_BONUS = 10;

// 하트 교환
export const HEART_EXCHANGE_UNIT = 10;
export const HEART_EXCHANGE_COINS = 15;

// 알 시스템
export const EGG_HEART_THRESHOLD = 100;
export const EGG_LEVEL_THRESHOLD = 7;
export const EGG_ALL_UNLOCKED_COINS = 100;

// 미니게임
export const MINIGAME_ROUNDS = 5;
export const MINIGAME_COIN_PER_CORRECT = 3;
export const MINIGAME_HEART_PER_CORRECT = 2;
export const MINIGAME_EXP_PER_CORRECT = 4;
export const MINIGAME_COOLDOWN_MS = 3 * 60 * 1000;

// UI 타이밍
export const LEVEL_UP_TOAST_DURATION = 3000;

// 캐릭터 스프라이트
// 10레벨 만렙에서 약 1.22배가 되도록(기존 5레벨 1.2배와 비슷하게) 완만하게 성장
export const LEVEL_SCALE_PER_LEVEL = 0.025;

// 위험 상태
export const DANGER_THRESHOLD = 20;
export const WARNING_THRESHOLD = 40;

// 레벨업 보상
export const LEVEL_REWARDS: Record<number, LevelReward> = {
  2: {
    coins: 30,
    food: { bread: 2 },
    message: '레벨 2 달성! 빵 2개와 30코인!',
  },
  3: {
    coins: 50,
    food: { riceball: 2 },
    message: '레벨 3 달성! 주먹밥 2개와 50코인!',
  },
  4: {
    coins: 80,
    food: { meat: 1 },
    message: '레벨 4 달성! 고기 1개와 80코인!',
  },
  5: {
    coins: 150,
    food: { cake: 1 },
    message: '레벨 5 달성! 케이크 1개와 150코인!',
  },
  6: {
    coins: 200,
    food: { meat: 2 },
    message: '레벨 6 달성! 고기 2개와 200코인!',
  },
  7: {
    coins: 280,
    food: { riceball: 3, meat: 1 },
    message: '레벨 7 달성! 주먹밥 3개, 고기 1개와 280코인! 이제 알을 품을 수 있어요 🥚',
  },
  8: {
    coins: 380,
    food: { cake: 2 },
    message: '레벨 8 달성! 케이크 2개와 380코인!',
  },
  9: {
    coins: 500,
    food: { meat: 3, cake: 1 },
    message: '레벨 9 달성! 고기 3개, 케이크 1개와 500코인!',
  },
  10: {
    coins: 800,
    food: { cake: 3, meat: 3 },
    message: '레벨 10 달성! 최고 레벨이에요! 케이크 3개, 고기 3개와 800코인! 🎉',
  },
};

export const ALL_CHARACTER_IDS: CharacterId[] = [
  'yeko',
  'ako',
  'bamko',
  'eunko',
  'hako',
];

export const GAME_STATUS = {
  SELECTING: 'selecting',
  PLAYING: 'playing',
  DEAD: 'dead',
  MEETING: 'meeting',
} as const;

export const MODAL_TYPE = {
  FEED: 'feed',
  SHOP: 'shop',
  MEETING: 'meeting',
  MINIGAME: 'minigame',
  EGG: 'egg',
  SETTINGS: 'settings',
} as const;

export const ROOM_TYPE = {
  LIVING: 'living',
  BEDROOM: 'bedroom',
  BATHROOM: 'bathroom',
  OUTDOOR: 'outdoor',
} as const;

export const INITIAL_GAME_STATE: GameState = {
  status: GAME_STATUS.SELECTING,
  characterId: null,
  nickname: '',
  level: 1,
  exp: 0,
  hunger: 80,
  cleanliness: 100,
  hearts: 0,
  coins: 50,
  poops: [],
  inventory: { bread: 3, riceball: 1, meat: 0, cake: 0 },
  lastUpdated: Date.now(),
  hungerZeroSince: null,
  cleanlinessZeroSince: null,
  isSleeping: false,
  wokeUpAt: null,
  isSick: false,
  sickSince: null,
  unlockedCharacters: [],
  levelUpMessage: null,
  feedingMessage: null,
  eggReadyCharacterId: null,
  lastEggLevel: null,
  pendingPoops: [],
  lastMeetingAt: null,
  meetingsToday: 0,
  meetingDay: null,
  lastMinigameAt: null,
};
