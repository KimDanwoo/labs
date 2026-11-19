import { SCHOOL_REGION, type SchoolRegion } from '../model/schoolmateRoster';

export const SCHOOLMATE_GREETING = {
  [SCHOOL_REGION.yard]: '방학이라 운동장이 우리 둘 거네. 같이 공 던질래?',
  [SCHOOL_REGION.hallway]: '복도가 조용하니까 발소리가 멀리까지 들려. 우리 교실도 가 보자.',
  [SCHOOL_REGION.classroom]: '우리 교실 냄새, 그대로다. 칠판에 여름 이야기를 남겨 볼까?',
} satisfies Record<SchoolRegion, string>;
