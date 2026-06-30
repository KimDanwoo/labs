'use client';

import { authReadyAtom, firebaseUserAtom } from '@entities/user/model/store';
import { getFirebaseAuth, routinesCol, sessionsCol, userDoc } from '@shared/firebase';
import { FirebaseError } from 'firebase/app';
import {
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { deleteDoc, getDocs } from 'firebase/firestore';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

// 앱 루트에서 1회 호출 — 인증 상태를 구독해 전역 atom에 반영한다.
export const useAuthListener = (): void => {
  const setUser = useSetAtom(firebaseUserAtom);
  const setReady = useSetAtom(authReadyAtom);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setUser(user);
      setReady(true);
    });
    return unsubscribe;
  }, [setUser, setReady]);
};

// 팝업 로그인 — localhost/cross-origin에서 서드파티 쿠키 차단으로 redirect 세션이 유실되는 문제를 피한다.
export const signInWithGoogle = (): Promise<void> =>
  signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider()).then(() => undefined);

export const signOutUser = (): Promise<void> => signOut(getFirebaseAuth());

// 회원 탈퇴 — Firestore 데이터(루틴·기록·유저 문서)를 먼저 지우고 Auth 계정을 삭제한다.
// 계정 삭제는 최근 로그인을 요구하므로, 만료됐으면 재인증 후 다시 시도한다.
export const deleteAccount = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    return;
  }
  const uid = user.uid;

  const [routines, sessions] = await Promise.all([getDocs(routinesCol(uid)), getDocs(sessionsCol(uid))]);
  await Promise.all([...routines.docs, ...sessions.docs].map((entry) => deleteDoc(entry.ref)));
  await deleteDoc(userDoc(uid));

  try {
    await deleteUser(user);
  } catch (cause) {
    if (cause instanceof FirebaseError && cause.code === 'auth/requires-recent-login') {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      await deleteUser(user);
      return;
    }
    throw cause;
  }
};
