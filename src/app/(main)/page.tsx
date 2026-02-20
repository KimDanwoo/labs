export const revalidate = 86400;

import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { getAllCategories } from '@/entities/question';
import { createServerSupabaseClient } from '@/shared/config/supabase/server';
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const categories = await getAllCategories(supabase);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="flex flex-col items-center text-center gap-5">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              프<span className="text-primary">딥</span>
            </h1>
            <p className="text-muted-foreground">
              프론트엔드, 딥하게 알자
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/reference">
                <Button size="lg" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  레퍼런스
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/learn/flashcard">
                <Button size="lg" variant="outline" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  학습 시작
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-lg font-semibold text-center mb-6">학습 카테고리</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <Link key={category.id} href={`/reference/${category.slug}`}>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
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
