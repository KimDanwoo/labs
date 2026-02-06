import { cn } from "@shared/model/utils";
import { memo } from "react";

interface NumberButtonProps {
  value: number;
  onClick: () => void;
  isDisabled: boolean;
}

export const NumberButton: React.FC<NumberButtonProps> = memo(({ value, onClick, isDisabled }) => (
  <button
    className={cn(
      // Size - constrained on desktop to fit panel
      "w-full aspect-square",
      "max-w-8 sm:max-w-10 lg:max-w-[72px] xl:max-w-[88px]",
      // Shape
      "rounded-xl md:rounded-2xl",
      // Typography
      "text-lg sm:text-xl md:text-3xl lg:text-4xl font-semibold",
      "font-tabular",
      // Layout
      "flex items-center justify-center",
      // Transitions
      "transition-all duration-200 ease-out",
      // States
      isDisabled
        ? "text-slate-300 cursor-not-allowed bg-slate-50/50 border border-slate-100"
        : "text-slate-700 bg-gradient-to-b from-white to-slate-50 " +
          "shadow-sm border border-slate-200/60 " +
          "hover:from-blue-50 hover:to-white hover:text-blue-600 " +
          "hover:shadow-md hover:border-blue-200/60 hover:-translate-y-0.5 " +
          "active:translate-y-0 active:shadow-sm",
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
    )}
    onClick={onClick}
    disabled={isDisabled}
  >
    {value}
  </button>
));

NumberButton.displayName = "NumberButton";
