'use client';

import { Card } from '@shared/ui/Card';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { CARD_SLIDE_MOTION } from '../../config/motion';
import { useStudySessionContext } from '../../model/hooks/useStudySessionContext';
import { StudySessionContext } from '../../model/store/studySessionContext';

interface StudySessionCardProps {
  children: ReactNode;
}

export function StudySessionCard({ children }: StudySessionCardProps) {
  const session = useStudySessionContext();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={`${session.currentIndex}-${session.stepIndex}`} {...CARD_SLIDE_MOTION}>
        {/* AnimatePresence keeps the leaving card's element as rendered, so this provider pins its step while it exits. */}
        <StudySessionContext.Provider value={session}>
          <Card className="min-h-[300px] p-6 relative shadow-sm">{children}</Card>
        </StudySessionContext.Provider>
      </motion.div>
    </AnimatePresence>
  );
}
