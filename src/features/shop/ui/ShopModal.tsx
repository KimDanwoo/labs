'use client';

import { useState } from 'react';
import type { FoodId } from '@shared/types';
import { FOODS, HEART_EXCHANGE_UNIT, HEART_EXCHANGE_COINS } from '@shared/constants';

type ShopModalProps = {
  coins: number;
  hearts: number;
  inventory: Record<FoodId, number>;
  onBuy: (foodId: FoodId) => void;
  onExchangeHearts: (amount: number) => void;
  onClose: () => void;
};

type Tab = 'food' | 'exchange';

const FOOD_LIST = Object.values(FOODS);

export default function ShopModal({ coins, hearts, inventory, onBuy, onExchangeHearts, onClose }: ShopModalProps) {
  const [tab, setTab] = useState<Tab>('food');
  const canExchange = hearts >= HEART_EXCHANGE_UNIT;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 modal-overlay" onClick={onClose} />
      <div className="relative w-full max-w-md modal-content rounded-t-3xl rounded-b-none p-5 sm:p-6 space-y-4 animate-slide-up">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-700">🏪 상점</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-yellow-500">🪙 {coins}</span>
            <span className="text-sm font-bold text-pink-400">💕 {Math.round(hearts)}</span>
            <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('food')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'food' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}
          >
            🍖 음식
          </button>
          <button
            onClick={() => setTab('exchange')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'exchange' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400'}`}
          >
            💱 교환
          </button>
        </div>

        {tab === 'food' && (
          <div className="grid grid-cols-2 gap-3">
            {FOOD_LIST.map((food) => {
              const canBuy = coins >= food.price;
              return (
                <button
                  key={food.id}
                  onClick={() => onBuy(food.id)}
                  disabled={!canBuy}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 btn-press disabled:opacity-30"
                >
                  <span className="text-3xl">{food.emoji}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-gray-700">{food.name}</div>
                    <div className="text-xs text-green-500">+{food.hungerRestore} 배고픔</div>
                    <div className="text-xs text-yellow-500 font-bold">🪙 {food.price}</div>
                    <div className="text-xs text-gray-400">보유: {inventory[food.id]}개</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'exchange' && (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="text-4xl">💕 → 🪙</div>
              <p className="text-sm text-gray-500">
                행복도 {HEART_EXCHANGE_UNIT} → 코인 {HEART_EXCHANGE_COINS}
              </p>
            </div>
            <button
              onClick={() => onExchangeHearts(HEART_EXCHANGE_UNIT)}
              disabled={!canExchange}
              className="w-full py-3 rounded-xl bg-pink-400 text-white font-bold btn-press disabled:opacity-30"
            >
              {canExchange
                ? `💕 ${HEART_EXCHANGE_UNIT} → 🪙 ${HEART_EXCHANGE_COINS} 교환`
                : `행복도가 부족해요 (${Math.round(hearts)}/${HEART_EXCHANGE_UNIT})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
