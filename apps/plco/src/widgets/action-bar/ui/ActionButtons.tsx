'use client';

import { useAtomValue } from 'jotai';
import { MEDICINE_PRICE, MODAL_TYPE } from '@shared/constants';
import { formatCooldownShort } from '@shared/lib';
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
import ActionBtn from './ActionBtn';

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

  const meetingBadge =
    meeting.cooldownRemainingMs > 0
      ? formatCooldownShort(meeting.cooldownRemainingMs)
      : meeting.reachedDailyLimit
        ? '⛔'
        : `${meeting.dailyLimit - meeting.meetingsToday}`;

  const minigameBadge = minigame.canPlay
    ? undefined
    : formatCooldownShort(minigame.cooldownRemainingMs);

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
      <ActionBtn
        icon="🍖"
        label="밥주기"
        onClick={() => openModal(MODAL_TYPE.FEED)}
        disabled={!hasFood}
      />
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
      <ActionBtn
        icon="🏪"
        label="상점"
        onClick={() => openModal(MODAL_TYPE.SHOP)}
      />
    </div>
  );
}
