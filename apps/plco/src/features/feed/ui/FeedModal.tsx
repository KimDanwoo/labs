'use client';

import { useAtomValue } from 'jotai';
import { FOODS } from '@shared/constants';
import { ModalShell } from '@shared/ui';
import { inventoryAtom } from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';

const FOOD_LIST = Object.values(FOODS);

export default function FeedModal() {
  const inventory = useAtomValue(inventoryAtom);
  const { feed, closeModal } = useGameActions();

  return (
    <ModalShell
      variant="sheet"
      onClose={closeModal}
      className="p-5 sm:p-6 space-y-4"
    >
      {(close) => (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-700">밥 주기</h3>
            <button onClick={close} className="text-gray-400 text-xl">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FOOD_LIST.map((food) => {
              const count = inventory[food.id];
              return (
                <button
                  key={food.id}
                  onClick={() => feed(food.id)}
                  disabled={count <= 0}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 btn-press disabled:opacity-30"
                >
                  <span className="text-3xl">{food.emoji}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-gray-700">
                      {food.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      +{food.hungerRestore} 배고픔
                    </div>
                    <div className="text-xs text-orange-400 font-bold">
                      {count}개
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </ModalShell>
  );
}
