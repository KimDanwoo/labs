'use client';

import type { Invite } from '@entities/chat-room/model/types';
import InviteRow from './InviteRow';

type IncomingInvitesProps = {
  invites: Invite[];
  defaultNickname: string;
  onAccepted: (roomId: string) => void;
};

export default function IncomingInvites({ invites, defaultNickname, onAccepted }: IncomingInvitesProps) {
  if (invites.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
        <span className="avatar-soft mb-1 flex h-16 w-16 animate-soft-float items-center justify-center rounded-full text-3xl shadow-game-sm">
          ✉️
        </span>
        <p className="text-sm font-semibold text-gray-500">받은 초대가 없어요</p>
        <p className="text-xs text-gray-400">친구가 방에 초대하면 여기에 표시돼요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs font-semibold text-gray-500">받은 초대</p>
      <ul className="flex flex-col gap-1.5">
        {invites.map((invite) => (
          <InviteRow key={invite.id} invite={invite} defaultNickname={defaultNickname} onAccepted={onAccepted} />
        ))}
      </ul>
    </div>
  );
}
