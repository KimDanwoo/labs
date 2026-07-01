'use client';

import { useIsAdmin } from '@entities/auth/model/hooks';
import { useChatIdentity, useChatRoom, useDeleteChat } from '../model/hooks';
import ChatComposer from './ChatComposer';
import ChatLoginGate from './ChatLoginGate';
import ChatMessageList from './ChatMessageList';
import ChatOnlineBar from './ChatOnlineBar';

type RoomChatViewProps = {
  roomId: string;
  roomName: string;
  onBack: () => void;
};

/**
 * 방 채팅 뷰 — ModalShell 없이 부모 레이아웃 안에 삽입되는 버전.
 * RoomsModal 내부에서 사용한다.
 */
export default function RoomChatView({
  roomId,
  roomName,
  onBack,
}: RoomChatViewProps) {
  const { userId, nickname, canChat, linkWithGoogle } = useChatIdentity();
  const { isAdmin } = useIsAdmin();
  const { messages, isLoading, isError, onlineUsers } = useChatRoom(roomId, {
    userId,
    nickname,
  });
  const { mutate: deleteMessage } = useDeleteChat(roomId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-card-border px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          aria-label="뒤로"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-gray-700">
            {roomName}
          </h4>
          <ChatOnlineBar users={onlineUsers} />
        </div>
      </div>

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
          <ChatComposer roomId={roomId} userId={userId} nickname={nickname} />
        ) : (
          <ChatLoginGate onLogin={linkWithGoogle} />
        )}
      </footer>
    </div>
  );
}
