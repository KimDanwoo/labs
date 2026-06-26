'use client';

import { computeRankingScore } from '@entities/session/model/lib';
import { sessionHistoryAtom } from '@entities/session/model/store';
import { firebaseUserAtom } from '@entities/user/model/store';
import { leaderboardDoc } from '@shared/firebase';
import { setDoc } from 'firebase/firestore';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';

const DEBOUNCE_MS = 800;

// 로그인 유저의 종합 점수를 공개 랭킹(leaderboard)에 업로드한다(비회원은 참여 안 함).
export const useLeaderboardSync = (): void => {
  const user = useAtomValue(firebaseUserAtom);
  const history = useAtomValue(sessionHistoryAtom);
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      return undefined;
    }
    const { score, totalVolume, level } = computeRankingScore(history, new Date());
    const payload = {
      displayName: user.displayName ?? '익명의 헬창',
      score,
      totalVolume,
      level,
    };
    const json = JSON.stringify(payload);
    if (json === lastRef.current) {
      return undefined;
    }
    const timer = setTimeout(() => {
      lastRef.current = json;
      void setDoc(leaderboardDoc(user.uid), payload, { merge: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [user, history]);
};
