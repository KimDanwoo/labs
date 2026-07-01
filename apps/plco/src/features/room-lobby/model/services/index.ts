import { supabase } from '@shared/lib';
import type { LobbyUser } from '../types';

export type { LobbyUser } from '../types';

type JoinLobbyOptions = {
  identity: LobbyUser;
  onSync: (users: LobbyUser[]) => void;
};

const LOBBY_CHANNEL = 'lobby:presence';

/**
 * 전역 로비 presence 채널에 입장한다.
 * 비익명 로그인 유저만 track하고, 모든 구독자는 onlineUsers 목록을 수신한다.
 * 정리 함수를 반환한다.
 */
export function joinLobby({
  identity,
  onSync,
}: JoinLobbyOptions): () => void {
  const channel = supabase.channel(LOBBY_CHANNEL, {
    config: { presence: { key: identity.userId } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<LobbyUser>();
      const unique = new Map<string, LobbyUser>();
      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry.userId) {
            unique.set(entry.userId, {
              userId: entry.userId,
              nickname: entry.nickname,
            });
          }
        });
      });
      onSync([...unique.values()]);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track(identity);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
