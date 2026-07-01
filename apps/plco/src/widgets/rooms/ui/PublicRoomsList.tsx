'use client';

import type { Room } from '@entities/chat-room/model/types';

type PublicRoomsListProps = {
  rooms: Room[];
  isLoading: boolean;
  joiningRoomId: string | null;
  onJoin: (room: Room) => void;
};

export default function PublicRoomsList({
  rooms,
  isLoading,
  joiningRoomId,
  onJoin,
}: PublicRoomsListProps) {
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

  return (
    <ul className="flex flex-col gap-1">
      {rooms.map((room) => (
        <li key={room.id}>
          <div className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-game-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-base">
              🌐
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-700">
                {room.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onJoin(room)}
              disabled={joiningRoomId === room.id}
              className="shrink-0 rounded-full bg-gold px-3 py-1 text-xs font-bold text-white btn-press shadow-game-sm disabled:opacity-40"
            >
              {joiningRoomId === room.id ? '입장 중…' : '입장'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
