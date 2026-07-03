'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAtomValue, useSetAtom } from 'jotai';
import { characterIdAtom } from '@entities/game/model/store';
import { activeRoomAtom } from '@entities/chat-room/model/store';
import type { Room } from '@entities/chat-room/model/types';
import {
  useChatIdentity,
  useChatRoom,
  useDeleteChat,
} from '@features/chat/model/hooks';
import ChatComposer from '@features/chat/ui/ChatComposer';
import ChatLoginGate from '@features/chat/ui/ChatLoginGate';
import ChatMessageList from '@features/chat/ui/ChatMessageList';
import type { CharacterId } from '@shared/types';
import { ALL_CHARACTER_IDS } from '@shared/constants';
import { ROOM_BACKGROUNDS } from '../constants';
import SceneCharacter from './SceneCharacter';

const SHARED_ROOM_BACKGROUND = ROOM_BACKGROUNDS.outdoor;

// 결정적 위치 프리셋: userId 정렬 후 인덱스 기반 매핑
const POSITION_PRESETS: Array<{ x: number; y: number }> = [
  { x: 25, y: 65 },
  { x: 55, y: 55 },
  { x: 75, y: 70 },
  { x: 40, y: 75 },
  { x: 15, y: 55 },
  { x: 65, y: 45 },
  { x: 85, y: 55 },
  { x: 30, y: 45 },
];

const MAX_VISIBLE_USERS = POSITION_PRESETS.length;

const DEFAULT_CHARACTER_ID: CharacterId = 'yeko';

function toCharacterId(raw: string | null | undefined): CharacterId {
  if (raw && (ALL_CHARACTER_IDS as string[]).includes(raw)) {
    return raw as CharacterId;
  }
  return DEFAULT_CHARACTER_ID;
}

type SharedRoomSceneProps = {
  room: Room;
};

export default function SharedRoomScene({ room }: SharedRoomSceneProps) {
  const setActiveRoom = useSetAtom(activeRoomAtom);
  const myCharacterId = useAtomValue(characterIdAtom);
  const { userId, nickname, canChat, linkWithGoogle } = useChatIdentity();

  const { messages, isLoading, isError, onlineUsers } = useChatRoom(room.id, {
    userId,
    nickname,
    characterId: myCharacterId,
  });
  const { mutate: deleteMessage } = useDeleteChat(room.id);

  // presence 유저를 userId 정렬해 결정적 위치 배정
  const sortedUsers = [...onlineUsers].sort((a, b) =>
    a.userId.localeCompare(b.userId),
  );
  const visibleUsers = sortedUsers.slice(0, MAX_VISIBLE_USERS);
  const extraCount = Math.max(0, sortedUsers.length - MAX_VISIBLE_USERS);

  // 입장 시 로드된 과거 메시지는 말풍선으로 띄우지 않는다.
  // 첫 로드 메시지 id를 기록해두고, 이후 실시간으로 들어온(=새로 입력된) 것만 말풍선 표시.
  const [initialIds, setInitialIds] = useState<Set<string> | null>(null);
  if (initialIds === null && messages) {
    setInitialIds(new Set(messages.map((m) => m.id)));
  }

  // 유저별 최신 "신규" 메시지 (히스토리 제외 — initialIds 확정 전엔 전부 히스토리 취급)
  const latestMessageByUser = new Map<string, string>();
  (messages ?? []).forEach((m) => {
    if (!initialIds || initialIds.has(m.id)) return;
    latestMessageByUser.set(m.userId, m.message);
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl shadow-game-lg sm:rounded-3xl">
      {/* 상단: 씬 사진 (절반 고정) */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ height: '40dvh' }}
      >
        <Image
          src={SHARED_ROOM_BACKGROUND}
          alt="공유 방 배경"
          fill
          className="object-cover"
          priority
          unoptimized
        />

        {/* 나가기 버튼 */}
        <button
          type="button"
          onClick={() => setActiveRoom(null)}
          className="absolute right-2 top-2 z-30 rounded-full border border-card-border bg-white/80 px-3 py-1 text-xs font-bold text-gray-600 shadow-game-sm btn-press"
        >
          나가기
        </button>

        {/* 방 이름 */}
        <div className="absolute left-2 top-2 z-30 max-w-[60%] rounded-full border border-card-border bg-white/80 px-3 py-1 shadow-game-sm">
          <p className="truncate text-[11px] font-bold text-gray-700">
            {room.name}
          </p>
        </div>

        {/* 캐릭터들 */}
        {visibleUsers.map((user, idx) => {
          const preset = POSITION_PRESETS[idx];
          if (!preset) return null;
          return (
            <SceneCharacter
              key={user.userId}
              characterId={toCharacterId(user.characterId)}
              nickname={user.nickname}
              x={preset.x}
              y={preset.y}
              latestMessage={latestMessageByUser.get(user.userId) ?? null}
              isMe={user.userId === userId}
            />
          );
        })}

        {/* 초과 인원 표시 */}
        {extraCount > 0 && (
          <div className="absolute bottom-2 right-2 z-30 rounded-full border border-card-border bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
            +{extraCount}명 더
          </div>
        )}
      </div>

      {/* 하단: 채팅 영역 (사진과 반반 고정, 히스토리는 내부 스크롤) */}
      <div
        className="flex shrink-0 flex-col border-t border-card-border bg-card-bg"
        style={{ height: '40dvh' }}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            isError={isError}
            currentUserId={userId}
            canModerate={false}
            onDelete={deleteMessage}
          />
        </div>
        <div className="shrink-0 border-t border-card-border px-3 py-2">
          {canChat && userId ? (
            <ChatComposer
              roomId={room.id}
              userId={userId}
              nickname={nickname}
            />
          ) : (
            <ChatLoginGate onLogin={linkWithGoogle} />
          )}
        </div>
      </div>
    </div>
  );
}
