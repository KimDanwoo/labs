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
        "bg-white border-2 border-slate-200",
        "shadow-lg shadow-slate-200/50",
        "hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/50",
        "active:scale-[0.98]",
        "transition-all duration-200 ease-out",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200",
      )}
    >
      {/* Hover gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        )}
      />

      <div className="relative flex items-center gap-3">
        <div className="w-6 h-6 flex items-center justify-center">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <FcGoogle className="text-2xl" />
          )}
        </div>
        <span className="font-semibold text-slate-700 group-hover:text-slate-800 transition-colors">
          {isLoading ? "로그인 중..." : "Google로 계속하기"}
        </span>
      </div>
    </button>
  );
}
