'use client';

import type { Room } from '@entities/chat-room/model/types';
import { Badge } from '@shared/ui';
import { useState } from 'react';
import RoomListSkeleton from './RoomListSkeleton';

type MyRoomsListProps = {
  rooms: Room[];
  isLoading: boolean;
  currentUserId: string | null;
  deletingRoomId: string | null;
  errorRoomId: string | null;
  errorMessage: string | null;
  onSelectRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onCreate: () => void;
  onBrowsePublic: () => void;
};

export default function MyRoomsList({
  rooms,
  isLoading,
  currentUserId,
  deletingRoomId,
  errorRoomId,
  errorMessage,
  onSelectRoom,
  onDeleteRoom,
  onCreate,
  onBrowsePublic,
}: MyRoomsListProps) {
  const [confirmRoomId, setConfirmRoomId] = useState<string | null>(null);

  if (isLoading) {
    return <RoomListSkeleton />;
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
        <span className="avatar-soft mb-1 flex h-16 w-16 animate-soft-float items-center justify-center rounded-full text-3xl shadow-game-sm">
          🚪
        </span>
        <p className="text-sm font-semibold text-gray-500">아직 참여한 방이 없어요</p>
        <p className="text-xs text-gray-400">공개 방에 입장하거나 새 방을 만들어보세요</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onBrowsePublic}
            className="rounded-full border border-card-border bg-white px-4 py-2 text-xs font-bold text-gray-600 btn-press shadow-game-sm"
          >
            공개 방 둘러보기
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="btn-gold rounded-full px-4 py-2 text-xs font-bold btn-press"
          >
            + 새 방 만들기
          </button>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {rooms.map((room, index) => {
        const isOwner = room.ownerId === currentUserId;
        const isConfirming = confirmRoomId === room.id;
        const isDeleting = deletingRoomId === room.id;
        const hasError = errorRoomId === room.id;

        return (
          <li key={room.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
            <div className="group flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-game-sm transition-all hover:-translate-y-0.5 hover:shadow-game-md">
              <button
                type="button"
                onClick={() => onSelectRoom(room)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.98]"
              >
                <span className="avatar-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg">
                  {room.isPublic ? '🌐' : '🔒'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800">{room.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge>{room.isPublic ? '공개' : '비공개'}</Badge>
                    {room.hasPassword && <Badge>🔒 잠김</Badge>}
                    {isOwner && <Badge tone="gold">내가 만든 방</Badge>}
                  </div>
                </div>
              </button>

              {isOwner && isConfirming && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteRoom(room);
                      setConfirmRoomId(null);
                    }}
                    disabled={isDeleting}
                    className="rounded-full bg-red px-3 py-1.5 text-xs font-bold text-white btn-press disabled:opacity-40"
                  >
                    {isDeleting ? '삭제 중…' : '삭제'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRoomId(null)}
                    disabled={isDeleting}
                    className="rounded-full border border-card-border px-3 py-1.5 text-xs font-bold text-gray-500 btn-press disabled:opacity-40"
                  >
                    취소
                  </button>
                </div>
              )}

              {isOwner && !isConfirming && (
                <button
                  type="button"
                  onClick={() => setConfirmRoomId(room.id)}
                  disabled={isDeleting}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base text-gray-300 transition-colors hover:bg-red/10 hover:text-red disabled:opacity-40"
                  aria-label="방 삭제"
                >
                  🗑
                </button>
              )}

              {!isOwner && (
                <span className="shrink-0 pr-1 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gold">
                  ›
                </span>
              )}
            </div>
            {hasError && errorMessage && (
              <p role="alert" className="px-3 pt-1 text-[11px] text-red">
                {errorMessage}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
