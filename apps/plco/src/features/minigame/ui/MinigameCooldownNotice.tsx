import { formatCooldownKo } from '@shared/lib';

type MinigameCooldownNoticeProps = {
  remainingMs: number;
};

export default function MinigameCooldownNotice({
  remainingMs,
}: MinigameCooldownNoticeProps) {
  return (
    <div className="text-[11px] text-gray-400">
      ⏳ 다음 플레이까지 {formatCooldownKo(remainingMs)}
    </div>
  );
}
