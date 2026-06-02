'use client';

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { MEETING_PLAY_SCENE_MS } from '@shared/constants';
import { meetingPlayFriendAtom } from '../store';

/** 공원 놀기 장면이 시작되면 일정 시간 후 자동 종료(집으로 복귀). */
export function useMeetingPlayScene() {
  const friend = useAtomValue(meetingPlayFriendAtom);
  const setFriend = useSetAtom(meetingPlayFriendAtom);

  useEffect(() => {
    if (!friend) return;
    const timer = setTimeout(() => setFriend(null), MEETING_PLAY_SCENE_MS);
    return () => clearTimeout(timer);
  }, [friend, setFriend]);
}
