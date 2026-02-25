'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Badge } from '@/shared/ui/badge';
import { getAllCategories, getAllQuestions } from '@/entities/question';
import type { Category } from '@/entities/question';
import { getProgressByCategory, getLocalProgress, getStudyHeatmap, getCurrentStreak, getDueCardCount } from '@/entities/progress';
import { BookOpen, CheckCircle, Brain, Target, Flame, Clock } from 'lucide-react';
import { StudyHeatmap } from './StudyHeatmap';

export function ProgressPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    mastered: 0,
    learning: 0,
    unseen: 0,
  });
  const [categoryStats, setCategoryStats] = useState<
    Record<string, { mastered: number; learning: number; unseen: number }>
  >({});
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // localStorage를 한 번만 파싱하여 heatmap, streak, dueCount, 카테고리 통계에 공유한다.
      const progress = getLocalProgress();
      const hm = getStudyHeatmap(progress);
      setHeatmap(hm);
      setStreak(getCurrentStreak(hm));
      setDueCount(getDueCardCount(progress));

      const [cats, allQuestions] = await Promise.all([
        getAllCategories(),
        getAllQuestions(),
      ]);
      if (cancelled) return;
      setCategories(cats);

      // 카테고리별 질문 ID를 한 번의 순회로 그룹핑 (N+1 쿼리 제거)
      const questionIdsByCategory = new Map<string, string[]>();
      for (const q of allQuestions) {
        const ids = questionIdsByCategory.get(q.category_id);
        if (ids) {
          ids.push(q.id);
        } else {
          questionIdsByCategory.set(q.category_id, [q.id]);
        }
      }

      const totalQuestions = allQuestions.length;
      let mastered = 0;
      let learning = 0;
      for (const p of Object.values(progress)) {
        if (p.status === 'mastered') mastered++;
        else if (p.status === 'learning') learning++;
      }

      setStats({
        total: totalQuestions,
        mastered,
        learning,
        unseen: totalQuestions - mastered - learning,
      });

      const catStats: Record<string, { mastered: number; learning: number; unseen: number }> = {};
      for (const cat of cats) {
        const questionIds = questionIdsByCategory.get(cat.id) ?? [];
        catStats[cat.id] = getProgressByCategory(questionIds, progress);
      }
      setCategoryStats(catStats);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const overallPercent = stats.total > 0
    ? Math.round(((stats.mastered + stats.learning) / stats.total) * 100)
    : 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">학습 현황</h1>
      <p className="text-muted-foreground mb-8">전체 학습 진도를 확인하세요.</p>

      {/* Streak & Due */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500 shrink-0" />
            <div>
              <div className="text-2xl font-bold">{streak}일</div>
              <div className="text-xs text-muted-foreground">연속 학습</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500 shrink-0" />
            <div>
              <div className="text-2xl font-bold">{dueCount}개</div>
              <div className="text-xs text-muted-foreground">오늘 복습 대기</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Heatmap */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-sm font-medium mb-4">학습 기록</h2>
          <StudyHeatmap heatmap={heatmap} />
        </CardContent>
      </Card>

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

