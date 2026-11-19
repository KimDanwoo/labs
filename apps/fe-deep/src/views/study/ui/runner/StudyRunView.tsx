'use client';

import { EMPTY_MESSAGES } from '../../config/filters';
import type { StudyDoc } from '../../lib/studyDoc';
import { useStudyRunView } from '../../model/hooks/useStudyRunView';
import { StudyFilterBar } from '../filter/StudyFilterBar';
import { StudyRunner } from './StudyRunner';

interface StudyRunViewProps {
  doc: StudyDoc;
}

export function StudyRunView({ doc }: StudyRunViewProps) {
  const view = useStudyRunView(doc);

  return (
    <div>
      <StudyFilterBar
        tiers={view.tiers}
        tierCounts={view.tierCounts}
        filter={view.filter}
        counts={view.counts}
        onToggleTier={view.handleToggleTier}
        onChangeFilter={view.handleChangeFilter}
      />
      {view.visibleTopics.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">{EMPTY_MESSAGES[view.filter]}</div>
      ) : (
        <StudyRunner
          key={view.runnerKey}
          docTitle={doc.title}
          topics={view.visibleTopics}
          understood={view.understood}
          review={view.review}
          onToggleUnderstood={view.handleToggleUnderstood}
          onToggleReview={view.handleToggleReview}
        />
      )}
    </div>
  );
}
