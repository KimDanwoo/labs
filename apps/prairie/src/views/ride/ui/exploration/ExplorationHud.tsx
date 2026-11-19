'use client';

import { useState } from 'react';
import { CourseRetry } from './hud/CourseRetry';
import { CourseStatus } from './hud/CourseStatus';
import { ExplorationJournal } from './hud/ExplorationJournal';
import { ExplorationNotice } from './hud/ExplorationNotice';
import { JournalToggle } from './hud/JournalToggle';

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
