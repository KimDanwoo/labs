import { useAuth } from "@features/auth/model/hooks/useAuth";
import { useClickOutside } from "@shared/model/hooks";
import Image from "next/image";
import { useRef } from "react";

export function UserProfileMenu() {
  const { user, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const { isOpen, setIsOpen } = useClickOutside(menuRef as React.RefObject<HTMLElement>);

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <div className="flex items-center gap-2" onClick={() => setIsOpen(!isOpen)}>
        <div className="rounded-full overflow-hidden">
          <Image src={user.photoURL || ""} alt="user profile" width={30} height={30} />
        </div>
        <span className="text-sm font-medium">{user.displayName}</span>
      </div>

      {isOpen && (
        <ul className="absolute top-full left-0 w-full bg-white rounded-md shadow-md">
          <li className="p-2">
            <button onClick={signOut}>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
