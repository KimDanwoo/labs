'use client';

import { useState, useReducer, useEffect, useCallback, startTransition } from 'react';
import type { GameState, GameAction, FoodId, CharacterId } from '@shared/types';
import {
  INITIAL_GAME_STATE,
  FOODS,
  MAX_HUNGER,
  MAX_CLEANLINESS,
  MAX_HEARTS,
  CLEANLINESS_PER_POOP,
  DEATH_THRESHOLD_MS,
  LEVEL_THRESHOLDS,
  LEVEL_REWARDS,
  EXP_FEED,
  EXP_CLEAN,
  EXP_MEETING,
  HUNGER_DECAY_PER_MINUTE,
  COINS_PER_CLEAN,
  COINS_CLEAN_ALL_BONUS,
  COINS_PER_MEETING,
  HEARTS_PER_FEED,
  HEARTS_PER_CLEAN,
  HEART_HUNGER_BUFF_THRESHOLD,
  HEART_HUNGER_BUFF_RATE,
  HEART_UNHAPPY_DEBUFF_RATE,
  HEART_EXCHANGE_UNIT,
  HEART_EXCHANGE_COINS,
  MEDICINE_PRICE,
  SICK_POOP_THRESHOLD,
  EGG_HEART_THRESHOLD,
  EGG_LEVEL_THRESHOLD,
  EGG_ALL_UNLOCKED_COINS,
  ALL_CHARACTER_IDS,
  MINIGAME_COIN_PER_CORRECT,
  MINIGAME_HEART_PER_CORRECT,
  MINIGAME_EXP_PER_CORRECT,
} from '@shared/constants';
import { DAILY_REWARDS } from '@features/daily-login/constants';

function calculateLevel(exp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function applyLevelUp(
  state: GameState,
  newExp: number,
): Pick<GameState, 'exp' | 'level' | 'coins' | 'inventory' | 'levelUpMessage'> {
  const newLevel = calculateLevel(newExp);
  const base = { exp: newExp, level: newLevel, coins: state.coins, inventory: state.inventory, levelUpMessage: state.levelUpMessage };

  if (newLevel <= state.level) return base;

  const reward = LEVEL_REWARDS[newLevel];
  if (!reward) return base;

  const newInventory = { ...state.inventory };
  if (reward.food) {
    for (const [foodId, amount] of Object.entries(reward.food)) {
      newInventory[foodId as FoodId] = (newInventory[foodId as FoodId] || 0) + (amount ?? 0);
    }
  }

  return {
    exp: newExp,
    level: newLevel,
    coins: state.coins + reward.coins,
    inventory: newInventory,
    levelUpMessage: reward.message,
  };
}

function checkEggReady(state: GameState, newHearts: number): CharacterId | null {
  if (newHearts < EGG_HEART_THRESHOLD || state.level < EGG_LEVEL_THRESHOLD) return null;
  if (state.eggReadyCharacterId) return state.eggReadyCharacterId;

  const currentCharacter = state.characterId;
  const unlocked = new Set([...(state.unlockedCharacters ?? []), currentCharacter]);
  const available = ALL_CHARACTER_IDS.filter((id) => !unlocked.has(id));

  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function gameReducer(state: GameState, action: GameAction): GameState {
  const now = Date.now();

  switch (action.type) {
    case 'SELECT_CHARACTER':
      return {
        ...INITIAL_GAME_STATE,
        status: 'playing',
        characterId: action.characterId,
        nickname: action.nickname,
        unlockedCharacters: state.unlockedCharacters,
        lastUpdated: now,
      };

    case 'FEED': {
      const food = FOODS[action.foodId];
      const currentAmount = state.inventory[action.foodId];
      if (currentAmount <= 0) return state;

      const newHunger = Math.min(state.hunger + food.hungerRestore, MAX_HUNGER);
      const newHearts = Math.min(state.hearts + HEARTS_PER_FEED, MAX_HEARTS);
      const newExp = state.exp + EXP_FEED;
      const levelUp = applyLevelUp(state, newExp);
      const eggReady = checkEggReady({ ...state, ...levelUp }, newHearts);

      // 30~60초 후에 똥 생성 예약
      const poopDelay = 30_000 + Math.random() * 30_000;
      const pendingPoops = [...(state.pendingPoops ?? []), now + poopDelay];

      return {
        ...state,
        ...levelUp,
        hunger: newHunger,
        hearts: newHearts,
        inventory: { ...levelUp.inventory, [action.foodId]: currentAmount - 1 },
        pendingPoops,
        hungerZeroSince: newHunger > 0 ? null : state.hungerZeroSince,
        eggReadyCharacterId: eggReady,
        lastUpdated: now,
      };
    }

    case 'CLEAN_POOP': {
      const newPoops = state.poops.filter((p) => p.id !== action.poopId);
      const restored = CLEANLINESS_PER_POOP;
      const newCleanliness = Math.min(state.cleanliness + restored, MAX_CLEANLINESS);
      const newHearts = Math.min(state.hearts + HEARTS_PER_CLEAN, MAX_HEARTS);
      const newExp = state.exp + EXP_CLEAN;
      const levelUp = applyLevelUp(state, newExp);

      return {
        ...state,
        ...levelUp,
        poops: newPoops,
        cleanliness: newCleanliness,
        hearts: newHearts,
        coins: levelUp.coins + COINS_PER_CLEAN,
        cleanlinessZeroSince: newCleanliness > 0 ? null : state.cleanlinessZeroSince,
        lastUpdated: now,
      };
    }

    case 'CLEAN_ALL_POOP': {
      const poopCount = state.poops.length;
      if (poopCount === 0) return state;
      const restored = poopCount * CLEANLINESS_PER_POOP;
      const newCleanliness = Math.min(state.cleanliness + restored, MAX_CLEANLINESS);
      const newHearts = Math.min(state.hearts + HEARTS_PER_CLEAN * poopCount, MAX_HEARTS);
      const newExp = state.exp + EXP_CLEAN * poopCount;
      const levelUp = applyLevelUp(state, newExp);

      return {
        ...state,
        ...levelUp,
        poops: [],
        cleanliness: newCleanliness,
        hearts: newHearts,
        coins: levelUp.coins + (poopCount * COINS_PER_CLEAN) + COINS_CLEAN_ALL_BONUS,
        cleanlinessZeroSince: newCleanliness > 0 ? null : state.cleanlinessZeroSince,
        lastUpdated: now,
      };
    }

    case 'ADD_POOP': {
      const newPoops = [...state.poops, action.poop];
      const newCleanliness = Math.max(state.cleanliness - CLEANLINESS_PER_POOP, 0);
      return {
        ...state,
        poops: newPoops,
        cleanliness: newCleanliness,
        cleanlinessZeroSince:
          newCleanliness === 0 && !state.cleanlinessZeroSince ? now : state.cleanlinessZeroSince,
        lastUpdated: now,
      };
    }

    case 'DECAY_HUNGER': {
      let decayAmount = state.isSleeping ? action.amount * 0.5 : action.amount;

      // 행복도 버프/디버프
      if (state.hearts >= HEART_HUNGER_BUFF_THRESHOLD) {
        decayAmount *= HEART_HUNGER_BUFF_RATE;
      } else if (state.hearts === 0) {
        decayAmount *= HEART_UNHAPPY_DEBUFF_RATE;
      }

      // 아플 때 배고픔 2배 감소
      if (state.isSick) {
        decayAmount *= 2;
      }

      const newHunger = Math.max(state.hunger - decayAmount, 0);
      return {
        ...state,
        hunger: newHunger,
        hungerZeroSince:
          newHunger === 0 && !state.hungerZeroSince ? now : state.hungerZeroSince,
        lastUpdated: now,
      };
    }

    case 'DECAY_HEARTS': {
      const newHearts = Math.max(state.hearts - action.amount, 0);
      return { ...state, hearts: newHearts, lastUpdated: now };
    }

    case 'ADD_HEARTS': {
      const newHearts = Math.min(state.hearts + action.amount, MAX_HEARTS);
      const newExp = state.exp + EXP_MEETING;
      const levelUp = applyLevelUp(state, newExp);
      const eggReady = checkEggReady({ ...state, ...levelUp }, newHearts);

      return {
        ...state,
        ...levelUp,
        hearts: newHearts,
        coins: levelUp.coins + COINS_PER_MEETING,
        eggReadyCharacterId: eggReady,
        lastUpdated: now,
      };
    }

    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.amount, lastUpdated: now };

    case 'ADD_EXP': {
      const newExp = state.exp + action.amount;
      const levelUp = applyLevelUp(state, newExp);
      return { ...state, ...levelUp, lastUpdated: now };
    }

    case 'BUY_FOOD': {
      const food = FOODS[action.foodId];
      if (state.coins < food.price) return state;
      return {
        ...state,
        coins: state.coins - food.price,
        inventory: { ...state.inventory, [action.foodId]: state.inventory[action.foodId] + 1 },
        lastUpdated: now,
      };
    }

    case 'EXCHANGE_HEARTS': {
      const units = Math.floor(action.amount / HEART_EXCHANGE_UNIT);
      const heartsToSpend = units * HEART_EXCHANGE_UNIT;
      if (state.hearts < heartsToSpend || units <= 0) return state;
      return {
        ...state,
        hearts: state.hearts - heartsToSpend,
        coins: state.coins + units * HEART_EXCHANGE_COINS,
        lastUpdated: now,
      };
    }

    case 'GET_SICK': {
      if (state.isSick) return state;
      return { ...state, isSick: true, sickSince: now, lastUpdated: now };
    }

    case 'GIVE_MEDICINE': {
      if (!state.isSick || state.coins < MEDICINE_PRICE) return state;
      return {
        ...state,
        isSick: false,
        sickSince: null,
        coins: state.coins - MEDICINE_PRICE,
        lastUpdated: now,
      };
    }

    case 'MINIGAME_REWARD': {
      const { correctCount } = action;
      const coinsEarned = correctCount * MINIGAME_COIN_PER_CORRECT;
      const heartsEarned = correctCount * MINIGAME_HEART_PER_CORRECT;
      const expEarned = correctCount * MINIGAME_EXP_PER_CORRECT;
      const newHearts = Math.min(state.hearts + heartsEarned, MAX_HEARTS);
      const newExp = state.exp + expEarned;
      const levelUp = applyLevelUp(state, newExp);
      const eggReady = checkEggReady({ ...state, ...levelUp }, newHearts);

      return {
        ...state,
        ...levelUp,
        coins: levelUp.coins + coinsEarned,
        hearts: newHearts,
        eggReadyCharacterId: eggReady,
        lastUpdated: now,
      };
    }

    case 'COLLECT_EGG': {
      if (!state.eggReadyCharacterId) return state;

      const currentCharacter = state.characterId;
      const unlocked = new Set([...(state.unlockedCharacters ?? []), currentCharacter]);
      const isAlreadyUnlocked = unlocked.has(state.eggReadyCharacterId);

      return {
        ...state,
        hearts: 0,
        eggReadyCharacterId: null,
        unlockedCharacters: isAlreadyUnlocked
          ? state.unlockedCharacters
          : [...(state.unlockedCharacters ?? []), state.eggReadyCharacterId],
        coins: isAlreadyUnlocked ? state.coins + EGG_ALL_UNLOCKED_COINS : state.coins,
        lastUpdated: now,
      };
    }

    case 'DISMISS_LEVEL_UP':
      return { ...state, levelUpMessage: null };

    case 'COLLECT_DAILY_REWARD': {
      const today = new Date().toISOString().slice(0, 10);
      if (state.dailyRewardCollected && state.lastLoginDate === today) return state;

      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const isConsecutive = state.lastLoginDate === yesterday;
      const newStreak = isConsecutive ? state.loginStreak + 1 : 1;

      const rewardIndex = Math.min(newStreak - 1, DAILY_REWARDS.length - 1);
      const reward = DAILY_REWARDS[rewardIndex];

      const newInventory = { ...state.inventory };
      if (reward.food) {
        for (const [foodId, amount] of Object.entries(reward.food)) {
          newInventory[foodId as FoodId] = (newInventory[foodId as FoodId] || 0) + (amount as number);
        }
      }

      return {
        ...state,
        coins: state.coins + reward.coins,
        inventory: newInventory,
        lastLoginDate: today,
        loginStreak: newStreak,
        dailyRewardCollected: true,
        lastUpdated: now,
      };
    }

    case 'SET_SLEEPING':
      return { ...state, isSleeping: action.isSleeping, lastUpdated: now };

    case 'PROCESS_OFFLINE': {
      const elapsed = action.now - state.lastUpdated;
      const elapsedMinutes = elapsed / 60000;
      const cappedMinutes = Math.min(elapsedMinutes, 1440);

      if (cappedMinutes < 1) return { ...state, lastUpdated: action.now };

      const hungerDecay = cappedMinutes * HUNGER_DECAY_PER_MINUTE * 0.75;
      const newHunger = Math.max(state.hunger - hungerDecay, 0);

      let hungerZeroSince = state.hungerZeroSince;
      if (newHunger === 0 && !hungerZeroSince) {
        const minutesToZero = state.hunger / (HUNGER_DECAY_PER_MINUTE * 0.75);
        hungerZeroSince = state.lastUpdated + minutesToZero * 60000;
      }

      const isDead =
        (hungerZeroSince && action.now - hungerZeroSince >= DEATH_THRESHOLD_MS) ||
        (state.cleanlinessZeroSince && action.now - state.cleanlinessZeroSince >= DEATH_THRESHOLD_MS) ||
        (state.sickSince && action.now - state.sickSince >= DEATH_THRESHOLD_MS);

      return {
        ...state,
        hunger: newHunger,
        hungerZeroSince,
        status: isDead ? 'dead' : state.status,
        lastUpdated: action.now,
      };
    }

    case 'DIE':
      return { ...state, status: 'dead', lastUpdated: now };

    case 'RESET':
      return {
        ...INITIAL_GAME_STATE,
        coins: state.coins,
        unlockedCharacters: state.unlockedCharacters,
        lastUpdated: now,
      };

    case 'TICK': {
      if (state.status !== 'playing') return state;

      let updated = { ...state };
      let changed = false;

      // 예약된 똥 생성 체크
      const pending = state.pendingPoops ?? [];
      const ready = pending.filter((t) => now >= t);
      const remaining = pending.filter((t) => now < t);

      if (ready.length > 0) {
        const newPoops = ready.map(() => ({
          id: `poop-${now}-${Math.random().toString(36).slice(2, 6)}`,
          x: 10 + Math.random() * 80,
          y: 60 + Math.random() * 25,
          createdAt: now,
        }));
        const allPoops = [...state.poops, ...newPoops];
        const lostCleanliness = ready.length * CLEANLINESS_PER_POOP;
        const newCleanliness = Math.max(state.cleanliness - lostCleanliness, 0);

        updated = {
          ...updated,
          poops: allPoops,
          pendingPoops: remaining,
          cleanliness: newCleanliness,
          cleanlinessZeroSince:
            newCleanliness === 0 && !state.cleanlinessZeroSince ? now : state.cleanlinessZeroSince,
        };
        changed = true;
      }

      // 질병 체크: 똥 4개 이상이면 아픔
      if (!updated.isSick && updated.poops.length >= SICK_POOP_THRESHOLD) {
        updated = { ...updated, isSick: true, sickSince: now };
        changed = true;
      }

      // 사망 체크
      const isDead =
        (updated.hungerZeroSince && now - updated.hungerZeroSince >= DEATH_THRESHOLD_MS) ||
        (updated.cleanlinessZeroSince && now - updated.cleanlinessZeroSince >= DEATH_THRESHOLD_MS) ||
        (updated.sickSince && now - updated.sickSince >= DEATH_THRESHOLD_MS);

      if (isDead) return { ...updated, status: 'dead', lastUpdated: now };

      if (changed) return { ...updated, lastUpdated: now };
      return state;
    }

    case 'LOAD_STATE': {
      const loaded = { ...INITIAL_GAME_STATE, ...action.state };
      // 캐릭터 ID가 유효하지 않으면 선택 화면으로
      if (loaded.characterId && !ALL_CHARACTER_IDS.includes(loaded.characterId)) {
        return { ...INITIAL_GAME_STATE, lastUpdated: Date.now() };
      }
      return loaded;
    }

    default:
      return state;
  }
}

const STORAGE_KEY = 'plave-damagochi-state';

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드 + 오프라인 시간 처리
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        dispatch({ type: 'LOAD_STATE', state: parsed });
        dispatch({ type: 'PROCESS_OFFLINE', now: Date.now() });
      }
    } catch {
      // 무시
    }
    startTransition(() => setIsLoaded(true));
  }, []);

  // 상태 변경 시 저장
  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 무시
    }
  }, [state, isLoaded]);

  const feed = useCallback((foodId: FoodId) => dispatch({ type: 'FEED', foodId }), []);
  const cleanPoop = useCallback((poopId: string) => dispatch({ type: 'CLEAN_POOP', poopId }), []);
  const cleanAllPoop = useCallback(() => dispatch({ type: 'CLEAN_ALL_POOP' }), []);
  const addHearts = useCallback((amount: number) => dispatch({ type: 'ADD_HEARTS', amount }), []);
  const buyFood = useCallback((foodId: FoodId) => dispatch({ type: 'BUY_FOOD', foodId }), []);
  const exchangeHearts = useCallback((amount: number) => dispatch({ type: 'EXCHANGE_HEARTS', amount }), []);
  const giveMedicine = useCallback(() => dispatch({ type: 'GIVE_MEDICINE' }), []);
  const minigameReward = useCallback((correctCount: number) => dispatch({ type: 'MINIGAME_REWARD', correctCount }), []);
  const collectEgg = useCallback(() => dispatch({ type: 'COLLECT_EGG' }), []);
  const collectDailyReward = useCallback(() => dispatch({ type: 'COLLECT_DAILY_REWARD' }), []);
  const dismissLevelUp = useCallback(() => dispatch({ type: 'DISMISS_LEVEL_UP' }), []);
  const selectCharacter = useCallback(
    (characterId: CharacterId, nickname: string) =>
      dispatch({ type: 'SELECT_CHARACTER', characterId, nickname }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    state,
    isLoaded,
    dispatch,
    feed,
    cleanPoop,
    cleanAllPoop,
    addHearts,
    buyFood,
    exchangeHearts,
    giveMedicine,
    minigameReward,
    collectEgg,
    collectDailyReward,
    dismissLevelUp,
    selectCharacter,
    reset,
  };
}
