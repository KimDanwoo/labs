'use client';

import type { LobbyUser } from '../model/types';

type OnlineUsersPickerProps = {
  users: LobbyUser[];
  currentUserId: string;
  onInvite: (userId: string) => void;
  invitingUserId: string | null;
};

export default function OnlineUsersPicker({
  users,
  currentUserId,
  onInvite,
  invitingUserId,
}: OnlineUsersPickerProps) {
  const others = users.filter((u) => u.userId !== currentUserId);

  if (others.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-6 text-center text-xs text-gray-400">
        <span className="text-2xl">👋</span>
        <span>지금 접속 중인 다른 유저가 없어요</span>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {others.map((user) => (
        <li
          key={user.userId}
          className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 shadow-game-sm"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-gray-700">
              {user.nickname}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onInvite(user.userId)}
            disabled={invitingUserId === user.userId}
            className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-white btn-press shadow-game-sm disabled:opacity-40"
          >
            {invitingUserId === user.userId ? '초대 중…' : '초대'}
          </button>
        </li>
      ))}
    </ul>
  );
}
