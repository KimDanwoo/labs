'use client';

import { userProfileAtom } from '@entities/profile/model/store';
import { DEFAULT_PROFILE, type UserProfile } from '@entities/profile/model/types';
import { savedRoutinesAtom } from '@entities/routine/model/store';
import type { Routine } from '@entities/routine/model/types';
import { activeSessionAtom, sessionHistoryAtom } from '@entities/session/model/store';
import type { WorkoutSession } from '@entities/session/model/types';
import { routineDoc, routinesCol, sessionDoc, sessionsCol, userDoc } from '@shared/firebase';
import { loadLocal, saveLocal, STORAGE_KEYS } from '@shared/lib';
import { deleteDoc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 600;

type UserDocData = { profile: UserProfile; activeSession: WorkoutSession | null };

// 데이터 영속을 로그인 상태로 분기한다.
// - 비회원: localStorage가 진실
// - 로그인: Firestore(DB)가 진실 — 로그인 시 DB에서 로드, 변경분만 write-through
// 반환: 초기 로드 완료 여부(게이트용).
export const useDataPersistence = (uid: string | null): boolean => {
  const [profile, setProfile] = useAtom(userProfileAtom);
  const [routines, setRoutines] = useAtom(savedRoutinesAtom);
  const [activeSession, setActiveSession] = useAtom(activeSessionAtom);
  const [history, setHistory] = useAtom(sessionHistoryAtom);
  // 현재 소스(uid)에 대해 로드가 끝났는지: loadedUid === uid 면 완료. uid가 바뀌면 자동으로 미완료가 된다.
  const [loadedUid, setLoadedUid] = useState<string | null | undefined>(undefined);

  const localRef = useRef({ profile, routines, activeSession, history });
  useEffect(() => {
    localRef.current = { profile, routines, activeSession, history };
  });

  const loadedRef = useRef(false);
  const syncedUserRef = useRef<string | null>(null);
  const syncedRoutinesRef = useRef<Map<string, string>>(new Map());
  const syncedSessionsRef = useRef<Map<string, string>>(new Map());

  // 소스 전환(로그인/로그아웃) 시 1회 로드
  useEffect(() => {
    let cancelled = false;
    loadedRef.current = false;
    syncedUserRef.current = null;
    syncedRoutinesRef.current = new Map();
    syncedSessionsRef.current = new Map();

    const loadFromFirestore = async (userId: string) => {
      const local = localRef.current;

      const userSnap = await getDoc(userDoc(userId));
      if (cancelled) {
        return;
      }
      if (userSnap.exists()) {
        const data = userSnap.data() as Partial<UserDocData>;
        setProfile(data.profile ?? DEFAULT_PROFILE);
        setActiveSession(data.activeSession ?? null);
        syncedUserRef.current = JSON.stringify({
          profile: data.profile ?? DEFAULT_PROFILE,
          activeSession: data.activeSession ?? null,
        });
      } else {
        // DB가 비어있으면 현재(비회원에서 넘어온) 로컬 상태를 업로드(마이그레이션)
        const payload: UserDocData = { profile: local.profile, activeSession: local.activeSession };
        await setDoc(userDoc(userId), payload);
        syncedUserRef.current = JSON.stringify(payload);
      }

      const routinesSnap = await getDocs(routinesCol(userId));
      if (cancelled) {
        return;
      }
      if (!routinesSnap.empty) {
        const remote = routinesSnap.docs.map((entry) => entry.data() as Routine);
        setRoutines(remote);
        syncedRoutinesRef.current = new Map(remote.map((routine) => [routine.id, JSON.stringify(routine)]));
      } else {
        setRoutines(local.routines);
        await Promise.all(local.routines.map((routine) => setDoc(routineDoc(userId, routine.id), routine)));
        syncedRoutinesRef.current = new Map(local.routines.map((routine) => [routine.id, JSON.stringify(routine)]));
      }

      const sessionsSnap = await getDocs(sessionsCol(userId));
      if (cancelled) {
        return;
      }
      if (!sessionsSnap.empty) {
        const remote = sessionsSnap.docs.map((entry) => entry.data() as WorkoutSession);
        remote.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
        setHistory(remote);
        syncedSessionsRef.current = new Map(remote.map((session) => [session.id, JSON.stringify(session)]));
      } else {
        setHistory(local.history);
        await Promise.all(local.history.map((session) => setDoc(sessionDoc(userId, session.id), session)));
        syncedSessionsRef.current = new Map(local.history.map((session) => [session.id, JSON.stringify(session)]));
      }
    };

    const loadFromLocal = () => {
      setProfile(loadLocal<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE));
      setRoutines(loadLocal<Routine[]>(STORAGE_KEYS.routines, []));
      setActiveSession(loadLocal<WorkoutSession | null>(STORAGE_KEYS.activeSession, null));
      setHistory(loadLocal<WorkoutSession[]>(STORAGE_KEYS.history, []));
    };

    const run = async () => {
      if (uid) {
        await loadFromFirestore(uid);
      } else {
        // setState가 effect 동기 body에서 실행되지 않도록 마이크로태스크 뒤로 미룬다.
        await Promise.resolve();
        loadFromLocal();
      }
      if (cancelled) {
        return;
      }
      loadedRef.current = true;
      setLoadedUid(uid);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [uid, setProfile, setRoutines, setActiveSession, setHistory, setLoadedUid]);

  const loaded = loadedUid === uid;

  // profile + activeSession 영속
  useEffect(() => {
    if (!loadedRef.current) {
      return undefined;
    }
    if (!uid) {
      saveLocal(STORAGE_KEYS.profile, profile);
      saveLocal(STORAGE_KEYS.activeSession, activeSession);
      return undefined;
    }
    const payload: UserDocData = { profile, activeSession };
    const json = JSON.stringify(payload);
    if (json === syncedUserRef.current) {
      return undefined;
    }
    const timer = setTimeout(() => {
      syncedUserRef.current = json;
      void setDoc(userDoc(uid), payload, { merge: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [uid, profile, activeSession]);

  // routines 영속
  useEffect(() => {
    if (!loadedRef.current) {
      return undefined;
    }
    if (!uid) {
      saveLocal(STORAGE_KEYS.routines, routines);
      return undefined;
    }
    const timer = setTimeout(() => {
      const synced = syncedRoutinesRef.current;
      const nextIds = new Set(routines.map((routine) => routine.id));
      routines.forEach((routine) => {
        const json = JSON.stringify(routine);
        if (synced.get(routine.id) !== json) {
          synced.set(routine.id, json);
          void setDoc(routineDoc(uid, routine.id), routine);
        }
      });
      [...synced.keys()].forEach((id) => {
        if (!nextIds.has(id)) {
          synced.delete(id);
          void deleteDoc(routineDoc(uid, id));
        }
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [uid, routines]);

  // sessions(history) 영속
  useEffect(() => {
    if (!loadedRef.current) {
      return undefined;
    }
    if (!uid) {
      saveLocal(STORAGE_KEYS.history, history);
      return undefined;
    }
    const timer = setTimeout(() => {
      const synced = syncedSessionsRef.current;
      const nextIds = new Set(history.map((session) => session.id));
      history.forEach((session) => {
        const json = JSON.stringify(session);
        if (synced.get(session.id) !== json) {
          synced.set(session.id, json);
          void setDoc(sessionDoc(uid, session.id), session);
        }
      });
      [...synced.keys()].forEach((id) => {
        if (!nextIds.has(id)) {
          synced.delete(id);
          void deleteDoc(sessionDoc(uid, id));
        }
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [uid, history]);

  return loaded;
};
