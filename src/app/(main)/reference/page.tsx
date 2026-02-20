export const revalidate = 86400;

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { getAllCategories } from '@/entities/question';
import { createServerSupabaseClient } from '@/shared/config/supabase/server';

export default async function ReferencePage() {
  const supabase = await createServerSupabaseClient();
  const categories = await getAllCategories(supabase);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">레퍼런스</h1>
        <p className="text-muted-foreground">
          카테고리별 프론트엔드 핵심 개념을 탐색하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/reference/${category.slug}`}>
            <Card className="hover:border-primary/50 transition-all hover:shadow-md cursor-pointer h-full group">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{category.icon}</span>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {category.title}
                </CardTitle>
                <CardDescription className="text-sm">
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
