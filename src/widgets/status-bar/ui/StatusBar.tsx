'use client';

import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import {
  MAX_HUNGER,
  MAX_CLEANLINESS,
  MAX_HEARTS,
  WARNING_THRESHOLD,
  DANGER_THRESHOLD,
  MODAL_TYPE,
} from '@shared/constants';
import {
  hungerAtom,
  cleanlinessAtom,
  heartsAtom,
  levelAtom,
  coinsAtom,
  isSickAtom,
  nicknameAtom,
} from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';

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
      <span
        className={`text-[11px] font-bold min-w-[24px] text-right tabular-nums ${
          isDanger
            ? 'text-red-500'
            : isWarning
              ? 'text-amber-500'
              : 'text-gray-400'
        }`}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}

export default function StatusBar() {
  const hunger = useAtomValue(hungerAtom);
  const cleanliness = useAtomValue(cleanlinessAtom);
  const hearts = useAtomValue(heartsAtom);
  const level = useAtomValue(levelAtom);
  const coins = useAtomValue(coinsAtom);
  const isSick = useAtomValue(isSickAtom);
  const nickname = useAtomValue(nicknameAtom);
  const { openModal } = useGameActions();
  const router = useRouter();

  return (
    <div className="card p-3 space-y-1.5">
      <div className="flex justify-between items-center pb-1 border-b border-black/5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white bg-gray-700 px-2 py-0.5 rounded-md">
            Lv.{level}
          </span>
          <button
            onClick={() => router.push('/')}
            className="text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1 btn-press"
            aria-label="캐릭터 선택으로 가기"
          >
            {nickname}
            <span className="text-[10px] text-gray-400">⇄</span>
          </button>
          {isSick && <span className="text-xs animate-pulse">🤒 아파요</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-amber-500">🪙</span>
            <span className="text-xs font-bold text-gray-600 tabular-nums">
              {coins}
            </span>
          </div>
          <button
            onClick={() => openModal(MODAL_TYPE.SETTINGS)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors leading-none"
            aria-label="설정"
          >
            ⚙️
          </button>
        </div>
      </div>

      <Gauge value={hunger} max={MAX_HUNGER} color="var(--color-gauge-hunger)" icon="🍖" />
      <Gauge
        value={cleanliness}
        max={MAX_CLEANLINESS}
        color="var(--color-gauge-clean)"
        icon="✨"
      />
      <Gauge value={hearts} max={MAX_HEARTS} color="var(--color-gauge-heart)" icon="💕" />
    </div>
  );
}
