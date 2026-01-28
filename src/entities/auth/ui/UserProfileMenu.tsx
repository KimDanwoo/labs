import { useAuth } from "@features/auth/model/hooks/useAuth";
import { useClickOutside } from "@shared/model/hooks";
import { cn } from "@shared/model/utils";
import Image from "next/image";
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
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-xl",
          "transition-all duration-150 ease-out",
          "hover:bg-[rgb(245,245,247)]",
          "active:scale-95",
        )}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
          <Image
            src={user.photoURL || ""}
            alt="Profile"
            width={32}
            height={32}
            className="object-cover"
          />
        </div>
        <span className="text-sm font-medium text-[rgb(28,28,30)] hidden sm:inline">
          {user.displayName}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2",
            "min-w-[160px] p-1",
            "bg-white rounded-xl",
            "shadow-[0_4px_20px_rgba(0,0,0,0.12)]",
            "border border-[rgb(229,229,234)]",
            "z-50",
          )}
        >
          {/* User Info */}
          <div className="px-3 py-2 border-b border-[rgb(229,229,234)]">
            <p className="text-sm font-medium text-[rgb(28,28,30)]">
              {user.displayName}
            </p>
            <p className="text-xs text-[rgb(142,142,147)] truncate">
              {user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={signOut}
              className={cn(
                "w-full px-3 py-2 text-left",
                "text-sm text-[rgb(255,59,48)]",
                "rounded-lg",
                "transition-colors duration-150",
                "hover:bg-[rgb(255,59,48)]/10",
              )}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UserProfileMenu.displayName = "UserProfileMenu";
