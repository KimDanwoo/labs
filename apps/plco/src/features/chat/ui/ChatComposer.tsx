'use client';

import { useRef, useState, type FormEvent } from 'react';
import { CHAT_MESSAGE_MAX, CHAT_SEND_COOLDOWN_MS } from '../model/constants';
import { useSendChat } from '../model/hooks';

type ChatComposerProps = {
  roomId: string;
  userId: string;
  nickname: string;
};

export default function ChatComposer({
  roomId,
  userId,
  nickname,
}: ChatComposerProps) {
  const [value, setValue] = useState('');
  const lastSentAtRef = useRef(0);
  const { mutate, isPending } = useSendChat(roomId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const message = value.trim();
    if (!message || isPending) return;

    const now = Date.now();
    if (now - lastSentAtRef.current < CHAT_SEND_COOLDOWN_MS) return;
    lastSentAtRef.current = now;

    mutate(
      { userId, nickname, message: message.slice(0, CHAT_MESSAGE_MAX) },
      { onSuccess: () => setValue('') },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={CHAT_MESSAGE_MAX}
        placeholder="톡 남기기…"
        className="min-w-0 flex-1 rounded-full bg-input-bg px-4 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
      />
      <button
        type="submit"
        disabled={!value.trim() || isPending}
        className="shrink-0 rounded-full bg-gold px-4 py-2 text-sm font-bold text-white btn-press shadow-game-sm disabled:opacity-40"
      >
        전송
      </button>
    </form>
  );
}
