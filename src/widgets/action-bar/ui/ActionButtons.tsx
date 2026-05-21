'use client';

type ActionButtonsProps = {
  onFeed: () => void;
  onClean: () => void;
  onMeeting: () => void;
  onShop: () => void;
  onMedicine: () => void;
  onMinigame: () => void;
  poopCount: number;
  hasFood: boolean;
  isSick: boolean;
  canAffordMedicine: boolean;
};

type ActionBtnProps = {
  icon: string;
  label: string;
  onClick: () => void;
  badge?: number;
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
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function ActionButtons({
  onFeed,
  onClean,
  onMeeting,
  onShop,
  onMedicine,
  onMinigame,
  poopCount,
  hasFood,
  isSick,
  canAffordMedicine,
}: ActionButtonsProps) {
  return (
    <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
      <ActionBtn icon="🍖" label="밥주기" onClick={onFeed} disabled={!hasFood} />
      <ActionBtn icon="🧹" label="청소" onClick={onClean} badge={poopCount} disabled={poopCount === 0} />
      <ActionBtn icon="🎮" label="놀기" onClick={onMinigame} />
      <ActionBtn icon="💌" label="만남" onClick={onMeeting} />
      {isSick && (
        <ActionBtn icon="💊" label="약주기" onClick={onMedicine} disabled={!canAffordMedicine} highlight />
      )}
      <ActionBtn icon="🏪" label="상점" onClick={onShop} />
    </div>
  );
}
