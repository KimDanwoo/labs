'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../model/types';
import ChatMessageItem from './ChatMessageItem';

type ChatMessageListProps = {
  messages: ChatMessage[] | undefined;
  isLoading: boolean;
  isError: boolean;
  currentUserId: string | null;
  canModerate: boolean;
  onDelete: (id: string) => void;
};

export default function ChatMessageList({
  messages,
  isLoading,
  isError,
  currentUserId,
  canModerate,
  onDelete,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const count = messages?.length ?? 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [count]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-gray-400">
        톡을 불러오는 중…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-red">
        톡을 불러오지 못했어요.
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-xs text-gray-400">
        <span className="text-2xl">💬</span>
        <span>아직 톡이 없어요. 첫 톡을 남겨보세요!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
      {messages?.map((m) => (
        <ChatMessageItem
          key={m.id}
          nickname={m.nickname}
          message={m.message}
          createdAt={m.createdAt}
          isOwn={m.userId === currentUserId}
          onDelete={canModerate ? () => onDelete(m.id) : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
