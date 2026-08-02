'use client';

import type { ChatPresenceUser } from '../model/types';

type ChatOnlineBarProps = {
  users: ChatPresenceUser[];
};

const MAX_VISIBLE = 3;

export default function ChatOnlineBar({ users }: ChatOnlineBarProps) {
  const count = users.length;
  const names = users.slice(0, MAX_VISIBLE).map((u) => u.nickname);
  const extra = count - names.length;

  return (
    <div aria-live="polite" className="flex items-center gap-1.5 text-[11px] text-gray-400">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
      <span className="font-medium text-emerald-500">{count}명 접속 중</span>
      {names.length > 0 && (
        <span className="truncate">
          · {names.join(', ')}
          {extra > 0 && ` 외 ${extra}명`}
        </span>
      )}
    </div>
  );
}
