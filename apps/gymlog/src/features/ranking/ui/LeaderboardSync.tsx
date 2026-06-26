'use client';

import { useLeaderboardSync } from '../model/hooks';

// 로그인 유저의 점수를 공개 랭킹에 동기화하는 비표시 컴포넌트(app 루트에 마운트).
export function LeaderboardSync() {
  useLeaderboardSync();
  return null;
}
