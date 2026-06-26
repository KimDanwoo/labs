import { getAuth, type Auth } from 'firebase/auth';
import { firebaseApp } from './config';

// 브라우저 전용 — 클라이언트 컴포넌트/훅에서만 호출한다(서버 렌더 중 호출 금지).
let authInstance: Auth | null = null;

export const getFirebaseAuth = (): Auth => {
  authInstance ??= getAuth(firebaseApp);
  return authInstance;
};
