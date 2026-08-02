'use client';

import { formatChatDateLabel, formatDateKey } from '@shared/lib';
import { Skeleton } from '@shared/ui';
import { Fragment, useEffect, useRef } from 'react';
import type { ChatMessage } from '../model/types';
import ChatDateSeparator from './ChatDateSeparator';
import ChatMessageItem from './ChatMessageItem';

// 같은 사람이 이 시간 안에 연달아 보내면 닉네임을 반복하지 않고 묶는다.
const GROUP_WINDOW_MS = 3 * 60 * 1000;

const SKELETON_ROWS = [
  { own: false, w: 'w-40' },
  { own: true, w: 'w-28' },
  { own: false, w: 'w-52' },
  { own: true, w: 'w-36' },
] as const;

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
      <div role="status" className="flex flex-1 flex-col gap-3 bg-background/40 px-4 py-3">
        <span className="sr-only">톡을 불러오는 중</span>
        {SKELETON_ROWS.map((row, i) => (
          <div key={i} className={`flex ${row.own ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className={`h-9 ${row.w} rounded-2xl`} />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background/40 text-xs text-red">
        톡을 불러오지 못했어요.
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-background/40 text-center">
        <span className="avatar-soft mb-1 flex h-16 w-16 animate-soft-float items-center justify-center rounded-full text-3xl shadow-game-sm">
          💬
        </span>
        <p className="text-sm font-semibold text-gray-500">아직 톡이 없어요</p>
        <p className="text-xs text-gray-400">첫 톡을 남겨보세요!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-background/40 px-4 py-3">
      {messages?.map((m, i) => {
        const prev = i > 0 ? messages[i - 1] : undefined;
        const showDate = !prev || formatDateKey(new Date(prev.createdAt)) !== formatDateKey(new Date(m.createdAt));
        const grouped =
          !!prev &&
          !showDate &&
          prev.userId === m.userId &&
          new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;

        return (
          <Fragment key={m.id}>
            {showDate && <ChatDateSeparator label={formatChatDateLabel(m.createdAt)} />}
            <ChatMessageItem
              nickname={m.nickname}
              message={m.message}
              createdAt={m.createdAt}
              isOwn={m.userId === currentUserId}
              grouped={grouped}
              onDelete={canModerate ? () => onDelete(m.id) : undefined}
            />
          </Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
