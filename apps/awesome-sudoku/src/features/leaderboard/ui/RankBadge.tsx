import { cn } from "@shared/model/utils";
import { memo } from "react";

const MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: "from-amber-400 to-yellow-500 text-white shadow-amber-200 dark:shadow-amber-800",
  2: "from-slate-300 to-slate-400 text-white shadow-slate-200 dark:shadow-slate-700",
  3: "from-orange-300 to-orange-400 text-white shadow-orange-200 dark:shadow-orange-800",
};

export const RankBadge = memo<{ rank: number }>(({ rank }) => {
  if (rank <= 3) {
    return (
      <div
        className={cn(
          "w-7 h-7 rounded-full bg-gradient-to-b",
          "flex items-center justify-center",
          "text-sm font-bold shadow-sm",
          MEDAL_COLORS[rank as 1 | 2 | 3],
        )}
      >
        {rank}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-7 h-7 flex items-center justify-center",
        "text-sm font-medium",
        "text-[rgb(var(--color-text-secondary))]",
      )}
    >
      {rank}
    </div>
  );
});

RankBadge.displayName = "RankBadge";
