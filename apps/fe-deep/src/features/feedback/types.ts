/* eslint-disable fsd/slice-structure -- 세그먼트 폴더로 내리는 구조 정리는 별도 작업. 정리 후 이 줄을 제거할 것. */
export type FeedbackType = 'add_question' | 'edit_question';

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface CreateFeedbackInput {
  type: FeedbackType;
  content: string;
  questionId?: string;
}
