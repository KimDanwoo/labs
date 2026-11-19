import { useStudySessionContext } from '../../model/hooks/useStudySessionContext';
import { AnswerReveal } from './AnswerReveal';
import { RecallInput } from './RecallInput';

export function StudySessionResponse() {
  const { content, isFlipped, recallInput, setRecallInput, handleFlip } = useStudySessionContext();

  if (isFlipped) return <AnswerReveal answer={content.answer} recallInput={recallInput} keywords={content.keywords} />;
  return <RecallInput value={recallInput} onChange={setRecallInput} onSubmit={handleFlip} />;
}
