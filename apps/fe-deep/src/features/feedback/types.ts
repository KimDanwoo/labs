export type FeedbackType = 'add_question' | 'edit_question';

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface CreateFeedbackInput {
  type: FeedbackType;
  content: string;
  questionId?: string;
}
