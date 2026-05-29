'use client';

import { useAtomValue } from 'jotai';
import { MEDICINE_PRICE, MODAL_TYPE } from '@shared/constants';
import {
  poopsAtom,
  hasFoodAtom,
  isSickAtom,
  coinsAtom,
} from '@entities/game/model/store';
import {
  useGameActions,
  useMeetingStatus,
  useMinigameStatus,
} from '@entities/game/model/hooks';

type ActionBtnProps = {
  icon: string;
  label: string;
  onClick: () => void;
  badge?: number | string;
  disabled?: boolean;
  highlight?: boolean;
};

function ActionBtn({ icon, label, onClick, badge, disabled, highlight }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-2xl transition-all btn-press disabled:opacity-30 relative min-w-[54px] sm:min-w-[62px] ${
        highlight
          ? 'bg-red-50 border border-red-200 animate-pulse shadow-game-md'
          : 'surface shadow-game-sm hover:shadow-game-md'
      }`}
    >
      <span className="text-xl sm:text-2xl">{icon}</span>
      <span className="text-[10px] sm:text-xs font-bold text-gray-500">{label}</span>
      {badge !== undefined && badge !== 0 && badge !== '' && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-7 h-5 flex items-center justify-center shadow-sm tabular-nums whitespace-nowrap">
          {badge}
        </span>
      )}
    </button>
  );
}

function formatCooldown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  return `${Math.ceil(totalSec / 60)}m`;
}

export default function ActionButtons() {
  const poops = useAtomValue(poopsAtom);
  const hasFood = useAtomValue(hasFoodAtom);
  const isSick = useAtomValue(isSickAtom);
  const coins = useAtomValue(coinsAtom);
  const { cleanAllPoop, giveMedicine, openModal } = useGameActions();
  const meeting = useMeetingStatus();
  const minigame = useMinigameStatus();

  const poopCount = poops.length;
  const canAffordMedicine = coins >= MEDICINE_PRICE;

  const meetingBadge = meeting.cooldownRemainingMs > 0
    ? formatCooldown(meeting.cooldownRemainingMs)
    : meeting.reachedDailyLimit
      ? '⛔'
      : `${meeting.dailyLimit - meeting.meetingsToday}`;

  const minigameBadge = minigame.canPlay
    ? undefined
    : formatCooldown(minigame.cooldownRemainingMs);

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
      <ActionBtn icon="🍖" label="밥주기" onClick={() => openModal(MODAL_TYPE.FEED)} disabled={!hasFood} />
      <ActionBtn
        icon="🧹"
        label="청소"
        onClick={cleanAllPoop}
        badge={poopCount}
        disabled={poopCount === 0}
      />
      <ActionBtn
        icon="🎮"
        label="놀기"
        onClick={() => openModal(MODAL_TYPE.MINIGAME)}
        badge={minigameBadge}
        disabled={!minigame.canPlay}
      />
      <ActionBtn
        icon="💌"
        label="만남"
        onClick={() => openModal(MODAL_TYPE.MEETING)}
        badge={meetingBadge}
        disabled={!meeting.canMeet}
      />
      {isSick && (
        <ActionBtn
          icon="💊"
          label="약주기"
          onClick={giveMedicine}
          disabled={!canAffordMedicine}
          highlight
        />
      )}
      <ActionBtn icon="🏪" label="상점" onClick={() => openModal(MODAL_TYPE.SHOP)} />
    </div>
  );
}
