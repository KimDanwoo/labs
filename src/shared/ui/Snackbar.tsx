"use client";

import { cn } from "@shared/model/utils";
import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type SnackbarVariant = "success" | "error" | "info";

interface SnackbarProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  variant?: SnackbarVariant;
  duration?: number;
}

const variantStyles: Record<SnackbarVariant, string> = {
  success: cn(
    "bg-[rgb(var(--color-success-bg))]",
    "text-[rgb(var(--color-success-text))]",
  ),
  error: cn(
    "bg-[rgb(var(--color-error-bg))]",
    "text-[rgb(var(--color-error-text))]",
  ),
  info: cn(
    "bg-[rgb(var(--color-surface-elevated))]",
    "text-[rgb(var(--color-text-primary))]",
  ),
};

export const Snackbar = memo<SnackbarProps>(
  ({
    message,
    isVisible,
    onClose,
    variant = "info",
    duration = 3000,
  }) => {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
      if (!isVisible) {
        setIsLeaving(false);
        return;
      }

      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onClose, 200);
      }, duration);

      return () => clearTimeout(timer);
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return createPortal(
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2",
          "z-[60]",
          isLeaving
            ? "animate-snackbar-out"
            : "animate-snackbar-in",
        )}
      >
        <div
          className={cn(
            "px-4 py-3 rounded-2xl shadow-lg",
            "text-sm font-medium",
            "min-w-[200px] max-w-[90vw] text-center",
            variantStyles[variant],
          )}
        >
          {message}
        </div>
      </div>,
      document.body,
    );
  },
);

Snackbar.displayName = "Snackbar";
