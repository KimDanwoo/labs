'use client';

import { DAILY_REWARDS } from '../model';

type DailyLoginModalProps = {
  streak: number;
  onCollect: () => void;
};

export default function DailyLoginModal({ streak, onCollect }: DailyLoginModalProps) {
  const rewardIndex = Math.min(streak - 1, DAILY_REWARDS.length - 1);
  const reward = DAILY_REWARDS[rewardIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 modal-overlay" />
      <div className="relative w-full max-w-sm modal-content p-6 mx-4 text-center space-y-5 animate-scale-in">
        <h3 className="text-lg font-bold text-gray-700">출석 보상!</h3>

        <div className="text-4xl py-2">📅</div>

        <div className="space-y-2">
          <p className="text-2xl font-bold text-pink-500">{streak}일 연속 출석</p>
          <p className="text-sm text-gray-400">
            {streak >= 7 ? '7일 연속 달성! 최대 보상!' : `${7 - streak}일 더 하면 최대 보상!`}
          </p>
        </div>

        {/* 보상 내용 */}
        <div className="surface rounded-2xl p-4 space-y-2">
          <div className="text-lg font-bold text-amber-500">🪙 +{reward.coins}</div>
          {reward.food && (
            <div className="flex justify-center gap-3 text-sm text-gray-500">
              {Object.entries(reward.food).map(([food, count]) => (
                <span key={food}>
                  {food === 'bread' && '🍞'}
                  {food === 'riceball' && '🍙'}
                  {food === 'meat' && '🍖'}
                  {food === 'cake' && '🎂'}
                  {' '}x{count}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 7일 진행도 */}
        <div className="flex justify-center gap-1.5">
          {DAILY_REWARDS.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                i < streak
                  ? 'bg-pink-400 text-white'
                  : i === streak
                    ? 'bg-pink-100 text-pink-400 border border-pink-300'
                    : 'bg-gray-100 text-gray-300'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <button
          onClick={onCollect}
          className="btn-primary btn-press w-full"
          style={{ backgroundColor: '#FF6B9D' }}
        >
          받기!
        </button>
      </div>
    </div>
  );
}
