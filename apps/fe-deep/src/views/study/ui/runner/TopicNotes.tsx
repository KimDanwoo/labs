import { MarkdownRenderer } from '@shared/ui/markdown-renderer';

interface TopicNotesProps {
  topicTitle: string;
  notes: string;
}

export function TopicNotes({ topicTitle, notes }: TopicNotesProps) {
  return (
    <details className="mt-6 rounded-xl border border-border/60">
      <summary className="cursor-pointer px-4 py-3 text-sm font-normal text-muted-foreground hover:text-foreground">
        참고 자료 — {topicTitle}
      </summary>
      <div className="border-t border-border/60 px-4 py-4">
        <MarkdownRenderer content={notes} />
      </div>
    </details>
  );
}
