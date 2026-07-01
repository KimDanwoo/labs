// ── Table names ─────────────────────────────────────────────────
export const ROOM_TABLE = 'chat_rooms';
export const ROOM_MEMBERS_TABLE = 'room_members';
export const ROOM_INVITES_TABLE = 'room_invites';
export const ROOM_MESSAGES_TABLE = 'chat_messages';

// ── RPC names ────────────────────────────────────────────────────
export const RPC_CREATE_ROOM = 'create_room';
export const RPC_ACCEPT_INVITE = 'accept_invite';

// ── Query key factories ──────────────────────────────────────────
export const myRoomsQueryKey = () => ['chat-room', 'my-rooms'] as const;
export const myInvitesQueryKey = () => ['chat-room', 'my-invites'] as const;
export const roomMessagesQueryKey = (roomId: string) =>
  ['chat-room', 'messages', roomId] as const;

// ── Realtime channel names ───────────────────────────────────────
export const invitesChannelName = (userId: string) =>
  `invites:${userId}`;
export const roomChatChannelName = (roomId: string) =>
  `room-chat:${roomId}`;
export const lobbyChannelName = () => 'lobby:presence';

// ── Pagination ───────────────────────────────────────────────────
export const ROOM_MESSAGES_PAGE_SIZE = 50;
export const ROOM_NAME_MAX = 40;
export const ROOM_NICKNAME_MAX = 40;
export const ROOM_MESSAGE_MAX = 200;
export const ROOM_SEND_COOLDOWN_MS = 1500;
