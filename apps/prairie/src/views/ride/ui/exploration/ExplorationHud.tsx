'use client';

import { CourseRetry } from '@views/ride/ui/exploration/hud/CourseRetry';
import { CourseStatus } from '@views/ride/ui/exploration/hud/CourseStatus';
import { ExplorationJournal } from '@views/ride/ui/exploration/hud/ExplorationJournal';
import { ExplorationNotice } from '@views/ride/ui/exploration/hud/ExplorationNotice';
import { JournalToggle } from '@views/ride/ui/exploration/hud/JournalToggle';
import { useState } from 'react';

export function ExplorationHud() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <section
      className="absolute left-4 top-24 max-w-[min(340px,calc(100vw-2rem))] text-prairie-paper sm:left-8"
      aria-label="초원 탐험"
    >
      <JournalToggle isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      {isOpen && <ExplorationJournal />}
      <CourseStatus />
      <CourseRetry />
      <ExplorationNotice />
    </section>
  );
}
