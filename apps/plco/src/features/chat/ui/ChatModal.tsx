'use client';

import { ModalShell } from '@shared/ui';
import { useIsAdmin } from '@entities/auth/model/hooks';
import { useGameActions } from '@entities/game/model/hooks';
import { useChatIdentity, useChatRoom, useDeleteChat } from '../model/hooks';
import ChatComposer from './ChatComposer';
import ChatLoginGate from './ChatLoginGate';
import ChatMessageList from './ChatMessageList';
import ChatOnlineBar from './ChatOnlineBar';

type ChatModalProps = {
  roomId: string;
  roomName: string;
};

export default function ChatModal({ roomId, roomName }: ChatModalProps) {
  const { closeModal } = useGameActions();
  const { userId, nickname, canChat, linkWithGoogle } = useChatIdentity();
  const { isAdmin } = useIsAdmin();
  const { messages, isLoading, isError, onlineUsers } = useChatRoom(roomId, {
    userId,
    nickname,
  });
  const { mutate: deleteMessage } = useDeleteChat(roomId);

  return (
    <ModalShell
      onClose={closeModal}
      maxWidth="max-w-lg"
      className="flex flex-col overflow-hidden p-0"
    >
      {(close) => (
        <div className="flex h-[88vh] max-h-[720px] flex-col">
          <header className="flex items-center justify-between border-b border-card-border px-4 py-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-700">{roomName}</h3>
              <ChatOnlineBar users={onlineUsers} />
            </div>
            <button
              onClick={close}
              className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              aria-label="닫기"
            >
              ✕
            </button>
          </header>

          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            isError={isError}
            currentUserId={userId}
            canModerate={isAdmin}
            onDelete={deleteMessage}
          />

          <footer className="border-t border-card-border px-4 py-3">
            {canChat && userId ? (
              <ChatComposer
                roomId={roomId}
                userId={userId}
                nickname={nickname}
              />
            ) : (
              <ChatLoginGate onLogin={linkWithGoogle} />
            )}
          </footer>
        </div>
      )}
    </ModalShell>
  );
}
