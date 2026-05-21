import type { CharacterId, CharacterInfo, FoodId, FoodItem, GameState, LevelReward } from '@shared/types';

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
  riceball: { id: 'riceball', name: '주먹밥', price: 20, hungerRestore: 25, emoji: '🍙' },
  meat: { id: 'meat', name: '고기', price: 50, hungerRestore: 50, emoji: '🍖' },
  cake: { id: 'cake', name: '케이크', price: 100, hungerRestore: 100, emoji: '🎂' },
};

export const MAX_HUNGER = 100;
export const MAX_CLEANLINESS = 100;
export const MAX_HEARTS = 100;

export const HUNGER_DECAY_PER_MINUTE = 1;
export const CLEANLINESS_PER_POOP = 10;
export const DEATH_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3일 방치 시 사망

export const HEARTS_PER_MEETING = 10;

export const EXP_FEED = 3;
export const EXP_CLEAN = 2;
export const EXP_MINIGAME_MIN = 5;
export const EXP_MINIGAME_MAX = 15;
export const EXP_MEETING = 8;

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000];

export const SLEEP_START_HOUR = 23;
export const SLEEP_END_HOUR = 7;

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

// 하트 교환
export const HEART_EXCHANGE_UNIT = 10;
export const HEART_EXCHANGE_COINS = 15;

// 알 시스템
export const EGG_HEART_THRESHOLD = 100;
export const EGG_LEVEL_THRESHOLD = 3;
export const EGG_ALL_UNLOCKED_COINS = 100;

// 미니게임
export const MINIGAME_ROUNDS = 5;
export const MINIGAME_COIN_PER_CORRECT = 3;
export const MINIGAME_HEART_PER_CORRECT = 2;
export const MINIGAME_EXP_PER_CORRECT = 4;

// UI 타이밍
export const LEVEL_UP_TOAST_DURATION = 3000;

// 캐릭터 스프라이트
export const LEVEL_SCALE_PER_LEVEL = 0.05;

// 위험 상태
export const DANGER_THRESHOLD = 20;
export const WARNING_THRESHOLD = 40;

// 레벨업 보상
export const LEVEL_REWARDS: Record<number, LevelReward> = {
  2: { coins: 30, food: { bread: 2 }, message: '레벨 2 달성! 빵 2개와 30코인!' },
  3: { coins: 50, food: { riceball: 2 }, message: '레벨 3 달성! 주먹밥 2개와 50코인!' },
  4: { coins: 80, food: { meat: 1 }, message: '레벨 4 달성! 고기 1개와 80코인!' },
  5: { coins: 150, food: { cake: 1 }, message: '레벨 5 달성! 케이크 1개와 150코인!' },
};

export const ALL_CHARACTER_IDS: CharacterId[] = ['yeko', 'ako', 'bamko', 'eunko', 'hako'];

export const INITIAL_GAME_STATE: GameState = {
  status: 'selecting',
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
  isSick: false,
  sickSince: null,
  unlockedCharacters: [],
  levelUpMessage: null,
  eggReadyCharacterId: null,
  pendingPoops: [],
  lastLoginDate: null,
  loginStreak: 0,
  dailyRewardCollected: false,
};
