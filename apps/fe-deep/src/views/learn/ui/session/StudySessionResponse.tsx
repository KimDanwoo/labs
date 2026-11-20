import { useStudySessionContext } from '@views/learn/model/hooks/useStudySessionContext';
import { AnswerReveal } from '@views/learn/ui/session/AnswerReveal';
import { RecallInput } from '@views/learn/ui/session/RecallInput';

export function StudySessionResponse() {
  const { content, isFlipped, recallInput, setRecallInput, handleFlip } = useStudySessionContext();

  if (isFlipped) return <AnswerReveal answer={content.answer} recallInput={recallInput} keywords={content.keywords} />;
  return <RecallInput value={recallInput} onChange={setRecallInput} onSubmit={handleFlip} />;
}
