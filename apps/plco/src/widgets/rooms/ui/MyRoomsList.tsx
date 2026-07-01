'use client';

import type { Room } from '@entities/chat-room/model/types';

type MyRoomsListProps = {
  rooms: Room[];
  isLoading: boolean;
  onSelectRoom: (room: Room) => void;
};

export default function MyRoomsList({
  rooms,
  isLoading,
  onSelectRoom,
}: MyRoomsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-gray-400">
        방 목록을 불러오는 중…
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-6 text-center text-xs text-gray-400">
        <span className="text-2xl">🚪</span>
        <span>아직 참여한 방이 없어요</span>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {rooms.map((room) => (
        <li key={room.id}>
          <button
            type="button"
            onClick={() => onSelectRoom(room)}
            className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-game-sm hover:bg-gray-50 active:scale-[0.98]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-base">
              💬
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-700">
                {room.name}
              </p>
            </div>
            <span className="shrink-0 text-gray-300">›</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
