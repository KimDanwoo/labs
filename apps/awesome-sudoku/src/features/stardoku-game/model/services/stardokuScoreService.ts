import { LEADERBOARD_RECORD_LIMIT } from '@entities/game-record/model/constants';
import { getDb } from '@shared/lib/firebase/config';
import { Timestamp, collection, doc, getDocs, limit, orderBy, query, setDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'stardokuScores';

export interface StardokuScoreEntry {
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  /** 누적 점수 — 랭킹 정렬 기준 */
  score: number;
  /** 현재 도달 스테이지 */
  stage: number;
}

/** 유저당 1문서(docId = uid) — 로컬 누적 점수를 미러링 */
export async function upsertStardokuScore(entry: StardokuScoreEntry): Promise<void> {
  const db = await getDb();
  await setDoc(doc(db, COLLECTION_NAME, entry.userId), { ...entry, updatedAt: Timestamp.now() }, { merge: true });
}

export async function getStardokuLeaderboard(recordLimit = LEADERBOARD_RECORD_LIMIT): Promise<StardokuScoreEntry[]> {
  const db = await getDb();
  const q = query(collection(db, COLLECTION_NAME), orderBy('score', 'desc'), limit(recordLimit));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnapshot) => docSnapshot.data() as StardokuScoreEntry);
}
