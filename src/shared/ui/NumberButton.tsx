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
      "max-w-8 xs:max-w-10 lg:max-w-[72px] xl:max-w-[88px]",
      // Shape
      "rounded-xl md:rounded-2xl",
      // Typography
      "text-lg xs:text-xl md:text-3xl lg:text-4xl font-semibold",
      "font-tabular",
      // Layout
      "flex items-center justify-center",
      // Transitions
      "transition-all duration-200 ease-out",
      // States
      isDisabled
        ? [
          "text-[rgb(var(--color-text-tertiary))] cursor-not-allowed",
          "bg-[rgb(var(--color-bg-tertiary))]/50",
          "border border-[rgb(var(--color-border-light))]",
        ]
        : [
          "text-[rgb(var(--color-text-primary))]",
          "bg-gradient-to-b",
          "from-[rgb(var(--color-surface-primary))]",
          "to-[rgb(var(--color-bg-tertiary))]",
          "shadow-sm border",
          "border-[rgb(var(--color-border-light))]/60",
          "hover:from-[rgb(var(--color-accent-light))]",
          "hover:to-[rgb(var(--color-surface-primary))]",
          "hover:text-[rgb(var(--color-accent))]",
          "hover:shadow-md",
          "hover:border-[rgb(var(--color-accent))]/30",
          "hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-sm",
        ],
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-accent))]/40",
    )}
    onClick={onClick}
    disabled={isDisabled}
  >
    {value}
  </button>
));

NumberButton.displayName = "NumberButton";
