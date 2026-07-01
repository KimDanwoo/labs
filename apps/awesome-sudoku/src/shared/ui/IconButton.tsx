import { cn } from "@shared/model/utils";

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label?: string;
  "aria-label"?: string;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "primary" | "subtle";
  badge?: string | number;
}

export const IconButton = ({
  icon,
  onClick,
  label,
  "aria-label": ariaLabel,
  className,
  disabled,
  variant = "default",
  badge,
}: IconButtonProps) => (
  <button
    aria-label={ariaLabel ?? label}
    className={cn(
      // Layout
      "flex flex-col items-center justify-center gap-1.5",
      // Sizing - constrained on desktop to fit panel
      "w-full aspect-square",
      "lg:max-w-[72px] xl:max-w-[88px]",
      // Shape - softer rounded
      "rounded-2xl",
      // Typography
      "text-xs font-medium tracking-wide",
      // Transitions
      "transition-all duration-200 ease-out",
      // Disabled state
      disabled && "opacity-40 cursor-not-allowed",
      // Variants
      variant === "default" && [
        "bg-gradient-to-b from-[rgb(var(--color-bg-tertiary))] to-[rgb(var(--color-surface-tertiary))]",
        "text-[rgb(var(--color-text-secondary))]",
        "shadow-sm",
        "border border-[rgb(var(--color-border-light))]/50",
        !disabled && [
          "hover:from-[rgb(var(--color-surface-primary))]",
          "hover:to-[rgb(var(--color-bg-tertiary))]",
          "hover:text-[rgb(var(--color-text-primary))]",
        ],
        !disabled && "hover:shadow-md hover:border-[rgb(var(--color-border-light))]",
        !disabled && "active:scale-95",
      ],
      variant === "primary" && [
        "bg-gradient-to-b from-[rgb(var(--color-gradient-from))] to-[rgb(var(--color-gradient-to))]",
        "text-white",
        "shadow-lg shadow-[rgb(var(--color-gradient-from))]/30",
        "border border-[rgb(var(--color-gradient-from))]/20",
        !disabled && "hover:brightness-110",
        !disabled && "hover:shadow-xl hover:shadow-[rgb(var(--color-gradient-from))]/40",
        !disabled && "active:scale-95",
      ],
      variant === "subtle" && [
        "bg-transparent",
        "text-[rgb(var(--color-text-secondary))]",
        !disabled && "hover:bg-[rgb(var(--color-hover))] hover:text-[rgb(var(--color-text-primary))]",
        !disabled && "active:scale-95",
      ],
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-accent))]/40",
      // Relative for badge
      "relative",
      className,
    )}
    onClick={onClick}
    disabled={disabled}
  >
    <span className="text-xl" aria-hidden="true">{icon}</span>
    {label && <span className="whitespace-nowrap">{label}</span>}
    {badge !== undefined && (
      <span
        className={cn(
          "absolute -top-1 -right-1",
          "min-w-[20px] h-[20px] px-1.5",
          "bg-gradient-to-br from-[rgb(var(--color-gradient-from))] to-[rgb(var(--color-gradient-to))]",
          "text-white text-xs font-bold",
          "rounded-full",
          "flex items-center justify-center",
          "shadow-lg shadow-[rgb(var(--color-gradient-from))]/30",
          "border-2 border-[rgb(var(--color-surface-primary))]",
        )}
      >
        {badge}
      </span>
    )}
  </button>
);

export default IconButton;
