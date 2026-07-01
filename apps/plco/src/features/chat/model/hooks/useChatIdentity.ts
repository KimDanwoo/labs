'use client';

import { useAuth } from '@entities/auth/model/hooks';
import { CHAT_NICKNAME_MAX, DEFAULT_NICKNAME } from '../constants';

function resolveNickname(metadata: Record<string, unknown> | undefined): string {
  const raw =
    (metadata?.full_name as string | undefined) ??
    (metadata?.name as string | undefined) ??
    DEFAULT_NICKNAME;
  const trimmed = raw.trim() || DEFAULT_NICKNAME;
  return trimmed.slice(0, CHAT_NICKNAME_MAX);
}

/** 채팅 작성 가능 여부와 표시 닉네임을 제공한다. 구글 연동(비익명) 유저만 작성 가능. */
export function useChatIdentity() {
  const { user, isLoading, isAnonymous, linkWithGoogle } = useAuth();

  const canChat = !!user && !isAnonymous;
  const nickname = resolveNickname(user?.user_metadata);

  return {
    userId: user?.id ?? null,
    nickname,
    canChat,
    isLoading,
    linkWithGoogle,
  };
}
