export const revalidate = 86400;

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { createClient } from '@supabase/supabase-js';
import { getAllCategories } from '@/entities/question';

export default async function ReferencePage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const categories = await getAllCategories(supabase);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <div className="mb-10 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-3">레퍼런스</h1>
        <p className="text-muted-foreground">
          카테고리별 프론트엔드 핵심 개념을 탐색하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {categories.map((category) => (
          <Link key={category.id} href={`/reference/${category.slug}`}>
            <Card className="card-hover hover:border-primary/30 cursor-pointer h-full group">
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors duration-200">
                  {category.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {category.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
