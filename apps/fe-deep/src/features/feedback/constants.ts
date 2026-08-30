/* eslint-disable fsd/slice-structure -- 세그먼트 폴더로 내리는 구조 정리는 별도 작업. 정리 후 이 줄을 제거할 것. */
import type { FeedbackType } from './types';

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  add_question: '질문 추가 요청',
  edit_question: '질문 수정 요청',
};
