import { supabase } from '@shared/lib';
import { CHAT_ADMIN_API, CHAT_PAGE_SIZE, CHAT_TABLE, chatChannelName } from '../constants';
import type { ChatMessage, ChatPresenceUser, SendChatInput } from '../types';

type ChatMessageRow = {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  message: string;
  created_at: string;
};

function toMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    nickname: row.nickname,
    message: row.message,
    createdAt: row.created_at,
  };
}

/** 방의 최근 메시지를 오래된 순으로 반환한다. */
export async function fetchMessages(roomId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from(CHAT_TABLE)
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(CHAT_PAGE_SIZE);

  if (error) throw error;
  return (data as ChatMessageRow[] | null)?.map(toMessage).reverse() ?? [];
}

export async function sendMessage(input: SendChatInput): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from(CHAT_TABLE)
    .insert({
      room_id: input.roomId,
      user_id: input.userId,
      nickname: input.nickname,
      message: input.message,
    })
    .select('*')
    .single();

  if (error) throw error;
  return toMessage(data as ChatMessageRow);
}

/** 관리자 전용 삭제. 서버 라우트가 세션 토큰의 is_admin 을 검증한다. */
export async function deleteMessage(id: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${CHAT_ADMIN_API}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined,
  });
  if (!res.ok) throw new Error('메시지 삭제에 실패했습니다.');
}

type JoinRoomOptions = {
  roomId: string;
  identity: ChatPresenceUser | null;
  onInsert: (message: ChatMessage) => void;
  onDelete: (id: string) => void;
  onPresenceSync: (users: ChatPresenceUser[]) => void;
};

type PresencePayload = {
  userId?: string;
  nickname?: string;
  characterId?: string | null;
};

/**
 * 방에 입장한다. 하나의 채널로 (1) 신규 메시지 수신 (2) 접속자 presence 추적을
 * 함께 처리한다. 로그인 유저(identity 있음)는 본인을 presence에 등록한다.
 * 정리 함수를 반환한다.
 */
export function joinRoom({
  roomId,
  identity,
  onInsert,
  onDelete,
  onPresenceSync,
}: JoinRoomOptions): () => void {
  const channel = supabase.channel(chatChannelName(roomId), {
    config: { presence: { key: identity?.userId ?? 'guest' } },
  });

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: CHAT_TABLE,
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => onInsert(toMessage(payload.new as ChatMessageRow)),
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: CHAT_TABLE },
      (payload) => {
        const oldId = (payload.old as { id?: string }).id;
        if (oldId) onDelete(oldId);
      },
    )
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresencePayload>();
      const unique = new Map<string, ChatPresenceUser>();
      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry.userId) {
            unique.set(entry.userId, {
              userId: entry.userId,
              nickname: entry.nickname ?? '',
              characterId: entry.characterId ?? null,
            });
          }
        });
      });
      onPresenceSync([...unique.values()]);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED' && identity) {
        channel.track(identity);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
