export const revalidate = 86400;

import Link from 'next/link';
import { Button } from '@shared/ui';
import { getAllCategories } from '@entities/question';
import { createServerSupabaseClient } from '@shared/config/supabase/server';
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const categories = await getAllCategories(supabase);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="hero-gradient absolute inset-0" />
        <div className="noise-overlay absolute inset-0" />
        <div className="container relative z-10 mx-auto max-w-7xl px-4 py-16 sm:py-24 md:py-32">
          <div className="flex flex-col items-center text-center gap-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              프론트엔드 학습 플랫폼
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter">
              프<span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">딥</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              프론트엔드를 <span className="text-foreground font-medium">딥하게</span> 알자
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/reference">
                <Button size="lg" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300 h-12 px-6">
                  <BookOpen className="h-4 w-4" />
                  레퍼런스
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/learn/flashcard">
                <Button size="lg" variant="outline" className="gap-2 h-12 px-6 hover:shadow-md transition-all duration-300">
                  <GraduationCap className="h-4 w-4" />
                  학습 시작
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-xl font-semibold mb-2">학습 카테고리</h2>
          <p className="text-sm text-muted-foreground">관심 있는 주제를 선택해 학습을 시작하세요</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5 stagger-children">
          {categories.map((category) => (
            <Link key={category.id} href={`/reference/${category.slug}`}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all duration-200">
                <span className="text-base">{category.icon}</span>
                {category.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
