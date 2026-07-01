'use client';

import { useState } from 'react';
import { formatChatTime } from '@shared/lib';

type ChatMessageItemProps = {
  nickname: string;
  message: string;
  createdAt: string;
  isOwn: boolean;
  onDelete?: () => void;
};

export default function ChatMessageItem({
  nickname,
  message,
  createdAt,
  isOwn,
  onDelete,
}: ChatMessageItemProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      {!isOwn && (
        <span className="px-1 text-[11px] text-gray-400">{nickname}</span>
      )}
      <div
        className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <p
          className={`max-w-[75%] whitespace-pre-wrap wrap-break-word rounded-2xl px-3 py-2 text-base shadow-game-sm ${
            isOwn
              ? 'rounded-br-sm bg-gold text-white'
              : 'rounded-bl-sm bg-white text-gray-700'
          }`}
        >
          {message}
        </p>
        <span className="shrink-0 text-[10px] text-gray-300">
          {formatChatTime(createdAt)}
        </span>
        {onDelete &&
          (confirming ? (
            <span className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={onDelete}
                className="text-[11px] font-bold text-red"
              >
                삭제
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-[11px] text-gray-400"
              >
                취소
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="shrink-0 text-[11px] text-gray-300 hover:text-red"
              aria-label="메시지 삭제"
            >
              🗑
            </button>
          ))}
      </div>
    </div>
  );
}
