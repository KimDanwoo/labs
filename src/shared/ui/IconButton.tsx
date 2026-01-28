import { cn } from "@shared/model/utils";

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "primary" | "subtle";
}

export const IconButton = ({
  icon,
  onClick,
  label,
  className,
  disabled,
  variant = "default",
}: IconButtonProps) => (
  <button
    className={cn(
      // Layout
      "flex flex-col items-center justify-center gap-1",
      // Sizing
      "min-w-16 p-3",
      // Shape
      "rounded-2xl",
      // Typography
      "text-xs font-medium",
      // Transitions
      "transition-all duration-150 ease-out",
      // Disabled state
      disabled && "opacity-40 cursor-not-allowed",
      // Variants
      variant === "default" && [
        "bg-[rgb(245,245,247)]",
        "text-[rgb(99,99,102)]",
        !disabled && "hover:bg-[rgb(235,235,240)]",
        !disabled && "active:scale-95",
      ],
      variant === "primary" && [
        "bg-[rgb(0,122,255)]",
        "text-white",
        !disabled && "hover:bg-[rgb(0,110,230)]",
        !disabled && "active:scale-95",
      ],
      variant === "subtle" && [
        "bg-transparent",
        "text-[rgb(99,99,102)]",
        !disabled && "hover:bg-[rgb(245,245,247)]",
        !disabled && "active:scale-95",
      ],
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(0,122,255)]/30",
      className,
    )}
    onClick={onClick}
    disabled={disabled}
  >
    <span className="text-lg">{icon}</span>
    {label && <span>{label}</span>}
  </button>
);

export default IconButton;
