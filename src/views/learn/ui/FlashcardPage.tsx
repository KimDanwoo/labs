'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer';
import { DifficultyBadge } from '@/entities/question/ui/DifficultyBadge';
import { getAllCategories, getRandomQuestions, getQuestionsByIds } from '@/entities/question';
import type { Category, Question } from '@/entities/question';
import {
  getDueCardIds,
  getDueCardCount,
  getLocalProgress,
  RATING_CONFIG,
} from '@/entities/progress';
import { shuffleArray } from '@/shared/lib/shuffle';
import { useCardStudySession } from '../model';
import {
  RotateCcw,
  ArrowRight,
  Shuffle,
  Clock,
  Brain,
  Eye,
} from 'lucide-react';

type Phase = 'setup' | 'study' | 'result';
type StudyMode = 'review' | 'new' | 'mixed';

export function FlashcardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [studyMode, setStudyMode] = useState<StudyMode>('review');
  const [studyQuestions, setStudyQuestions] = useState<Question[]>([]);
  const [dueCount, setDueCount] = useState(0);

  const onComplete = useCallback(() => {
    setPhase('result');
  }, []);

  const {
    currentIndex,
    currentQuestion,
    isFlipped,
    setIsFlipped,
    results,
    progressPercent,
    isNewCard,
    currentProgress,
    resultCounts,
    handleRate,
    resetStudy,
  } = useCardStudySession({ questions: studyQuestions, phase, onComplete });

  useEffect(() => {
    getAllCategories().then((cats) => {
      setCategories(cats);
      setDueCount(getDueCardCount());
    }).catch(() => {}).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const startStudy = async () => {
    let questions: Question[] = [];

    if (studyMode === 'review') {
      const dueIds = getDueCardIds();
      if (dueIds.length > 0) {
        const sliced = dueIds.slice(0, questionCount);
        questions = await getQuestionsByIds(sliced);
        questions = shuffleArray(questions);
      }
    } else if (studyMode === 'new') {
      questions = selectedCategory === 'all'
        ? await getRandomQuestions(questionCount * 2)
        : await getRandomQuestions(questionCount * 2, selectedCategory);
      const allProgress = getLocalProgress();
      questions = questions
        .filter((q) => !allProgress[q.id])
        .slice(0, questionCount);
    } else {
      const dueIds = getDueCardIds();
      const dueQuestions = dueIds.length > 0
        ? await getQuestionsByIds(dueIds.slice(0, Math.ceil(questionCount / 2)))
        : [];

      const remaining = questionCount - dueQuestions.length;
      let newQuestions: Question[] = [];
      if (remaining > 0) {
        const candidates = selectedCategory === 'all'
          ? await getRandomQuestions(remaining * 2)
          : await getRandomQuestions(remaining * 2, selectedCategory);
        const allProgress = getLocalProgress();
        newQuestions = candidates
          .filter((q) => !allProgress[q.id])
          .slice(0, remaining);
      }

      questions = shuffleArray([...dueQuestions, ...newQuestions]);
    }

    if (questions.length === 0) return;

    setStudyQuestions(questions);
    resetStudy();
    setPhase('study');
  };

  /** "다시" 카드만 모아 즉시 재학습 */
  const retryFailedCards = () => {
    const failedIds = new Set(
      results.filter((r) => r.rating === 'again').map((r) => r.questionId),
    );
    const failedQuestions = studyQuestions.filter((q) => failedIds.has(q.id));
    if (failedQuestions.length === 0) return;

    setStudyQuestions(shuffleArray(failedQuestions));
    resetStudy();
    setPhase('study');
  };

  // ==================== SETUP ====================
  if (phase === 'setup') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">플래시카드</h1>
        <p className="text-muted-foreground mb-8">
          간격 반복으로 장기 기억에 남기세요.
        </p>

        {dueCount > 0 && (
          <Card className="p-4 mb-6 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  오늘 복습할 카드가 {dueCount}개 있습니다
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  복습 카드를 먼저 학습하면 기억 유지에 효과적입니다.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">학습 모드</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={studyMode === 'review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudyMode('review')}
                className="gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                복습
                {dueCount > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1 px-1.5">
                    {dueCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant={studyMode === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudyMode('new')}
                className="gap-1.5"
              >
                <Brain className="h-3.5 w-3.5" />
                새 카드
              </Button>
              <Button
                variant={studyMode === 'mixed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudyMode('mixed')}
                className="gap-1.5"
              >
                <Shuffle className="h-3.5 w-3.5" />
                혼합
              </Button>
            </div>
          </div>

          {studyMode !== 'review' && (
            <div>
              <label className="text-sm font-medium mb-2 block">카테고리</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? '카테고리 불러오는 중...' : '카테고리 선택'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.icon} {cat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">문제 수</label>
            <div className="flex gap-2">
              {[5, 10, 20, 30].map((n) => (
                <Button
                  key={n}
                  variant={questionCount === n ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuestionCount(n)}
                >
                  {n}문제
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={startStudy}
            size="lg"
            className="w-full gap-2"
            disabled={isLoading || (studyMode === 'review' && dueCount === 0)}
          >
            <Shuffle className="h-4 w-4" />
            {studyMode === 'review' ? '복습 시작' : '학습 시작'}
          </Button>

          {studyMode === 'review' && dueCount === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              오늘 복습할 카드가 없습니다. 새 카드를 학습해보세요.
            </p>
          )}
        </Card>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>학습 방법:</strong> 질문을 보고 머릿속으로 답을 떠올린 뒤 카드를 뒤집으세요.
            정답과 비교해서 얼마나 잘 기억했는지 평가하면, 시스템이 최적의 복습 시점을 자동으로 계산합니다.
          </p>
        </div>
      </div>
    );
  }

  // ==================== RESULT ====================
  if (phase === 'result') {
    const newDueCount = getDueCardCount();

    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">학습 완료!</h1>
        <p className="text-muted-foreground mb-8">
          총 {results.length}문제를 학습했습니다.
        </p>

        <Card className="p-6 mb-6">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-red-500/10">
              <div className="text-2xl font-bold text-red-500">{resultCounts.again}</div>
              <div className="text-xs text-muted-foreground mt-1">다시</div>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10">
              <div className="text-2xl font-bold text-orange-500">{resultCounts.hard}</div>
              <div className="text-xs text-muted-foreground mt-1">어려움</div>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <div className="text-2xl font-bold text-green-500">{resultCounts.good}</div>
              <div className="text-xs text-muted-foreground mt-1">좋음</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <div className="text-2xl font-bold text-blue-500">{resultCounts.easy}</div>
              <div className="text-xs text-muted-foreground mt-1">쉬움</div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="mt-4">
              <Progress
                value={((resultCounts.good + resultCounts.easy) / results.length) * 100}
                className="h-3"
              />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                정답률: {Math.round(((resultCounts.good + resultCounts.easy) / results.length) * 100)}%
              </p>
            </div>
          )}

          {resultCounts.again > 0 && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              &quot;다시&quot;로 표시한 {resultCounts.again}개 카드는 내일 다시 나타납니다.
            </p>
          )}
        </Card>

        {newDueCount > 0 && (
          <Card className="p-4 mb-6 border-yellow-500/30 bg-yellow-500/5">
            <p className="text-sm text-center">
              아직 복습할 카드가 <strong>{newDueCount}개</strong> 남아있습니다.
            </p>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {resultCounts.again > 0 && (
            <Button
              onClick={retryFailedCards}
              variant="outline"
              size="lg"
              className="w-full gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <RotateCcw className="h-4 w-4" />
              틀린 {resultCounts.again}개 다시 학습
            </Button>
          )}
          <div className="flex gap-3">
            <Button onClick={startStudy} className="flex-1 gap-2">
              <RotateCcw className="h-4 w-4" />
              다시 학습
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDueCount(getDueCardCount());
                setPhase('setup');
              }}
              className="flex-1 gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              설정으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STUDY ====================
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {studyQuestions.length}
            </span>
            {isNewCard && (
              <Badge variant="secondary" className="text-xs">NEW</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isFlipped && (
              <span className="text-xs text-muted-foreground">
                Space로 뒤집기
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => {
              setDueCount(getDueCardCount());
              setPhase('setup');
            }}>
              종료
            </Button>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="min-h-[300px] p-6 relative">
            {/* Meta */}
            <div className="flex items-center gap-2 mb-4">
              <DifficultyBadge difficulty={currentQuestion?.difficulty ?? 'easy'} />
              {currentQuestion?.sub_category && (
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.sub_category}
                </Badge>
              )}
              {currentProgress && (
                <span className="text-xs text-muted-foreground ml-auto">
                  간격: {currentProgress.interval}일
                </span>
              )}
            </div>

            {/* Question (always visible) */}
            <div className="flex flex-col items-center justify-center min-h-[120px] mb-4">
              <p className="text-lg font-medium text-center leading-relaxed">
                {currentQuestion?.question}
              </p>
            </div>

            {/* Answer or prompt */}
            {!isFlipped ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  먼저 답을 떠올려 보세요
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsFlipped(true)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  답변 확인
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="border-t pt-4">
                  <MarkdownRenderer content={currentQuestion?.answer ?? ''} />
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Rating buttons (only when flipped) */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.1 }}
          className="mt-4"
        >
          <p className="text-xs text-muted-foreground text-center mb-3">
            얼마나 잘 기억했나요? (키보드: 1~4)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {RATING_CONFIG.map(({ rating, label, color, bgColor }, i) => (
              <Button
                key={rating}
                variant="outline"
                size="lg"
                className={`flex-col h-auto py-3 gap-1 ${color} ${bgColor}`}
                onClick={() => handleRate(rating)}
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs opacity-60">{i + 1}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
