'use client';

import { leaderboardCol } from '@shared/firebase';
import { getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../types';

const TOP_LIMIT = 100;

// 상위 랭킹을 점수 내림차순으로 1회 조회한다(공개 읽기).
export const useLeaderboard = (): { entries: LeaderboardEntry[]; loading: boolean } => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const snapshot = await getDocs(query(leaderboardCol(), orderBy('score', 'desc'), limit(TOP_LIMIT)));
        if (cancelled) {
          return;
        }
        setEntries(
          snapshot.docs.map((entry) => ({ uid: entry.id, ...(entry.data() as Omit<LeaderboardEntry, 'uid'>) })),
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, loading };
};
