import type { ReactNode } from 'react';

import type { useStudySessionContext } from '@views/learn/model/hooks/useStudySessionContext';
import { StudySessionContext } from '@views/learn/model/store/studySessionContext';

interface SessionSnapshotProviderProps {
  session: ReturnType<typeof useStudySessionContext>;
  children: ReactNode;
}

export function SessionSnapshotProvider({ session, children }: SessionSnapshotProviderProps) {
  return <StudySessionContext.Provider value={session}>{children}</StudySessionContext.Provider>;
}
