'use client';

import Link from 'next/link';

import { GuideScreen } from './ui';

export function BasicGuideView() {
  return (
    <div className="w-full h-dvh flex flex-col bg-background overflow-hidden">
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground/80"
      >
        ←
      </Link>
      <GuideScreen imageSrc="/form_step_1.png" href="/input/form" />
    </div>
  );
}
