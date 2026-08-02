'use client';

import { ROOM_NICKNAME_MAX } from '@entities/chat-room/model/constants';
import { useRespondInvite } from '@entities/chat-room/model/hooks';
import type { Invite } from '@entities/chat-room/model/types';

type InviteRowProps = {
  invite: Invite;
  defaultNickname: string;
  onAccepted: (roomId: string) => void;
};

export default function InviteRow({ invite, defaultNickname, onAccepted }: InviteRowProps) {
  const { accept, decline } = useRespondInvite();

  const handleAccept = () => {
    accept.mutate(
      {
        inviteId: invite.id,
        nickname: defaultNickname.slice(0, ROOM_NICKNAME_MAX),
      },
      { onSuccess: (roomId) => onAccepted(roomId) },
    );
  };

  const handleDecline = () => {
    decline.mutate({ inviteId: invite.id });
  };

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-game-sm">
      <span className="avatar-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg">✉️</span>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700">채팅방 초대가 왔어요</p>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={handleDecline}
          disabled={decline.isPending}
          className="rounded-full border border-card-border px-3 py-1.5 text-xs font-bold text-gray-500 btn-press disabled:opacity-40"
        >
          거절
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={accept.isPending}
          className="btn-gold rounded-full px-3 py-1.5 text-xs font-bold btn-press disabled:opacity-40"
        >
          수락
        </button>
      </div>
    </li>
  );
}
