import type { CharacterId } from '@shared/types';

export type ChatMessage = {
  id: string;
  characterId: CharacterId;
  userId: string;
  nickname: string;
  message: string;
  createdAt: string;
};

export type ChatMessageRow = {
  id: string;
  character_id: string;
  user_id: string;
  nickname: string;
  message: string;
  created_at: string;
};

export type SendChatInput = {
  characterId: CharacterId;
  userId: string;
  nickname: string;
  message: string;
};

export type ChatPresenceUser = {
  userId: string;
  nickname: string;
};
