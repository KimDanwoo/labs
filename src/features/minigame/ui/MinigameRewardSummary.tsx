import {
  MINIGAME_COIN_PER_CORRECT,
  MINIGAME_HEART_PER_CORRECT,
} from '@shared/constants';

type MinigameRewardSummaryProps = {
  score: number;
};

export default function MinigameRewardSummary({
  score,
}: MinigameRewardSummaryProps) {
  return (
    <div className="flex justify-center gap-6">
      <div className="text-center">
        <div className="text-lg font-bold text-amber-500">
          🪙 +{score * MINIGAME_COIN_PER_CORRECT}
        </div>
        <div className="text-[10px] text-gray-400">코인</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-pink-400">
          💕 +{score * MINIGAME_HEART_PER_CORRECT}
        </div>
        <div className="text-[10px] text-gray-400">행복도</div>
      </div>
    </div>
  );
}
