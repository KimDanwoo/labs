'use client';

import { useState } from 'react';
import { ROOM_PASSWORD_MAX } from '@entities/chat-room/model/constants';
import type { Room } from '@entities/chat-room/model/types';

type PublicRoomsListProps = {
  rooms: Room[];
  isLoading: boolean;
  joiningRoomId: string | null;
  joinError: string | null;
  onJoin: (room: Room, password?: string) => void;
};

export default function PublicRoomsList({
  rooms,
  isLoading,
  joiningRoomId,
  joinError,
  onJoin,
}: PublicRoomsListProps) {
  const [promptRoomId, setPromptRoomId] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-gray-400">
        공개 방을 불러오는 중…
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-6 text-center text-xs text-gray-400">
        <span className="text-2xl">🌐</span>
        <span>아직 공개 방이 없어요</span>
      </div>
    );
  }

  const openPrompt = (roomId: string) => {
    setPromptRoomId(roomId);
    setPassword('');
  };

  return (
    <ul className="flex flex-col gap-1">
      {rooms.map((room) => {
        const isJoining = joiningRoomId === room.id;
        const isPrompting = promptRoomId === room.id;

        return (
          <li key={room.id}>
            <div className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-game-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-base">
                {room.hasPassword ? '🔒' : '🌐'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-700">
                  {room.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  room.hasPassword ? openPrompt(room.id) : onJoin(room)
                }
                disabled={isJoining}
                className="shrink-0 rounded-full bg-gold px-3 py-1 text-xs font-bold text-white btn-press shadow-game-sm disabled:opacity-40"
              >
                {isJoining ? '입장 중…' : '입장'}
              </button>
            </div>

            {room.hasPassword && isPrompting && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = password.trim();
                  if (!trimmed || isJoining) return;
                  onJoin(room, trimmed);
                }}
                className="mt-1 flex flex-col gap-1 rounded-xl bg-input-bg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={ROOM_PASSWORD_MAX}
                    placeholder="비밀번호"
                    autoComplete="off"
                    autoFocus
                    className="min-w-0 flex-1 rounded-lg bg-white px-3 py-1.5 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!password.trim() || isJoining}
                    className="shrink-0 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-white btn-press shadow-game-sm disabled:opacity-40"
                  >
                    확인
                  </button>
                </div>
                {joinError && <p className="text-[10px] text-red">{joinError}</p>}
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
