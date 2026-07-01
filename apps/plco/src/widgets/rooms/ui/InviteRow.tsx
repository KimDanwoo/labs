'use client';

import { ROOM_NICKNAME_MAX } from '@entities/chat-room/model/constants';
import { useRespondInvite } from '@entities/chat-room/model/hooks';
import type { Invite } from '@entities/chat-room/model/types';

type InviteRowProps = {
  invite: Invite;
  defaultNickname: string;
  onAccepted: (roomId: string) => void;
};

export default function InviteRow({
  invite,
  defaultNickname,
  onAccepted,
}: InviteRowProps) {
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
    <li className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 shadow-game-sm">
      <p className="min-w-0 flex-1 truncate text-sm text-gray-700">
        채팅방 초대가 왔어요
      </p>
      <div className="ml-2 flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={handleDecline}
          disabled={decline.isPending}
          className="rounded-full border border-card-border px-3 py-1 text-xs font-bold text-gray-500 btn-press disabled:opacity-40"
        >
          거절
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={accept.isPending}
          className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-white btn-press shadow-game-sm disabled:opacity-40"
        >
          수락
        </button>
      </div>
    </li>
  );
}
