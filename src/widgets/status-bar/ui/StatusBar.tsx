'use client';

import { MAX_HUNGER, MAX_CLEANLINESS, MAX_HEARTS, WARNING_THRESHOLD, DANGER_THRESHOLD } from '@shared/constants';

type StatusBarProps = {
  hunger: number;
  cleanliness: number;
  hearts: number;
  level: number;
  coins: number;
  isSick: boolean;
  nickname: string;
  characterEmoji: string;
  onSettings: () => void;
};

type GaugeProps = {
  value: number;
  max: number;
  color: string;
  icon: string;
};

function Gauge({ value, max, color, icon }: GaugeProps) {
  const percent = Math.round((value / max) * 100);
  const isDanger = percent <= DANGER_THRESHOLD;
  const isWarning = percent <= WARNING_THRESHOLD && !isDanger;

  const barColor = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : color;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5 text-center">{icon}</span>
      <div className="flex-1 h-2 sm:h-2.5 bg-black/5 rounded-full overflow-hidden">
        <div
          className={`gauge-bar h-full ${isDanger ? 'animate-pulse' : ''}`}
          style={{ width: `${percent}%`, backgroundColor: barColor }}
        />
      </div>
      <span className={`text-[11px] font-bold min-w-[24px] text-right tabular-nums ${
        isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-400'
      }`}>
        {Math.round(value)}
      </span>
    </div>
  );
}

export default function StatusBar({ hunger, cleanliness, hearts, level, coins, isSick, nickname, characterEmoji, onSettings }: StatusBarProps) {
  return (
    <div className="card p-3 space-y-1.5">
      <div className="flex justify-between items-center pb-1 border-b border-black/5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white bg-gray-700 px-2 py-0.5 rounded-md">Lv.{level}</span>
          <span className="text-xs font-bold text-gray-600">{characterEmoji} {nickname}</span>
          {isSick && <span className="text-xs animate-pulse">🤒</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-amber-500">🪙</span>
            <span className="text-xs font-bold text-gray-600 tabular-nums">{coins}</span>
          </div>
          <button
            onClick={onSettings}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 btn-press text-xs"
          >
            ⚙️
          </button>
        </div>
      </div>

      <Gauge value={hunger} max={MAX_HUNGER} color="var(--color-gauge-hunger)" icon="🍖" />
      <Gauge value={cleanliness} max={MAX_CLEANLINESS} color="var(--color-gauge-clean)" icon="✨" />
      <Gauge value={hearts} max={MAX_HEARTS} color="var(--color-gauge-heart)" icon="💕" />
    </div>
  );
}
