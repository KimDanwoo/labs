import { atom } from 'jotai';
import type { Routine } from '../types/routine';

// 사용자가 만들어 저장한 내 루틴들. 영속은 data-persistence가 담당.
export const savedRoutinesAtom = atom<Routine[]>([]);

// 관리자가 관리하는 공용 기본 루틴(Firestore sharedRoutines에서 로드, 비면 PRESET 폴백).
export const sharedRoutinesAtom = atom<Routine[]>([]);

// 편집기로 미리 채워 넘길 임시 루틴(예: 오늘 자동 구성을 편집). 영속 안 함.
export const routineDraftAtom = atom<Routine | null>(null);
