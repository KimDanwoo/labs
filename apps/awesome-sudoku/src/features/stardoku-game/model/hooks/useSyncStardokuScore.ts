import { userAtom } from '@features/auth/model/atoms';
import { scoreAtom, stageAtom } from '@features/stardoku-game/model/atoms';
import { upsertStardokuScore } from '@features/stardoku-game/model/services';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

/** 로그인 상태면 누적 점수·스테이지를 랭킹 문서에 동기화 (클리어/게임오버 정산마다) */
export const useSyncStardokuScore = (): void => {
  const user = useAtomValue(userAtom);
  const score = useAtomValue(scoreAtom);
  const stage = useAtomValue(stageAtom);

  useEffect(() => {
    if (!user) return;
    if (score === 0 && stage === 1) return; // 아직 아무 기록 없음 — 0점 문서로 랭킹 오염 방지

    upsertStardokuScore({
      userId: user.uid,
      userDisplayName: user.displayName || '익명',
      userPhotoURL: user.photoURL,
      score,
      stage,
    }).catch(() => {
      // 랭킹 동기화 실패가 게임 진행을 막으면 안 된다 — 다음 정산 때 재시도됨
    });
  }, [user, score, stage]);
};
