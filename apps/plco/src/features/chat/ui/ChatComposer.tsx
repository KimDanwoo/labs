'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { CHAT_MESSAGE_MAX, CHAT_SEND_COOLDOWN_MS } from '../model/constants';
import { useSendChat } from '../model/hooks';

type ChatComposerProps = {
  roomId: string;
  userId: string;
  nickname: string;
};

const TEXTAREA_MAX_HEIGHT = 120;
const COUNTER_THRESHOLD = CHAT_MESSAGE_MAX - 40;

export default function ChatComposer({ roomId, userId, nickname }: ChatComposerProps) {
  const [value, setValue] = useState('');
  const lastSentAtRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate, isPending } = useSendChat(roomId);

  // 입력에 따라 높이를 내용에 맞춰 늘리되 최대 높이에서 스크롤로 전환한다.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  }, [value]);

  const submit = () => {
    const message = value.trim();
    if (!message || isPending) return;

    const now = Date.now();
    if (now - lastSentAtRef.current < CHAT_SEND_COOLDOWN_MS) return;
    lastSentAtRef.current = now;

    mutate({ userId, nickname, message: message.slice(0, CHAT_MESSAGE_MAX) }, { onSuccess: () => setValue('') });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 등 IME 조합 중 Enter 는 확정용이므로 전송하지 않는다.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const remaining = CHAT_MESSAGE_MAX - value.length;
  const showCounter = value.length >= COUNTER_THRESHOLD;

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 pt-1">
      <div className="relative min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={CHAT_MESSAGE_MAX}
          rows={1}
          placeholder="톡 남기기… (Shift+Enter 줄바꿈)"
          className="block max-h-30 w-full resize-none rounded-2xl border border-black/5 bg-input-bg px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-gold/40 focus:bg-white"
        />
        {showCounter && (
          <span
            className={`pointer-events-none absolute bottom-2 right-3 text-[10px] font-medium ${
              remaining <= 0 ? 'text-red' : 'text-gray-400'
            }`}
          >
            {remaining}
          </span>
        )}
      </div>
      <button
        type="submit"
        disabled={!value.trim() || isPending}
        className="btn-gold shrink-0 rounded-full px-4 py-2.5 text-sm font-bold btn-press disabled:opacity-40"
      >
        전송
      </button>
    </form>
  );
}
