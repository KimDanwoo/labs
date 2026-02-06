import { cn } from "@shared/model/utils";

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "primary" | "subtle";
  badge?: string | number;
}

export const IconButton = ({
  icon,
  onClick,
  label,
  className,
  disabled,
  variant = "default",
  badge,
}: IconButtonProps) => (
  <button
    className={cn(
      // Layout
      "flex flex-col items-center justify-center gap-1.5",
      // Sizing - constrained on desktop to fit panel
      "w-full aspect-square",
      "lg:max-w-[72px] xl:max-w-[88px]",
      // Shape - softer rounded
      "rounded-2xl",
      // Typography
      "text-[10px] font-medium tracking-wide",
      // Transitions
      "transition-all duration-200 ease-out",
      // Disabled state
      disabled && "opacity-40 cursor-not-allowed",
      // Variants
      variant === "default" && [
        "bg-gradient-to-b from-slate-50 to-slate-100",
        "text-slate-500",
        "shadow-sm",
        "border border-slate-200/50",
        !disabled && "hover:from-white hover:to-slate-50 hover:text-slate-700",
        !disabled && "hover:shadow-md hover:border-slate-200",
        !disabled && "active:scale-95",
      ],
      variant === "primary" && [
        "bg-gradient-to-b from-blue-500 to-indigo-600",
        "text-white",
        "shadow-lg shadow-blue-500/30",
        "border border-blue-400/20",
        !disabled && "hover:from-blue-400 hover:to-indigo-500",
        !disabled && "hover:shadow-xl hover:shadow-blue-500/40",
        !disabled && "active:scale-95",
      ],
      variant === "subtle" && [
        "bg-transparent",
        "text-slate-500",
        !disabled && "hover:bg-slate-100 hover:text-slate-700",
        !disabled && "active:scale-95",
      ],
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
      // Relative for badge
      "relative",
      className,
    )}
    onClick={onClick}
    disabled={disabled}
  >
    <span className="text-xl">{icon}</span>
    {label && <span className="whitespace-nowrap">{label}</span>}
    {badge !== undefined && (
      <span
        className={cn(
          "absolute -top-1 -right-1",
          "min-w-[20px] h-[20px] px-1.5",
          "bg-gradient-to-br from-blue-500 to-indigo-600",
          "text-white text-[10px] font-bold",
          "rounded-full",
          "flex items-center justify-center",
          "shadow-lg shadow-blue-500/30",
          "border-2 border-white",
        )}
      >
        {badge}
      </span>
    )}
  </button>
);

export default IconButton;
