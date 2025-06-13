import { useAuth } from "@features/auth/model/hooks/useAuth";
import { GoogleSignInButton } from "@features/auth/ui/GoogleSignInButton";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">스도쿠 게임</h2>
            <p className="text-gray-600 mb-6">로그인하여 게임을 시작하세요!</p>
          </div>
          <div className="w-full max-w-sm">
            <GoogleSignInButton />
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
