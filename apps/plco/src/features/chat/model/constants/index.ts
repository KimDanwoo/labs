import type { CharacterId } from '@shared/types';

export const CHAT_TABLE = 'chat_messages';

/** 관리자 삭제용 서버 라우트 (service_role 로만 수행). */
export const CHAT_ADMIN_API = '/api/admin/chat';

export const CHAT_MESSAGE_MAX = 200;
export const CHAT_NICKNAME_MAX = 40;
export const CHAT_PAGE_SIZE = 50;
export const CHAT_SEND_COOLDOWN_MS = 1500;

export const DEFAULT_NICKNAME = '팬';

export const chatQueryKey = (characterId: CharacterId) =>
  ['chat', characterId] as const;

export const chatChannelName = (characterId: CharacterId) =>
  `chat:${characterId}`;
