'use client';

import { useState } from 'react';
import { GoogleIcon } from '@shared/ui';

type ChatLoginGateProps = {
  onLogin: () => Promise<void>;
};

export default function ChatLoginGate({ onLogin }: ChatLoginGateProps) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await onLogin();
    } catch {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      <p className="text-[11px] text-gray-400">
        구글 로그인하면 톡을 남길 수 있어요
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-full border border-card-border bg-white px-4 py-2 text-sm font-bold text-gray-700 btn-press shadow-game-sm disabled:opacity-40"
      >
        <GoogleIcon />
        구글로 로그인
      </button>
    </div>
  );
}
