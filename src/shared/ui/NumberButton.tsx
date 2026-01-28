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
      // Base sizing - generous touch targets
      "w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16",
      // Shape
      "rounded-2xl",
      // Typography
      "text-xl md:text-2xl font-medium",
      "font-tabular",
      // Layout
      "flex items-center justify-center",
      // Transitions
      "transition-all duration-150 ease-out",
      // States
      isDisabled
        ? "text-[rgb(199,199,204)] cursor-not-allowed"
        : "text-[rgb(28,28,30)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
      !isDisabled && "hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:scale-105",
      !isDisabled && "active:scale-95 active:shadow-[0_1px_4px_rgba(0,0,0,0.08)]",
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(0,122,255)]/30",
    )}
    onClick={onClick}
    disabled={isDisabled}
  >
    {value}
  </button>
));

NumberButton.displayName = "NumberButton";
