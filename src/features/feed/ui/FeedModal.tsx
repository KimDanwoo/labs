'use client';

import type { FoodId } from '@shared/types';
import { FOODS } from '@shared/constants';

type FeedModalProps = {
  inventory: Record<FoodId, number>;
  onFeed: (foodId: FoodId) => void;
  onClose: () => void;
};

const FOOD_LIST = Object.values(FOODS);

export default function FeedModal({ inventory, onFeed, onClose }: FeedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 modal-overlay" onClick={onClose} />
      <div className="relative w-full max-w-md modal-content rounded-t-3xl rounded-b-none p-5 sm:p-6 space-y-4 animate-slide-up">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-700">밥 주기</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FOOD_LIST.map((food) => {
            const count = inventory[food.id];
            return (
              <button
                key={food.id}
                onClick={() => {
                  onFeed(food.id);
                  onClose();
                }}
                disabled={count <= 0}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 btn-press disabled:opacity-30"
              >
                <span className="text-3xl">{food.emoji}</span>
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-700">{food.name}</div>
                  <div className="text-xs text-gray-400">+{food.hungerRestore} 배고픔</div>
                  <div className="text-xs text-orange-400 font-bold">{count}개</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
