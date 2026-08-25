'use client';

import { getCurrentStreak } from '@entities/progress';
import {
  type Category,
  getAllCategories,
  getAllQuestions,
  getQuestionsByCategorySlug,
  type Question,
} from '@entities/question';
import { shuffleArray } from '@shared/lib/shuffle';
import { Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { ArrowDownAZ, Flame, Shuffle, Trophy, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useCardStudySession } from '../model';
import { StudyCardView } from './StudyCardView';

const STUDY_ORDER = { sequential: 'sequential', random: 'random' } as const;
type StudyOrder = keyof typeof STUDY_ORDER;

type Phase = 'setup' | 'loading' | 'study' | 'done';

export function LearnPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [order, setOrder] = useState<StudyOrder>(STUDY_ORDER.sequential);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [streak, setStreak] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);

  const onComplete = useCallback(() => {
    setStreak(getCurrentStreak());
    setPhase('done');
  }, []);

  const {
    currentIndex,
    currentQuestion,
    isFlipped,
    setIsFlipped,
    recallInput,
    setRecallInput,
    progressPercent,
    isNewCard,
    handleNext,
    resetStudy,
  } = useCardStudySession({ questions, phase, onComplete });

  useEffect(() => {
    getAllCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const startStudy = async () => {
    setPhase('loading');
    setIsEmpty(false);

    let loaded =
      selectedCategory === 'all' ? await getAllQuestions() : await getQuestionsByCategorySlug(selectedCategory);

    if (loaded.length === 0) {
      setIsEmpty(true);
      setPhase('setup');
      return;
    }

    if (order === STUDY_ORDER.random) {
      loaded = shuffleArray(loaded);
    } else {
      const categoryOrder = new Map(categories.map((cat) => [cat.id, cat.order_num]));
      loaded = [...loaded].sort(
        (a, b) =>
          (categoryOrder.get(a.category_id) ?? 0) - (categoryOrder.get(b.category_id) ?? 0) ||
          a.order_num - b.order_num,
      );
    }

    setQuestions(loaded);
    resetStudy();
    setPhase('study');
  };

  const backToSetup = () => {
    setQuestions([]);
    setPhase('setup');
  };

  // ==================== SETUP ====================
  if (phase === 'setup' || phase === 'loading') {
    return (
      <div className="container mx-auto max-w-[42rem] px-4 py-8 sm:py-12 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-2">학습</h1>
        <p className="text-muted-foreground mb-8">질문을 보고 답을 먼저 적어본 뒤, 모범 답변과 비교하세요.</p>

        <Card className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">카테고리</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? '카테고리 불러오는 중...' : '카테고리 선택'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.title}
                    {cat.question_count !== undefined && cat.question_count !== null && ` (${cat.question_count})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">순서</label>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant={order === STUDY_ORDER.sequential ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrder(STUDY_ORDER.sequential)}
                className="gap-1.5 transition-all duration-200"
              >
                <ArrowDownAZ className="h-3.5 w-3.5" />
                순서대로
              </Button>
              <Button
                variant={order === STUDY_ORDER.random ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrder(STUDY_ORDER.random)}
                className="gap-1.5 transition-all duration-200"
              >
                <Shuffle className="h-3.5 w-3.5" />
                무작위
              </Button>
            </div>
          </div>

          <Button
            onClick={startStudy}
            size="lg"
            className="w-full gap-2 h-12 shadow-md hover:shadow-lg transition-all duration-300"
            disabled={isLoading || phase === 'loading'}
          >
            {phase === 'loading' ? '문제 불러오는 중...' : '학습 시작'}
          </Button>

          {isEmpty && <p className="text-sm text-muted-foreground text-center">이 카테고리에는 문제가 없습니다.</p>}
        </Card>

        <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground/70">학습 방법:</strong> 답을 보기 전에 떠오르는 내용을 먼저 적어보세요.
            읽기만 하는 것보다 직접 인출해보는 쪽이 기억에 훨씬 오래 남습니다.
          </p>
        </div>
      </div>
    );
  }

  // ==================== DONE ====================
  if (phase === 'done') {
    return (
      <div className="container mx-auto max-w-[42rem] px-4 py-8 sm:py-12 animate-fade-in-up">
        <div className="text-center py-16">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-5" />
          <h1 className="text-3xl font-bold tracking-tight mb-3">학습 완료!</h1>
          <p className="text-muted-foreground mb-6">{questions.length}문제를 모두 학습했습니다.</p>

          {streak > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-4 py-2 mb-8">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-lg font-bold">{streak}일 연속 학습 중!</span>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={backToSetup} variant="outline" className="gap-2 shadow-sm">
              다시 학습하기
            </Button>
            <Link href="/mypage/progress">
              <Button variant="ghost" className="gap-2">
                학습 현황 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STUDY ====================
  return (
    <StudyCardView
      currentIndex={currentIndex}
      totalCount={questions.length}
      currentQuestion={currentQuestion}
      isFlipped={isFlipped}
      onFlip={() => setIsFlipped(true)}
      progressPercent={progressPercent}
      isNewCard={isNewCard}
      onNext={handleNext}
      recallInput={recallInput}
      onRecallChange={setRecallInput}
      headerAction={
        <Button variant="ghost" size="sm" onClick={backToSetup} className="gap-1 text-muted-foreground h-7 px-2">
          <X className="h-3.5 w-3.5" />
          종료
        </Button>
      }
    />
  );
}
