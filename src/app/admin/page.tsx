import { createServerSupabaseClient } from '@/shared/config/supabase/server';
import { getAllCategories } from '@/entities/question/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const categories = await getAllCategories(supabase);

  const totalQuestions = categories.reduce(
    (sum, c) => sum + (c.question_count ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 질문 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalQuestions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              카테고리 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">카테고리별 질문 수</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="flex items-center justify-between py-4">
                <span className="flex items-center gap-2 text-sm">
                  <span>{category.icon}</span>
                  {category.title}
                </span>
                <span className="text-sm font-semibold">
                  {category.question_count ?? 0}개
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
