import { atom } from 'jotai';
import type { WorkoutSession } from '../types/session';

// 진행 중 세션(라우트를 넘나들어도 유지). 없으면 null. 영속은 data-persistence가 담당.
export const activeSessionAtom = atom<WorkoutSession | null>(null);

// 완료/중단된 세션 기록. 달력·추세의 source.
export const sessionHistoryAtom = atom<WorkoutSession[]>([]);

// 방금 레벨업한 정보(축하 오버레이용). 닫으면 null. 영속 안 함.
export type LevelUp = { level: number; name: string };
export const levelUpAtom = atom<LevelUp | null>(null);
