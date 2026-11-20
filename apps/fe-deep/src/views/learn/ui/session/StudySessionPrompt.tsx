import { useStudySessionContext } from '@views/learn/model/hooks/useStudySessionContext';

export function StudySessionPrompt() {
  const { content } = useStudySessionContext();

  return (
    <div className="flex flex-col items-center justify-center min-h-[120px] mb-6">
      <p className="text-lg font-normal text-center leading-relaxed whitespace-pre-line">{content.prompt}</p>
    </div>
  );
}
