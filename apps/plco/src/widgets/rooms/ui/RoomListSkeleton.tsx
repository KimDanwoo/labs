'use client';

import { Skeleton } from '@shared/ui';

type RoomListSkeletonProps = {
  rows?: number;
};

export default function RoomListSkeleton({ rows = 4 }: RoomListSkeletonProps) {
  return (
    <div role="status">
      <span className="sr-only">방 목록을 불러오는 중</span>
      <ul className="flex flex-col gap-1.5" aria-hidden>
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-game-sm">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-1/2 rounded-full" />
              <Skeleton className="h-2.5 w-1/4 rounded-full" />
            </div>
            <Skeleton className="h-7 w-14 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
