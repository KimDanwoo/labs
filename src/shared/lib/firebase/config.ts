import { getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Firebase Auth 인스턴스를 지연 초기화한다.
 * 홈페이지 초기 로드 시 Auth 번들(~40KB gzip)을 포함하지 않기 위함.
 */
let _auth: Auth | null = null;
export async function getAuthInstance(): Promise<Auth> {
  if (!_auth) {
    const { getAuth } = await import("firebase/auth");
    _auth = getAuth(app);
  }
  return _auth;
}

/**
 * Firestore 인스턴스를 지연 초기화한다.
 * 홈페이지 초기 로드 시 Firestore 번들을 포함하지 않기 위함.
 */
let _db: Firestore | null = null;
export async function getDb(): Promise<Firestore> {
  if (!_db) {
    const { getFirestore } = await import("firebase/firestore");
    _db = getFirestore(app);
  }
  return _db;
}

export default app;
