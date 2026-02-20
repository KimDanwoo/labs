'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Badge } from '@/shared/ui/badge';
import { getAllCategories, getQuestionsByCategory } from '@/entities/question';
import type { Category } from '@/entities/question';
import { getProgressByCategory, getLocalProgress } from '@/entities/progress';
import { BookOpen, CheckCircle, Brain, Target } from 'lucide-react';

export default function ProgressPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    mastered: 0,
    learning: 0,
    unseen: 0,
  });
  const [categoryStats, setCategoryStats] = useState<
    Record<string, { mastered: number; learning: number; unseen: number }>
  >({});

  // 1) Load categories
  useEffect(() => {
    getAllCategories().then(setCategories);
  }, []);

  // 2) Once categories loaded, compute stats
  useEffect(() => {
    if (categories.length === 0) return;

    let cancelled = false;

    async function computeStats() {
      // Fetch questions per category in parallel
      const results = await Promise.all(
        categories.map(async (cat) => {
          const questions = await getQuestionsByCategory(cat.id);
          return { catId: cat.id, questionIds: questions.map((q) => q.id) };
        })
      );

      if (cancelled) return;

      const allQuestionIds = results.flatMap((r) => r.questionIds);
      const progress = getLocalProgress();
      const entries = Object.values(progress);
      const mastered = entries.filter((p) => p.status === 'mastered').length;
      const learning = entries.filter((p) => p.status === 'learning').length;

      setTotalQuestions(allQuestionIds.length);
      setStats({
        total: allQuestionIds.length,
        mastered,
        learning,
        unseen: allQuestionIds.length - mastered - learning,
      });

      const catStats: Record<string, { mastered: number; learning: number; unseen: number }> = {};
      for (const r of results) {
        catStats[r.catId] = getProgressByCategory(r.questionIds);
      }
      setCategoryStats(catStats);
    }

    computeStats();
    return () => {
      cancelled = true;
    };
  }, [categories]);

  const overallPercent = stats.total > 0
    ? Math.round(((stats.mastered + stats.learning) / stats.total) * 100)
    : 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">학습 현황</h1>
      <p className="text-muted-foreground mb-8">전체 학습 진도를 확인하세요.</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">전체 문제</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.mastered}</div>
            <div className="text-xs text-muted-foreground">마스터</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Brain className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.learning}</div>
            <div className="text-xs text-muted-foreground">학습 중</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.unseen}</div>
            <div className="text-xs text-muted-foreground">미학습</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">전체 진도</span>
            <span className="text-sm text-muted-foreground">{overallPercent}%</span>
          </div>
          <Progress value={overallPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* Category Progress */}
      <h2 className="text-xl font-bold mb-4">카테고리별 진도</h2>
      <div className="space-y-3">
        {categories.map((cat) => {
          const cs = categoryStats[cat.id] ?? { mastered: 0, learning: 0, unseen: 0 };
          const total = cs.mastered + cs.learning + cs.unseen;
          const percent = total > 0
            ? Math.round(((cs.mastered + cs.learning) / total) * 100)
            : 0;

          return (
            <Card key={cat.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {cat.title}
                      </span>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <Badge variant="outline" className="text-xs text-green-500">
                          {cs.mastered}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-yellow-500">
                          {cs.learning}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <Progress value={percent} className="h-1.5 mt-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
