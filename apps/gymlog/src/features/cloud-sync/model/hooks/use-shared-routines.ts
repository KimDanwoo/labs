'use client';

import { PRESET_ROUTINES } from '@entities/routine/model/constants';
import { sharedRoutinesAtom } from '@entities/routine/model/store';
import type { Routine } from '@entities/routine/model/types';
import { sharedRoutinesCol } from '@shared/firebase';
import { getDocs } from 'firebase/firestore';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

// 공용 기본 루틴을 1회 로드한다(로그인 무관, 읽기 공개).
// DB에 아무것도 없으면 코드의 PRESET_ROUTINES로 폴백 → 전환 중에도 기본 루틴이 사라지지 않는다.
export const useSharedRoutines = (): void => {
  const setShared = useSetAtom(sharedRoutinesAtom);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const snapshot = await getDocs(sharedRoutinesCol());
        if (cancelled) {
          return;
        }
        setShared(snapshot.empty ? [...PRESET_ROUTINES] : snapshot.docs.map((entry) => entry.data() as Routine));
      } catch {
        if (!cancelled) {
          setShared([...PRESET_ROUTINES]);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [setShared]);
};
