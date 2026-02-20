import { notFound } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { Menu } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getAllCategories, getCategoryBySlug, getQuestionsByCategorySlug } from '@/entities/question';
import { createServerSupabaseClient } from '@/shared/config/supabase/server';
import { CategorySidebar } from '../_components/category-sidebar';
import { QuestionAccordion } from '../_components/question-accordion';

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const categories = await getAllCategories(supabase);
  return categories.map((c) => ({ categorySlug: c.slug }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const supabase = await createServerSupabaseClient();

  const category = await getCategoryBySlug(categorySlug, supabase);
  if (!category) notFound();

  const questions = await getQuestionsByCategorySlug(categorySlug, supabase);
  const categories = await getAllCategories(supabase);

  return (
    <div className="container mx-auto max-w-7xl px-4 pt-6 pb-24">
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 border rounded-lg">
            <CategorySidebar categories={categories} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-6">
            {/* Mobile sidebar trigger */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">카테고리 목록</SheetTitle>
                <div className="pt-8">
                  <CategorySidebar categories={categories} />
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{category.icon}</span>
                <h1 className="text-2xl font-bold">{category.title}</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </div>
          </div>

          <QuestionAccordion questions={questions} />
        </div>
      </div>
    </div>
  );
}
