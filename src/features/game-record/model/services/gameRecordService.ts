import { GameRecord } from "@entities/game-record/model/types";
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
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...record,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getUserRecords(
  userId: string,
  recordLimit = 20,
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

export async function getLeaderboard(options: LeaderboardQuery = {}): Promise<GameRecord[]> {
  const { difficulty, gameMode, recordLimit = 100 } = options;

  let q = query(
    collection(db, COLLECTION_NAME),
    where("isSuccess", "==", true),
    orderBy("score", "desc"),
    limit(recordLimit),
  );

  if (difficulty) {
    q = query(
      collection(db, COLLECTION_NAME),
      where("isSuccess", "==", true),
      where("difficulty", "==", difficulty),
      orderBy("score", "desc"),
      limit(recordLimit),
    );
  }

  if (gameMode) {
    q = query(
      collection(db, COLLECTION_NAME),
      where("isSuccess", "==", true),
      where("gameMode", "==", gameMode),
      orderBy("score", "desc"),
      limit(recordLimit),
    );
  }

  if (difficulty && gameMode) {
    q = query(
      collection(db, COLLECTION_NAME),
      where("isSuccess", "==", true),
      where("difficulty", "==", difficulty),
      where("gameMode", "==", gameMode),
      orderBy("score", "desc"),
      limit(recordLimit),
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GameRecord[];
}
