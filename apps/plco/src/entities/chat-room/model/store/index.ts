import { atom } from 'jotai';
import type { Room } from '../types';

/**
 * 현재 진입한 공유 방 씬. null이면 개인 타마고치 방.
 * RoomsModal에서 방 선택 시 세팅, 씬의 '나가기'로 해제.
 */
export const activeRoomAtom = atom<Room | null>(null);
