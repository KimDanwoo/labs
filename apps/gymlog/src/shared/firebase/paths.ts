import { collection, doc } from 'firebase/firestore';
import { getDb } from './db';

// 테이블 분리: 유저 문서엔 단일 값(프로필·진행 세션)만, 루틴·기록은 각자 하위 컬렉션.
export const userDoc = (uid: string) => doc(getDb(), 'users', uid);
export const routinesCol = (uid: string) => collection(getDb(), 'users', uid, 'routines');
export const sessionsCol = (uid: string) => collection(getDb(), 'users', uid, 'sessions');
export const routineDoc = (uid: string, routineId: string) => doc(getDb(), 'users', uid, 'routines', routineId);
export const sessionDoc = (uid: string, sessionId: string) => doc(getDb(), 'users', uid, 'sessions', sessionId);

// 관리자가 관리하는 공용 기본 루틴(읽기 공개 / 쓰기 관리자).
export const sharedRoutinesCol = () => collection(getDb(), 'sharedRoutines');
export const sharedRoutineDoc = (routineId: string) => doc(getDb(), 'sharedRoutines', routineId);
