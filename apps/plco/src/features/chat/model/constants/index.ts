// Re-export shared constants from the entity layer
export {
  ROOM_MESSAGES_TABLE as CHAT_TABLE,
  ROOM_MESSAGES_PAGE_SIZE as CHAT_PAGE_SIZE,
  ROOM_MESSAGE_MAX as CHAT_MESSAGE_MAX,
  ROOM_NICKNAME_MAX as CHAT_NICKNAME_MAX,
  ROOM_SEND_COOLDOWN_MS as CHAT_SEND_COOLDOWN_MS,
  roomMessagesQueryKey as chatQueryKey,
  roomChatChannelName as chatChannelName,
} from '@entities/chat-room/model/constants';

/** 관리자 삭제용 서버 라우트 (service_role 로만 수행). */
export const CHAT_ADMIN_API = '/api/admin/chat';

export const DEFAULT_NICKNAME = '팬';
