import { useStudySessionContext } from '@views/learn/model/hooks/useStudySessionContext';
import { KeywordHints } from '@views/learn/ui/session/KeywordHints';

export function StudySessionHints() {
  const { content, isFlipped, recallInput } = useStudySessionContext();
  const hasAnsweredRecall = isFlipped && Boolean(recallInput.trim());

  const shouldHideHints = content.keywords.length === 0 || hasAnsweredRecall;

  if (shouldHideHints) return null;
  return <KeywordHints keywords={content.keywords} />;
}
