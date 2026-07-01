import { User } from "@entities/auth/model/types";
import { getAuthInstance } from "@shared/lib/firebase/config";
import type { User as FirebaseUser } from "firebase/auth";

/**
 * @description Firebase User를 앱의 User 타입으로 변환
 * @param firebaseUser
 * @returns
 */
export function mapFirebaseUserToUser(firebaseUser: FirebaseUser | null): User | null {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
  };
}

/**
 * @description 구글 로그인
 * @returns
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const auth = await getAuthInstance();
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();

    // 추가 스코프 설정 (선택사항)
    provider.addScope("profile");
    provider.addScope("email");

    const result = await signInWithPopup(auth, provider);
    return mapFirebaseUserToUser(result.user);
  } catch (error) {
    throw new Error(error as string);
  }
}

/**
 * @description 로그아웃
 * @returns
 */
export async function signOut(): Promise<void> {
  try {
    const auth = await getAuthInstance();
    const { signOut: firebaseSignOut } = await import("firebase/auth");
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(error as string);
  }
}

/**
 * @description 인증 상태 구독
 * @param callback
 * @returns
 */
export async function subscribeToAuthChanges(
  callback: (user: User | null) => void,
): Promise<() => void> {
  const auth = await getAuthInstance();
  const { onAuthStateChanged } = await import("firebase/auth");
  return onAuthStateChanged(auth, (firebaseUser) => {
    const user = mapFirebaseUserToUser(firebaseUser);
    callback(user);
  });
}
