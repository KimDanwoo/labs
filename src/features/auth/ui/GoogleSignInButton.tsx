"use client";

import { useAuth } from "@features/auth/model/hooks/useAuth";
import { cn } from "@shared/model/utils";
import { FcGoogle } from "react-icons/fc";

export function GoogleSignInButton() {
  const { signInWithGoogle, isLoading } = useAuth();

  return (
    <button
      onClick={signInWithGoogle}
      disabled={isLoading}
      className={cn(
        "group relative flex items-center justify-center gap-3",
        "w-full px-6 py-4 rounded-2xl",
        "bg-[rgb(var(--color-surface-primary))] border-2 border-[rgb(var(--color-border-light))]",
        "shadow-lg shadow-[rgb(var(--color-border-light))]/50 dark:shadow-black/20",
        "hover:border-[rgb(var(--color-accent))]/60 hover:shadow-xl hover:shadow-[rgb(var(--color-accent))]/10",
        "active:scale-[0.98]",
        "transition-all duration-200 ease-out",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[rgb(var(--color-border-light))]",
      )}
    >
      {/* Hover gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-r",
          "from-blue-50 to-indigo-50",
          "dark:from-blue-950/50 dark:to-indigo-950/50",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        )}
      />

      <div className="relative flex items-center gap-3">
        <div className="w-6 h-6 flex items-center justify-center">
          {isLoading ? (
            <div
              className={cn(
                "w-5 h-5 border-2 rounded-full animate-spin",
                "border-[rgb(var(--color-border-light))]",
                "border-t-[rgb(var(--color-accent))]",
              )}
            />
          ) : (
            <FcGoogle className="text-2xl" />
          )}
        </div>
        <span className="font-semibold text-[rgb(var(--color-text-primary))] transition-colors">
          {isLoading ? "로그인 중..." : "Google로 계속하기"}
        </span>
      </div>
    </button>
  );
}
