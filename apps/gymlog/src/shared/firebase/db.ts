import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseApp } from './config';

// 브라우저 전용 — IndexedDB 오프라인 캐시를 켠 Firestore 싱글턴. 첫 호출 때 1회 초기화한다.
let dbInstance: Firestore | null = null;

export const getDb = (): Firestore => {
  dbInstance ??= initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) }),
    // 도메인 객체에 optional(undefined) 필드가 있어도 저장 시 거부되지 않게 한다.
    ignoreUndefinedProperties: true,
  });
  return dbInstance;
};
