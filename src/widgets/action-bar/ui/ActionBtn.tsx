type ActionBtnProps = {
  icon: string;
  label: string;
  onClick: () => void;
  badge?: number | string;
  disabled?: boolean;
  highlight?: boolean;
};

export default function ActionBtn({
  icon,
  label,
  onClick,
  badge,
  disabled,
  highlight,
}: ActionBtnProps) {
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
      <span className="text-[10px] sm:text-xs font-bold text-gray-500">
        {label}
      </span>
      {badge !== undefined && badge !== 0 && badge !== '' && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-7 h-5 flex items-center justify-center shadow-sm tabular-nums whitespace-nowrap">
          {badge}
        </span>
      )}
    </button>
  );
}
