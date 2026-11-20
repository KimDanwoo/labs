import { TENSION } from '@views/walk/config/fishing';
import { fishSurge, type Fight } from '@views/walk/lib/fishFight';
import { FISHING_PHASE, type Catch, type FishingPhase } from '@views/walk/lib/fishing';

interface MessageInput {
  phase: FishingPhase;
  failure: string;
  fishName: string | undefined;
  caught: Catch | null;
  isNew: boolean;
}

export function fishingMessage({ phase, failure, fishName, caught, isNew }: MessageInput) {
  const hasCaughtFish = fishName && caught;
  const messages = {
    [FISHING_PHASE.casting]: '낚싯대를 휘둘러 바다로 던져요…',
    [FISHING_PHASE.idle]: '바람을 느끼며 낚싯줄을 던져 보세요.',
    [FISHING_PHASE.waiting]: '찌가 잠길 때까지 잠깐 기다려요…',
    [FISHING_PHASE.bite]: '지금! 낚싯대를 올려요!',
    [FISHING_PHASE.missed]: failure,
    [FISHING_PHASE.fighting]: '쭉 당겨요! 물고기가 힘을 쓰면 잠깐 놓아 주세요.',
    [FISHING_PHASE.caught]: hasCaughtFish ? `${isNew ? '처음 만난 물고기! ' : ''}${fishName} · ${caught.size} cm` : '',
  };
  return messages[phase];
}

export function fishingActionLabel(phase: FishingPhase) {
  if (phase === FISHING_PHASE.casting) return '줄을 던지는 중';
  if (phase === FISHING_PHASE.waiting) return '낚싯줄 걷기';
  if (phase === FISHING_PHASE.bite) return '챔질하기!';
  return '다시 던지기';
}

interface BadgeInput {
  isRecord: boolean;
  isNew: boolean;
  isLegendary: boolean;
}

export function catchBadge({ isRecord, isNew, isLegendary }: BadgeInput) {
  if (isLegendary) return `전설의 물고기! ${isNew ? '첫 발견' : ''}`;
  if (isNew) return '새로운 물고기 발견!';
  if (isRecord) return '최대 크기 신기록!';
  return '잡았다!';
}

export function fightGuidance(fight: Fight, fishId: string) {
  if (fight.tension < TENSION.slack) return '지금 감아 주세요!';
  if (fight.tension > TENSION.strain) return '줄을 잠깐 풀어요!';
  return fishSurge(fishId, fight.elapsed) ? '물고기가 힘을 쓰고 있어요!' : '힘이 풀렸어요 · 감을 기회!';
}
