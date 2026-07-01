// Re-export room-level types for use within the chat feature
export type { RoomChatMessage as ChatMessage, RoomChatMessage } from '@entities/chat-room/model/types';

export type ChatPresenceUser = {
  userId: string;
  nickname: string;
  characterId: string | null;
};

export type SendChatInput = {
  roomId: string;
  userId: string;
  nickname: string;
  message: string;
};
