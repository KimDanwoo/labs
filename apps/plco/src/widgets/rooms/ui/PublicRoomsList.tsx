'use client';

import { ROOM_PASSWORD_MAX } from '@entities/chat-room/model/constants';
import type { Room } from '@entities/chat-room/model/types';
import { useState } from 'react';
import RoomListSkeleton from './RoomListSkeleton';

type PublicRoomsListProps = {
  rooms: Room[];
  isLoading: boolean;
  joiningRoomId: string | null;
  joinError: string | null;
  onJoin: (room: Room, password?: string) => void;
  onCreate: () => void;
};

export default function PublicRoomsList({
  rooms,
  isLoading,
  joiningRoomId,
  joinError,
  onJoin,
  onCreate,
}: PublicRoomsListProps) {
  const [promptRoomId, setPromptRoomId] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  if (isLoading) {
    return <RoomListSkeleton />;
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
        <span className="avatar-soft mb-1 flex h-16 w-16 animate-soft-float items-center justify-center rounded-full text-3xl shadow-game-sm">
          🌐
        </span>
        <p className="text-sm font-semibold text-gray-500">아직 공개 방이 없어요</p>
        <p className="text-xs text-gray-400">첫 번째 공개 방을 만들어보세요</p>
        <button
          type="button"
          onClick={onCreate}
          className="btn-gold mt-2 rounded-full px-4 py-2 text-xs font-bold btn-press"
        >
          + 새 방 만들기
        </button>
      </div>
    );
  }

  const openPrompt = (roomId: string) => {
    setPromptRoomId(roomId);
    setPassword('');
  };

  return (
    <ul className="flex flex-col gap-1.5">
      {rooms.map((room, index) => {
        const isJoining = joiningRoomId === room.id;
        const isPrompting = promptRoomId === room.id;

        return (
          <li key={room.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
            <div className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-game-sm transition-all hover:-translate-y-0.5 hover:shadow-game-md">
              <span className="avatar-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg">
                {room.hasPassword ? '🔒' : '🌐'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-800">{room.name}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {room.hasPassword ? '비밀번호가 필요한 방' : '누구나 입장할 수 있어요'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => (room.hasPassword ? openPrompt(room.id) : onJoin(room))}
                disabled={isJoining}
                className="btn-gold shrink-0 rounded-full px-4 py-1.5 text-xs font-bold btn-press disabled:opacity-40"
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
                className="mt-1.5 flex flex-col gap-1.5 rounded-2xl bg-input-bg px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={ROOM_PASSWORD_MAX}
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="off"
                    autoFocus
                    className="min-w-0 flex-1 rounded-xl border border-black/5 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-gold/40"
                  />
                  <button
                    type="submit"
                    disabled={!password.trim() || isJoining}
                    className="btn-gold shrink-0 rounded-full px-4 py-2 text-xs font-bold btn-press disabled:opacity-40"
                  >
                    확인
                  </button>
                </div>
                {joinError && (
                  <p role="alert" className="px-1 text-[11px] text-red">
                    {joinError}
                  </p>
                )}
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
