'use client';

import { useState } from 'react';
import { ModalShell } from '@shared/ui';
import { useGameActions } from '@entities/game/model/hooks';
import {
  useCreateRoom,
  useMyInvites,
  useMyRooms,
  useSendInvite,
} from '@entities/chat-room/model/hooks';
import type { Room } from '@entities/chat-room/model/types';
import { useLobbyPresence } from '@features/room-lobby/model/hooks';
import { OnlineUsersPicker } from '@features/room-lobby/ui';
import { useChatIdentity } from '@features/chat/model/hooks';
import { ChatLoginGate, RoomChatView } from '@features/chat/ui';
import CreateRoomDialog from './CreateRoomDialog';
import IncomingInvites from './IncomingInvites';
import MyRoomsList from './MyRoomsList';

type RoomsView =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'lobby' }
  | { kind: 'chat'; room: Room };

export default function RoomsModal() {
  const { closeModal } = useGameActions();
  const { userId, nickname, canChat, linkWithGoogle } = useChatIdentity();
  const [view, setView] = useState<RoomsView>({ kind: 'list' });
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

  const myRooms = useMyRooms();
  const myInvites = useMyInvites(userId);

  const lobbyIdentity = canChat && userId ? { userId, nickname } : null;
  const onlineUsers = useLobbyPresence(lobbyIdentity);

  const { mutateAsync: createRoom } = useCreateRoom();
  const { mutateAsync: sendInvite } = useSendInvite();

  // 로비에서 초대 = 새 방을 만들고 나는 즉시 그 방에 입장 + 상대에게 초대 발송
  const handleInviteFromLobby = async (inviteeId: string) => {
    if (!userId) return;
    const invitee = onlineUsers.find((u) => u.userId === inviteeId);
    const roomName = invitee
      ? `${nickname}, ${invitee.nickname}`
      : `${nickname}님의 방`;
    setInvitingUserId(inviteeId);
    try {
      const roomId = await createRoom({ name: roomName, nickname });
      try {
        await sendInvite({ roomId, inviteeId });
      } catch (err) {
        console.error('초대 발송 실패 (방은 생성됨):', err);
      }
      await myRooms.refetch();
      setView({
        kind: 'chat',
        room: {
          id: roomId,
          name: roomName,
          ownerId: userId,
          createdAt: new Date().toISOString(),
        },
      });
    } finally {
      setInvitingUserId(null);
    }
  };

  const pendingInviteCount = myInvites.data?.length ?? 0;
  const activeTab: 'list' | 'lobby' =
    view.kind === 'chat' || view.kind === 'create' || view.kind === 'list'
      ? 'list'
      : 'lobby';

  return (
    <ModalShell
      onClose={closeModal}
      maxWidth="max-w-lg"
      className="flex flex-col overflow-hidden p-0"
    >
      {(close) => (
        <div className="flex h-[88vh] max-h-[720px] flex-col">
          {/* Room chat view — full-height overlay inside the modal */}
          {view.kind === 'chat' && (
            <RoomChatView
              roomId={view.room.id}
              roomName={view.room.name}
              onBack={() => setView({ kind: 'list' })}
            />
          )}

          {/* List / Lobby views */}
          {view.kind !== 'chat' && (
            <>
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
                {(['list', 'lobby'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setView({ kind: tab })}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-gold text-gold'
                        : 'text-gray-400'
                    }`}
                  >
                    {tab === 'list' ? '내 방' : '로비'}
                    {tab === 'list' && pendingInviteCount > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
                        {pendingInviteCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                {!canChat ? (
                  <ChatLoginGate onLogin={linkWithGoogle} />
                ) : (
                  <>
                    {view.kind === 'list' && (
                      <>
                        {pendingInviteCount > 0 && (
                          <IncomingInvites
                            invites={myInvites.data ?? []}
                            defaultNickname={nickname}
                            onAccepted={(roomId) => {
                              // refetch 결과값으로 이동 (myRooms.data는 클로저 시점 값이라 stale)
                              myRooms.refetch().then((res) => {
                                const room = res.data?.find(
                                  (r) => r.id === roomId,
                                );
                                if (room) setView({ kind: 'chat', room });
                              });
                            }}
                          />
                        )}

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-500">
                              참여 중인 방
                            </p>
                            <button
                              type="button"
                              onClick={() => setView({ kind: 'create' })}
                              className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-white btn-press shadow-game-sm"
                            >
                              + 방 만들기
                            </button>
                          </div>
                          <MyRoomsList
                            rooms={myRooms.data ?? []}
                            isLoading={myRooms.isLoading}
                            onSelectRoom={(room) =>
                              setView({ kind: 'chat', room })
                            }
                          />
                        </div>
                      </>
                    )}

                    {view.kind === 'create' && (
                      <CreateRoomDialog
                        defaultNickname={nickname}
                        onCreated={() => setView({ kind: 'list' })}
                        onCancel={() => setView({ kind: 'list' })}
                      />
                    )}

                    {view.kind === 'lobby' && (
                      <div className="flex flex-col gap-3">
                        <p className="text-xs font-semibold text-gray-500">
                          지금 접속 중인 유저
                        </p>
                        <p className="text-[11px] text-gray-400">
                          초대하면 새 방이 만들어지고 바로 입장돼요
                        </p>
                        {userId && (
                          <OnlineUsersPicker
                            users={onlineUsers}
                            currentUserId={userId}
                            onInvite={handleInviteFromLobby}
                            invitingUserId={invitingUserId}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </ModalShell>
  );
}
