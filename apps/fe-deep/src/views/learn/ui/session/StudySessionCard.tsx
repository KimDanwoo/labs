'use client';

import { Card } from '@shared/ui/Card';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { CARD_SLIDE_MOTION } from '@views/learn/config/motion';
import { useStudySessionContext } from '@views/learn/model/hooks/useStudySessionContext';
import { SessionSnapshotProvider } from '@views/learn/ui/session/SessionSnapshotProvider';

interface StudySessionCardProps {
  children: ReactNode;
}

export function StudySessionCard({ children }: StudySessionCardProps) {
  const session = useStudySessionContext();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={`${session.currentIndex}-${session.stepIndex}`} {...CARD_SLIDE_MOTION}>
        <SessionSnapshotProvider session={session}>
          <Card className="min-h-[300px] p-6 relative shadow-sm">{children}</Card>
        </SessionSnapshotProvider>
      </motion.div>
    </AnimatePresence>
  );
}
