export type CharacterId = 'yeko' | 'ako' | 'bamko' | 'eunko' | 'hako';

export type CharacterInfo = {
  id: CharacterId;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
};

export type FoodId = 'bread' | 'riceball' | 'meat' | 'cake';

export type FoodItem = {
  id: FoodId;
  name: string;
  price: number;
  hungerRestore: number;
  emoji: string;
};

export type Poop = {
  id: string;
  x: number;
  y: number;
  createdAt: number;
};

export type CharacterPosition = {
  x: number;
  y: number;
  direction: 'left' | 'right';
  isMoving: boolean;
};

export type LevelReward = {
  coins: number;
  food?: Partial<Record<FoodId, number>>;
  message: string;
};

export type RoomType = 'living' | 'bedroom' | 'bathroom' | 'outdoor';

export type ModalType = 'feed' | 'shop' | 'meeting' | 'minigame' | 'egg' | 'settings' | null;

export type GameStatus = 'selecting' | 'playing' | 'dead' | 'meeting';

export type GameState = {
  status: GameStatus;
  characterId: CharacterId | null;
  nickname: string;
  level: number;
  exp: number;
  hunger: number;
  cleanliness: number;
  hearts: number;
  coins: number;
  poops: Poop[];
  inventory: Record<FoodId, number>;
  lastUpdated: number;
  hungerZeroSince: number | null;
  cleanlinessZeroSince: number | null;
  isSleeping: boolean;
  isSick: boolean;
  sickSince: number | null;
  unlockedCharacters: CharacterId[];
  levelUpMessage: string | null;
  eggReadyCharacterId: CharacterId | null;
  pendingPoops: number[];
};

export type GameAction =
  | { type: 'SELECT_CHARACTER'; characterId: CharacterId; nickname: string }
  | { type: 'FEED'; foodId: FoodId }
  | { type: 'CLEAN_POOP'; poopId: string }
  | { type: 'CLEAN_ALL_POOP' }
  | { type: 'ADD_POOP'; poop: Poop }
  | { type: 'DECAY_HUNGER'; amount: number }
  | { type: 'DECAY_HEARTS'; amount: number }
  | { type: 'ADD_HEARTS'; amount: number }
  | { type: 'ADD_COINS'; amount: number }
  | { type: 'ADD_EXP'; amount: number }
  | { type: 'BUY_FOOD'; foodId: FoodId }
  | { type: 'EXCHANGE_HEARTS'; amount: number }
  | { type: 'GET_SICK' }
  | { type: 'GIVE_MEDICINE' }
  | { type: 'MINIGAME_REWARD'; correctCount: number }
  | { type: 'COLLECT_EGG' }
  | { type: 'DISMISS_LEVEL_UP' }
  | { type: 'SET_SLEEPING'; isSleeping: boolean }
  | { type: 'PROCESS_OFFLINE'; now: number }
  | { type: 'DIE' }
  | { type: 'RESET' }
  | { type: 'TICK' }
  | { type: 'LOAD_STATE'; state: GameState };
