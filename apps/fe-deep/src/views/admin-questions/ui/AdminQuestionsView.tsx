import { Suspense } from 'react';
import { QuestionsListPage } from './QuestionsListPage';

export function AdminQuestionsView() {
  return (
    <Suspense fallback={null}>
      <QuestionsListPage />
    </Suspense>
  );
}
