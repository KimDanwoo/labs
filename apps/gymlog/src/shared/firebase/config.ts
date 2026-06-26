import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

// firebaseConfig는 공개 식별자라 클라이언트 노출이 정상(보안은 Firestore 규칙·Auth가 담당).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// getApps() 가드로 HMR·중복 초기화를 막는 싱글턴. initializeApp은 브라우저 API를 건드리지 않아 서버에서도 안전.
export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
