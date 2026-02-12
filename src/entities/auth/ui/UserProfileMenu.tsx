import { useAuth } from "@features/auth/model/hooks/useAuth";
import { useClickOutside } from "@shared/model/hooks";
import { cn } from "@shared/model/utils";
import Image from "next/image";
import Link from "next/link";
import { memo, useRef } from "react";

export const UserProfileMenu = memo(() => {
  const { user, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const { isOpen, setIsOpen } = useClickOutside(menuRef as React.RefObject<HTMLElement>);

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      {/* Profile Button */}
      <button
        aria-label="프로필 메뉴"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-xl",
          "transition-all duration-150 ease-out",
          "hover:bg-[rgb(var(--color-hover))]",
          "active:scale-95",
        )}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[rgb(var(--color-surface-primary))] shadow-sm">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt="프로필"
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center",
                "bg-[rgb(var(--color-bg-tertiary))]",
                "text-sm font-medium",
                "text-[rgb(var(--color-text-secondary))]",
              )}
            >
              {user.displayName?.charAt(0) || "?"}
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-[rgb(var(--color-text-primary))] hidden sm:inline">
          {user.displayName}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2",
            "min-w-[160px] p-1",
            "bg-[rgb(var(--color-surface-primary))] rounded-xl",
            "shadow-[0_4px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
            "border border-[rgb(var(--color-border-light))]",
            "z-50",
          )}
        >
          {/* User Info */}
          <div className="px-3 py-2 border-b border-[rgb(var(--color-border-light))]">
            <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
              {user.displayName}
            </p>
            <p className="text-xs text-[rgb(var(--color-text-tertiary))] truncate">
              {user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/leaderboard"
              onClick={() => setIsOpen(false)}
              className={cn(
                "block w-full px-3 py-2 text-left",
                "text-sm text-[rgb(var(--color-text-primary))]",
                "rounded-lg",
                "transition-colors duration-150",
                "hover:bg-[rgb(var(--color-hover))]",
              )}
            >
              랭킹
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className={cn(
                "block w-full px-3 py-2 text-left",
                "text-sm text-[rgb(var(--color-text-primary))]",
                "rounded-lg",
                "transition-colors duration-150",
                "hover:bg-[rgb(var(--color-hover))]",
              )}
            >
              프로필
            </Link>
            <button
              onClick={signOut}
              className={cn(
                "w-full px-3 py-2 text-left",
                "text-sm text-[rgb(var(--color-error-text))]",
                "rounded-lg",
                "transition-colors duration-150",
                "hover:bg-[rgb(var(--color-error-text))]/10",
              )}
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UserProfileMenu.displayName = "UserProfileMenu";
