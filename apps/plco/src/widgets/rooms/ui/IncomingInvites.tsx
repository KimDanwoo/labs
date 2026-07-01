'use client';

import type { Invite } from '@entities/chat-room/model/types';
import InviteRow from './InviteRow';

type IncomingInvitesProps = {
  invites: Invite[];
  defaultNickname: string;
  onAccepted: (roomId: string) => void;
};

export default function IncomingInvites({
  invites,
  defaultNickname,
  onAccepted,
}: IncomingInvitesProps) {
  if (invites.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500">받은 초대</p>
      <ul className="flex flex-col gap-1.5">
        {invites.map((invite) => (
          <InviteRow
            key={invite.id}
            invite={invite}
            defaultNickname={defaultNickname}
            onAccepted={onAccepted}
          />
        ))}
      </ul>
    </div>
  );
}
