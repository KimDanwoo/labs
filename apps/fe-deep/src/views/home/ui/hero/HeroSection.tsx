import type { ReactNode } from 'react';

interface HeroSectionProps {
  children: ReactNode;
}

export function HeroSection({ children }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="hero-gradient absolute inset-0" />
      <div className="noise-overlay absolute inset-0" />
      <div className="container relative z-10 mx-auto max-w-7xl px-4 py-16 sm:py-24 md:py-32">
        <div className="flex flex-col items-center text-center gap-6 animate-fade-in-up">{children}</div>
      </div>
    </section>
  );
}
