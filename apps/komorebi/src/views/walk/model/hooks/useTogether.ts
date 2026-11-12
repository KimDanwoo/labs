import { nicknameIsValid, type Climate } from '@komorebi/realtime';
import { useEffect, useEffectEvent, useState, type RefObject } from 'react';
import { REALTIME_URL } from '../../config/realtime';
import type { WalkEngine } from '../../lib/scene';
import {
  CONNECTION,
  EMPTY_TOGETHER,
  connectTogether,
  createRoomId,
  invitationUrl,
  type TogetherState,
} from '../together';

type Session = { room: string; nickname: string };
type Options = { engine: RefObject<WalkEngine | null>; climate: Climate; invitedRoom: string | null };
type Together = TogetherState & {
  session: Session | null;
  invitedRoom: string | null;
  isAvailable: boolean;
  join: (nickname: string) => void;
  leave: () => void;
};

export function useTogether({ engine, climate, invitedRoom }: Options): Together {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState(EMPTY_TOGETHER);
  const getClimate = useEffectEvent(() => climate);
  useEffect(() => {
    if (!session || !REALTIME_URL) return undefined;
    const connection = connectTogether({
      endpoint: REALTIME_URL,
      ...session,
      climate: getClimate(),
      getWalker: () => engine.current?.getWalker() ?? null,
      onState: setState,
      onPeers: (peers) => engine.current?.setPeers(peers),
      onArrival: (peers) => {
        void engine.current?.arriveTogether(peers);
      },
    });
    return () => connection.close();
  }, [session, engine]);
  function join(nickname: string): void {
    const name = nickname.trim();
    if (!nicknameIsValid(name) || !REALTIME_URL) return;
    const room = invitedRoom ?? createRoomId();
    window.history.replaceState(null, '', invitationUrl(room, window.location.href));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    setState({ ...EMPTY_TOGETHER, status: CONNECTION.connecting });
    setSession({ room, nickname: name });
  }
  function leave(): void {
    setSession(null);
    setState(EMPTY_TOGETHER);
    engine.current?.setPeers([]);
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  return { ...state, session, invitedRoom, isAvailable: REALTIME_URL !== null, join, leave };
}
