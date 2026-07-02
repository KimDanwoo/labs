'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { ModalShell } from '@shared/ui';
import { useGameActions } from '@entities/game/model/hooks';
import { activeRoomAtom } from '@entities/chat-room/model/store';
import {
  useJoinRoom,
  useMyInvites,
  useMyRooms,
  usePublicRooms,
} from '@entities/chat-room/model/hooks';
import type { Room } from '@entities/chat-room/model/types';
import { useChatIdentity } from '@features/chat/model/hooks';
import { ChatLoginGate } from '@features/chat/ui';
import CreateRoomDialog from './CreateRoomDialog';
import IncomingInvites from './IncomingInvites';
import MyRoomsList from './MyRoomsList';
import PublicRoomsList from './PublicRoomsList';

const ROOMS_TAB = {
  PUBLIC: 'public',
  MY: 'my',
  INVITES: 'invites',
  CREATE: 'create',
} as const;
type RoomsTab = (typeof ROOMS_TAB)[keyof typeof ROOMS_TAB];

export default function RoomsModal() {
  const { closeModal } = useGameActions();
  const setActiveRoom = useSetAtom(activeRoomAtom);
  const { userId, nickname, canChat, linkWithGoogle } = useChatIdentity();
  const [tab, setTab] = useState<RoomsTab>(ROOMS_TAB.PUBLIC);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const publicRooms = usePublicRooms();
  const myRooms = useMyRooms();
  const myInvites = useMyInvites(userId);
  const { mutateAsync: joinRoom } = useJoinRoom();

  const pendingInviteCount = myInvites.data?.length ?? 0;

  const enterRoom = (room: Room) => {
    setActiveRoom(room);
    closeModal();
  };

  const handleJoinPublic = async (room: Room, password?: string) => {
    if (!userId) return;
    setJoinError(null);
    setJoiningRoomId(room.id);
    try {
      await joinRoom({ roomId: room.id, nickname, password });
      await myRooms.refetch();
      enterRoom(room);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setJoinError(
        message.includes('wrong password')
          ? '비밀번호가 틀렸어요'
          : '입장하지 못했어요. 잠시 후 다시 시도해주세요',
      );
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleSelectMyRoom = (room: Room) => {
    enterRoom(room);
  };

  const handleInviteAccepted = (roomId: string) => {
    myRooms.refetch().then((res) => {
      const room = res.data?.find((r) => r.id === roomId);
      if (room) enterRoom(room);
    });
  };

  const handleRoomCreated = async (roomId: string) => {
    const res = await myRooms.refetch();
    const room = res.data?.find((r) => r.id === roomId);
    if (room) {
      enterRoom(room);
    } else {
      // fallback: 방 정보 직접 구성
      setActiveRoom({
        id: roomId,
        name: '내 방',
        ownerId: userId ?? '',
        isPublic: false,
        hasPassword: false,
        createdAt: new Date().toISOString(),
      });
      closeModal();
    }
  };

  return (
    <ModalShell
      onClose={closeModal}
      maxWidth="max-w-lg"
      className="flex flex-col overflow-hidden p-0"
    >
      {(close) => (
        <div className="flex h-[88vh] max-h-[720px] flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-card-border px-4 py-3">
            <h3 className="text-base font-bold text-gray-700">채팅방</h3>
            <button
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              aria-label="닫기"
            >
              ✕
            </button>
          </header>

          {/* Tab bar */}
          <div className="flex border-b border-card-border">
            <button
              type="button"
              onClick={() => setTab(ROOMS_TAB.PUBLIC)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === ROOMS_TAB.PUBLIC
                  ? 'border-b-2 border-gold text-gold'
                  : 'text-gray-400'
              }`}
            >
              공개 방
            </button>
            <button
              type="button"
              onClick={() => setTab(ROOMS_TAB.MY)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === ROOMS_TAB.MY
                  ? 'border-b-2 border-gold text-gold'
                  : 'text-gray-400'
              }`}
            >
              내 방
            </button>
            <button
              type="button"
              onClick={() => setTab(ROOMS_TAB.INVITES)}
              className={`relative flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === ROOMS_TAB.INVITES
                  ? 'border-b-2 border-gold text-gold'
                  : 'text-gray-400'
              }`}
            >
              초대
              {pendingInviteCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
                  {pendingInviteCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab(ROOMS_TAB.CREATE)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === ROOMS_TAB.CREATE
                  ? 'border-b-2 border-gold text-gold'
                  : 'text-gray-400'
              }`}
            >
              + 만들기
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            {!canChat ? (
              <ChatLoginGate onLogin={linkWithGoogle} />
            ) : (
              <>
                {tab === ROOMS_TAB.PUBLIC && (
                  <PublicRoomsList
                    rooms={publicRooms.data ?? []}
                    isLoading={publicRooms.isLoading}
                    joiningRoomId={joiningRoomId}
                    joinError={joinError}
                    onJoin={handleJoinPublic}
                  />
                )}

                {tab === ROOMS_TAB.MY && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-gray-500">
                      참여 중인 방
                    </p>
                    <MyRoomsList
                      rooms={myRooms.data ?? []}
                      isLoading={myRooms.isLoading}
                      onSelectRoom={handleSelectMyRoom}
                    />
                  </div>
                )}

                {tab === ROOMS_TAB.INVITES && (
                  <IncomingInvites
                    invites={myInvites.data ?? []}
                    defaultNickname={nickname}
                    onAccepted={handleInviteAccepted}
                  />
                )}

                {tab === ROOMS_TAB.CREATE && (
                  <CreateRoomDialog
                    defaultNickname={nickname}
                    onCreated={handleRoomCreated}
                    onCancel={() => setTab(ROOMS_TAB.MY)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
