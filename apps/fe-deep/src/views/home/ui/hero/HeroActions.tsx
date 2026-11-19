import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@shared/ui/Button';

export function HeroActions() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
      <Button size="lg" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300 h-12 px-6" asChild>
        <Link href="/reference">
          <BookOpen className="h-4 w-4" />
          레퍼런스
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="gap-2 h-12 px-6 hover:shadow-md transition-all duration-300"
        asChild
      >
        <Link href="/learn">
          <GraduationCap className="h-4 w-4" />
          학습 시작
        </Link>
      </Button>
    </div>
  );
}
