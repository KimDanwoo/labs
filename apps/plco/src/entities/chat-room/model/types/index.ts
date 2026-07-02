export const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
} as const;
export type InviteStatus = (typeof INVITE_STATUS)[keyof typeof INVITE_STATUS];

// ── DB row shapes ───────────────────────────────────────────────
export type ChatRoomRow = {
  id: string;
  name: string;
  owner_id: string;
  is_public: boolean;
  has_password: boolean;
  created_at: string;
};

export type RoomMemberRow = {
  room_id: string;
  user_id: string;
  nickname: string;
  joined_at: string;
};

export type RoomInviteRow = {
  id: string;
  room_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InviteStatus;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  message: string;
  created_at: string;
};

// ── Domain shapes ───────────────────────────────────────────────
export type Room = {
  id: string;
  name: string;
  ownerId: string;
  isPublic: boolean;
  hasPassword: boolean;
  createdAt: string;
};

export type RoomMember = {
  roomId: string;
  userId: string;
  nickname: string;
  joinedAt: string;
};

export type Invite = {
  id: string;
  roomId: string;
  inviterId: string;
  inviteeId: string;
  status: InviteStatus;
  createdAt: string;
};

export type RoomChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  nickname: string;
  message: string;
  createdAt: string;
};
