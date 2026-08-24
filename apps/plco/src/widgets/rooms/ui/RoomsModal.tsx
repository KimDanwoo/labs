'use client';

import { useDeleteRoom, useJoinRoom, useMyInvites, useMyRooms, usePublicRooms } from '@entities/chat-room/model/hooks';
import { activeRoomAtom } from '@entities/chat-room/model/store';
import type { Room } from '@entities/chat-room/model/types';
import { useGameActions } from '@entities/game/model/hooks';
import { useChatIdentity } from '@features/chat/model/hooks';
import { ChatLoginGate } from '@features/chat/ui';
import { ModalShell } from '@shared/ui';
import { useAtom } from 'jotai';
import { useState } from 'react';
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

const ROOMS_TABS = [
  { key: ROOMS_TAB.PUBLIC, label: '공개 방', accent: false },
  { key: ROOMS_TAB.MY, label: '내 방', accent: false },
  { key: ROOMS_TAB.INVITES, label: '초대', accent: false },
  { key: ROOMS_TAB.CREATE, label: '+ 만들기', accent: true },
] as const;

export default function RoomsModal() {
  const { closeModal } = useGameActions();
  const [activeRoom, setActiveRoom] = useAtom(activeRoomAtom);
  const { userId, nickname, canChat, linkWithGoogle } = useChatIdentity();
  const [tab, setTab] = useState<RoomsTab>(ROOMS_TAB.PUBLIC);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const publicRooms = usePublicRooms();
  const myRooms = useMyRooms();
  const myInvites = useMyInvites(userId);
  const { mutateAsync: joinRoom } = useJoinRoom();
  const {
    mutate: deleteRoom,
    isPending: isDeleting,
    isError: isDeleteError,
    error: deleteError,
    variables: deletingRoomId,
  } = useDeleteRoom();

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
        message.includes('wrong password') ? '비밀번호가 틀렸어요' : '입장하지 못했어요. 잠시 후 다시 시도해주세요',
      );
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleSelectMyRoom = (room: Room) => {
    enterRoom(room);
  };

  const handleDeleteRoom = (room: Room) => {
    deleteRoom(room.id, {
      onSuccess: () => {
        if (activeRoom?.id === room.id) setActiveRoom(null);
      },
    });
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
    <ModalShell onClose={closeModal} maxWidth="max-w-lg" className="flex flex-col overflow-hidden p-0">
      {(close) => (
        <div className="flex h-[88vh] max-h-[720px] flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-5 pb-1 pt-4">
            <div className="flex items-center gap-2.5">
              <span className="avatar-soft flex h-9 w-9 items-center justify-center rounded-full text-lg">💬</span>
              <div>
                <h3 className="text-base font-bold leading-tight text-gray-800">채팅방</h3>
                <p className="text-[11px] text-gray-400">친구들과 도란도란 수다 떨어요</p>
              </div>
            </div>
            <button
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="닫기"
            >
              ✕
            </button>
          </header>

          {/* Tab bar (segmented) */}
          <div role="group" aria-label="채팅방 메뉴" className="mx-4 mt-2 flex gap-1 rounded-2xl bg-input-bg p-1">
            {ROOMS_TABS.map((t) => {
              const isActive = tab === t.key;
              const showBadge = t.key === ROOMS_TAB.INVITES && pendingInviteCount > 0;
              const activeClass = t.accent ? 'btn-gold' : 'bg-white text-gray-800 shadow-game-sm';
              const inactiveClass = t.accent ? 'text-gold' : 'text-gray-400';
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-pressed={isActive}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-all ${
                    isActive ? activeClass : inactiveClass
                  }`}
                >
                  {t.label}
                  {showBadge && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
                      {pendingInviteCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-3">
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
                    onCreate={() => setTab(ROOMS_TAB.CREATE)}
                  />
                )}

                {tab === ROOMS_TAB.MY && (
                  <MyRoomsList
                    rooms={myRooms.data ?? []}
                    isLoading={myRooms.isLoading}
                    currentUserId={userId}
                    deletingRoomId={isDeleting ? (deletingRoomId ?? null) : null}
                    errorRoomId={isDeleteError ? (deletingRoomId ?? null) : null}
                    errorMessage={deleteError ? (deleteError as Error).message : null}
                    onSelectRoom={handleSelectMyRoom}
                    onDeleteRoom={handleDeleteRoom}
                    onCreate={() => setTab(ROOMS_TAB.CREATE)}
                    onBrowsePublic={() => setTab(ROOMS_TAB.PUBLIC)}
                  />
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
