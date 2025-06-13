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
        "flex items-center justify-center gap-3",
        "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg",
        "hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm",
      )}
    >
      <FcGoogle className="text-xl" />
      <span className="font-medium text-gray-700">{isLoading ? "로그인 중..." : "구글로 로그인"}</span>
    </button>
  );
}
