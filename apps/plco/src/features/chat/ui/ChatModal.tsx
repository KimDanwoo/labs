'use client';

import { useAtomValue } from 'jotai';
import { CHARACTERS } from '@shared/constants';
import { ModalShell } from '@shared/ui';
import { useIsAdmin } from '@entities/auth/model/hooks';
import { activeCharacterIdAtom } from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';
import { useChatIdentity, useChatRoom, useDeleteChat } from '../model/hooks';
import ChatComposer from './ChatComposer';
import ChatLoginGate from './ChatLoginGate';
import ChatMessageList from './ChatMessageList';
import ChatOnlineBar from './ChatOnlineBar';

export default function ChatModal() {
  const { closeModal } = useGameActions();
  const characterId = useAtomValue(activeCharacterIdAtom);
  const { userId, nickname, canChat, linkWithGoogle } = useChatIdentity();
  const { isAdmin } = useIsAdmin();
  const room = characterId ?? 'yeko';
  const { messages, isLoading, isError, onlineUsers } = useChatRoom(room, {
    userId,
    nickname,
  });
  const { mutate: deleteMessage } = useDeleteChat(room);

  if (!characterId) return null;

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
              <h3 className="text-base font-bold text-gray-700">
                {CHARACTERS[characterId].name} 팬 톡
              </h3>
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
                characterId={characterId}
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
