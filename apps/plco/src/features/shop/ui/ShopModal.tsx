'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  FOODS,
  HEART_EXCHANGE_UNIT,
  HEART_EXCHANGE_COINS,
} from '@shared/constants';
import { ModalShell } from '@shared/ui';
import {
  coinsAtom,
  heartsAtom,
  inventoryAtom,
} from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';

const SHOP_TAB = {
  FOOD: 'food',
  EXCHANGE: 'exchange',
} as const;

type ShopTab = (typeof SHOP_TAB)[keyof typeof SHOP_TAB];

const FOOD_LIST = Object.values(FOODS);

export default function ShopModal() {
  const coins = useAtomValue(coinsAtom);
  const hearts = useAtomValue(heartsAtom);
  const inventory = useAtomValue(inventoryAtom);
  const { buyFood, exchangeHearts, closeModal } = useGameActions();

  const [tab, setTab] = useState<ShopTab>(SHOP_TAB.FOOD);
  const canExchange = hearts >= HEART_EXCHANGE_UNIT;

  return (
    <ModalShell
      variant="sheet"
      onClose={closeModal}
      className="p-5 sm:p-6 space-y-4"
    >
      {(close) => (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-700">🏪 상점</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-yellow-500">
                🪙 {coins}
              </span>
              <span className="text-sm font-bold text-pink-400">
                💕 {Math.round(hearts)}
              </span>
              <button onClick={close} className="text-gray-400 text-xl">
                ✕
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab(SHOP_TAB.FOOD)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                tab === SHOP_TAB.FOOD
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              🍖 음식
            </button>
            <button
              onClick={() => setTab(SHOP_TAB.EXCHANGE)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                tab === SHOP_TAB.EXCHANGE
                  ? 'bg-pink-100 text-pink-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              💱 교환
            </button>
          </div>

          {tab === SHOP_TAB.FOOD && (
            <div className="grid grid-cols-2 gap-3">
              {FOOD_LIST.map((food) => {
                const canBuy = coins >= food.price;
                return (
                  <button
                    key={food.id}
                    onClick={() => buyFood(food.id)}
                    disabled={!canBuy}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 btn-press disabled:opacity-30"
                  >
                    <span className="text-3xl">{food.emoji}</span>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-700">
                        {food.name}
                      </div>
                      <div className="text-xs text-green-500">
                        +{food.hungerRestore} 배고픔
                      </div>
                      <div className="text-xs text-yellow-500 font-bold">
                        🪙 {food.price}
                      </div>
                      <div className="text-xs text-gray-400">
                        보유: {inventory[food.id]}개
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {tab === SHOP_TAB.EXCHANGE && (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-2">
                <div className="text-4xl">💕 → 🪙</div>
                <p className="text-sm text-gray-500">
                  행복도 {HEART_EXCHANGE_UNIT} → 코인 {HEART_EXCHANGE_COINS}
                </p>
              </div>
              <button
                onClick={() => exchangeHearts(HEART_EXCHANGE_UNIT)}
                disabled={!canExchange}
                className="w-full py-3 rounded-xl bg-pink-400 text-white font-bold btn-press disabled:opacity-30"
              >
                {canExchange
                  ? `💕 ${HEART_EXCHANGE_UNIT} → 🪙 ${HEART_EXCHANGE_COINS} 교환`
                  : `행복도가 부족해요 (${Math.round(hearts)}/${HEART_EXCHANGE_UNIT})`}
              </button>
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}
