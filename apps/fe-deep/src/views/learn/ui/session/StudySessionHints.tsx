import { useStudySessionContext } from '@views/learn/model/hooks/useStudySessionContext';
import { KeywordHints } from '@views/learn/ui/session/KeywordHints';

export function StudySessionHints() {
  const { content, isFlipped, recallInput } = useStudySessionContext();
  const hasAnsweredRecall = isFlipped && Boolean(recallInput.trim());

  if (content.keywords.length === 0 || hasAnsweredRecall) return null;
  return <KeywordHints keywords={content.keywords} />;
}
