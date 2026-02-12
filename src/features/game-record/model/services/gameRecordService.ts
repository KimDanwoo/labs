import {
  CUMULATIVE_RECORD_LIMIT,
  DEFAULT_USER_RECORD_LIMIT,
  LEADERBOARD_RECORD_LIMIT,
} from "@entities/game-record/model/constants";
import { GameRecord } from "@entities/game-record/model/types";
import { getRecordPoint } from "@entities/game-record/model/utils";
import { db } from "@shared/lib/firebase/config";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

const COLLECTION_NAME = "gameRecords";

export async function saveGameRecord(
  record: Omit<GameRecord, "id" | "createdAt">,
): Promise<string> {
  const docRef = await addDoc(
    collection(db, COLLECTION_NAME),
    { ...record, createdAt: Timestamp.now() },
  );
  return docRef.id;
}

export async function getUserRecords(
  userId: string,
  recordLimit = DEFAULT_USER_RECORD_LIMIT,
): Promise<GameRecord[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(recordLimit),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GameRecord[];
}

export interface LeaderboardQuery {
  difficulty?: string;
  gameMode?: string;
  recordLimit?: number;
}

function deduplicateByUser(
  records: GameRecord[],
): GameRecord[] {
  const best = new Map<string, GameRecord>();

  for (const record of records) {
    const existing = best.get(record.userId);
    if (
      !existing ||
      getRecordPoint(record) > getRecordPoint(existing)
    ) {
      best.set(record.userId, record);
    }
  }

  return Array.from(best.values()).sort(
    (a, b) => getRecordPoint(b) - getRecordPoint(a),
  );
}

function buildLeaderboardQuery(
  difficulty?: string,
  gameMode?: string,
  recordLimit = LEADERBOARD_RECORD_LIMIT,
) {
  const constraints = [
    where("isSuccess", "==", true),
    orderBy("score", "desc"),
    limit(recordLimit),
  ];

  if (difficulty && gameMode) {
    return query(
      collection(db, COLLECTION_NAME),
      where("isSuccess", "==", true),
      where("difficulty", "==", difficulty),
      where("gameMode", "==", gameMode),
      orderBy("score", "desc"),
      limit(recordLimit),
    );
  }

  if (difficulty) {
    return query(
      collection(db, COLLECTION_NAME),
      where("isSuccess", "==", true),
      where("difficulty", "==", difficulty),
      orderBy("score", "desc"),
      limit(recordLimit),
    );
  }

  if (gameMode) {
    return query(
      collection(db, COLLECTION_NAME),
      where("isSuccess", "==", true),
      where("gameMode", "==", gameMode),
      orderBy("score", "desc"),
      limit(recordLimit),
    );
  }

  return query(
    collection(db, COLLECTION_NAME),
    ...constraints,
  );
}

export async function getLeaderboard(
  options: LeaderboardQuery = {},
): Promise<GameRecord[]> {
  const {
    difficulty, gameMode, recordLimit = 100,
  } = options;

  const q = buildLeaderboardQuery(
    difficulty, gameMode, recordLimit,
  );

  const snapshot = await getDocs(q);
  const allRecords = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GameRecord[];

  return deduplicateByUser(allRecords);
}

export interface CumulativePointsEntry {
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  totalPoints: number;
  gamesCount: number;
}

export async function getCumulativeLeaderboard(
  recordLimit = LEADERBOARD_RECORD_LIMIT,
): Promise<CumulativePointsEntry[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("isSuccess", "==", true),
    orderBy("createdAt", "desc"),
    limit(CUMULATIVE_RECORD_LIMIT),
  );

  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(
    (doc) => doc.data() as GameRecord,
  );

  const userMap = new Map<string, CumulativePointsEntry>();

  for (const record of records) {
    const points = getRecordPoint(record);
    const existing = userMap.get(record.userId);

    if (existing) {
      existing.totalPoints += points;
      existing.gamesCount += 1;
    } else {
      userMap.set(record.userId, {
        userId: record.userId,
        userDisplayName: record.userDisplayName,
        userPhotoURL: record.userPhotoURL,
        totalPoints: points,
        gamesCount: 1,
      });
    }
  }

  return Array.from(userMap.values())
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, recordLimit);
}
