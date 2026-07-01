'use client';

import { useEffect, useState } from 'react';
import type { LobbyUser } from '../types';
import { joinLobby } from '../services';

/**
 * 글로벌 로비 presence. identity가 있는 동안만 채널에 입장·track한다.
 * 반환값: 현재 접속 중인 유저 목록 (자신 포함).
 */
export function useLobbyPresence(identity: LobbyUser | null) {
  const [onlineUsers, setOnlineUsers] = useState<LobbyUser[]>([]);

  useEffect(() => {
    if (!identity) return;

    const leave = joinLobby({
      identity,
      onSync: setOnlineUsers,
    });

    return () => {
      leave();
      setOnlineUsers([]);
    };
  }, [identity?.userId, identity?.nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  return onlineUsers;
}
