import { DEFAULT_PROFILE, type UserProfile } from '@entities/profile/model/types';
import { atom } from 'jotai';

// 사용자 기본 설정(목표·경력·세트 수·휴식). 영속은 data-persistence가 담당(비회원=로컬/로그인=DB).
export const userProfileAtom = atom<UserProfile>(DEFAULT_PROFILE);
