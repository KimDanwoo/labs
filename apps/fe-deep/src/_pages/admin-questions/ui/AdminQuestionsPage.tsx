'use client';
import { Suspense } from 'react';

import { QuestionsListPage } from './QuestionsListPage';

export function AdminQuestionsPage() {
  return (
    <Suspense fallback={null}>
      <QuestionsListPage />
    </Suspense>
  );
}
