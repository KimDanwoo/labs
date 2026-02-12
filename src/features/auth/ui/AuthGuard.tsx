import { useAuth } from "@features/auth/model/hooks/useAuth";
import { GoogleSignInButton } from "@features/auth/ui/GoogleSignInButton";
import { cn } from "@shared/model/utils";
import { SudokuLoader } from "@shared/ui/SudokuLoader";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center min-h-screen",
          "bg-gradient-to-br from-[rgb(var(--color-bg-primary))]",
          "via-[rgb(var(--color-accent-soft))]",
          "to-[rgb(var(--color-accent-light))]",
        )}
      >
        <SudokuLoader size="lg" />
        <p className="mt-4 text-sm text-[rgb(var(--color-text-secondary))] animate-pulse">퍼즐 준비 중</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center min-h-screen",
            "overflow-hidden bg-gradient-to-br",
            "from-[rgb(var(--color-bg-primary))]",
            "via-[rgb(var(--color-accent-soft))]",
            "to-[rgb(var(--color-accent-light))]",
          )}
        >
          {/* Animated background grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgb(var(--color-text-primary)) 1px, transparent 1px),
                  linear-gradient(to bottom, rgb(var(--color-text-primary)) 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Floating numbers background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <div
                key={num}
                className="absolute text-6xl font-bold text-[rgb(var(--color-accent))]/10 select-none"
                style={{
                  left: `${(num * 11) % 90}%`,
                  top: `${(num * 13) % 85}%`,
                  animation: `float ${3 + num * 0.5}s ease-in-out infinite`,
                  animationDelay: `${num * 0.2}s`,
                }}
              >
                {num}
              </div>
            ))}
          </div>

          {/* Main content card */}
          <div className="relative z-10 w-full max-w-md mx-6 sm:mx-8">
            <div
              className={cn(
                "bg-[rgb(var(--color-glass))]/80 backdrop-blur-xl rounded-3xl shadow-2xl",
                "shadow-[rgb(var(--color-accent))]/10",
                "p-8 border border-[rgb(var(--color-surface-primary))]/50",
              )}
            >
              {/* Logo/Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-2xl bg-gradient-to-br",
                      "from-[rgb(var(--color-gradient-from))]",
                      "to-[rgb(var(--color-gradient-to))]",
                      "shadow-lg shadow-[rgb(var(--color-gradient-from))]/30",
                      "flex items-center justify-center",
                    )}
                  >
                    <div className="grid grid-cols-3 gap-0.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <div
                          key={n}
                          className={cn(
                            "w-4 h-4 bg-white/90 rounded-[2px]",
                            "flex items-center justify-center",
                            "text-[8px] font-bold text-[rgb(var(--color-accent))]",
                          )}
                        >
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute -inset-2 bg-[rgb(var(--color-accent))]/20 rounded-3xl blur-xl -z-10" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1
                  className={cn(
                    "text-3xl font-bold bg-gradient-to-r",
                    "from-[rgb(var(--color-text-primary))]",
                    "to-[rgb(var(--color-text-secondary))]",
                    "bg-clip-text text-transparent mb-2",
                  )}
                >
                  어썸 스도쿠
                </h1>
                <p className="text-[rgb(var(--color-text-secondary))]">
                  두뇌를 깨우는 클래식 퍼즐 게임
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: "9+", label: "다양한 난이도" },
                  { icon: "K", label: "킬러 모드" },
                  { icon: "N", label: "메모 기능" },
                ].map(({ icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center p-3 rounded-xl bg-[rgb(var(--color-bg-tertiary))]/80"
                  >
                    <span className="text-lg font-bold text-[rgb(var(--color-accent))]">{icon}</span>
                    <span className="text-[10px] text-[rgb(var(--color-text-secondary))] mt-1">{label}</span>
                  </div>
                ))}
              </div>

              {/* Sign in button */}
              <GoogleSignInButton />

              {/* Footer text */}
              <p className="text-center text-xs text-[rgb(var(--color-text-tertiary))] mt-6">
                로그인하여 기록을 저장하고 랭킹에 도전하세요
              </p>
            </div>
          </div>

        </div>
      )
    );
  }

  return <>{children}</>;
}
