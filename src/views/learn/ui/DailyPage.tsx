'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer';
import { DifficultyBadge } from '@/entities/question/ui/DifficultyBadge';
import { getRandomQuestions, getQuestionsByIds } from '@/entities/question';
import type { Question } from '@/entities/question';
import {
  getDueCardIds,
  getLocalProgress,
  getCurrentStreak,
  RATING_CONFIG,
} from '@/entities/progress';
import { shuffleArray } from '@/shared/lib/shuffle';
import { useCardStudySession } from '../model';
import { isDailyDone, markDailyDone } from '../model';
import {
  Flame,
  Trophy,
  Eye,
  ArrowRight,
  Calendar,
} from 'lucide-react';

const DAILY_COUNT = 5;

type Phase = 'loading' | 'ready' | 'study' | 'done' | 'already-done';

export function DailyPage() {
  const alreadyDone = typeof window !== 'undefined' && isDailyDone();
  const [phase, setPhase] = useState<Phase>(() => alreadyDone ? 'already-done' : 'loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [streak, setStreak] = useState(() => alreadyDone ? getCurrentStreak() : 0);

  const onComplete = useCallback(() => {
    markDailyDone();
    setStreak(getCurrentStreak());
    setPhase('done');
  }, []);

  const {
    currentIndex,
    currentQuestion,
    isFlipped,
    setIsFlipped,
    results,
    progressPercent,
    isNewCard,
    resultCounts,
    handleRate,
  } = useCardStudySession({ questions, phase, onComplete });

  useEffect(() => {
    if (alreadyDone) return;

    async function loadDailyQuestions(): Promise<Question[]> {
      const dueIds = getDueCardIds();
      let selected: Question[] = [];

      if (dueIds.length > 0) {
        const dueQuestions = await getQuestionsByIds(dueIds.slice(0, DAILY_COUNT));
        selected = dueQuestions;
      }

      if (selected.length < DAILY_COUNT) {
        const remaining = DAILY_COUNT - selected.length;
        const candidates = await getRandomQuestions(remaining * 3);
        const existingIds = new Set(selected.map((q) => q.id));
        const allProgress = getLocalProgress();
        const newCards = candidates
          .filter((q) => !existingIds.has(q.id) && !allProgress[q.id])
          .slice(0, remaining);
        selected = [...selected, ...newCards];
      }

      return shuffleArray(selected);
    }

    loadDailyQuestions().then((qs) => {
      setQuestions(qs);
      setStreak(getCurrentStreak());
      setPhase('ready');
    }).catch(() => {
      setPhase('ready');
    });
  }, [alreadyDone]);

  // ==================== LOADING ====================
  if (phase === 'loading') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center text-muted-foreground py-12">
          오늘의 문제를 준비하고 있습니다...
        </div>
      </div>
    );
  }

  // ==================== ALREADY DONE ====================
  if (phase === 'already-done') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">오늘의 챌린지 완료!</h1>
          <p className="text-muted-foreground mb-6">
            오늘 학습을 이미 마쳤습니다. 내일 다시 도전하세요.
          </p>

          {streak > 0 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-xl font-bold">{streak}일 연속 학습 중!</span>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Link href="/learn/flashcard">
              <Button variant="outline" className="gap-2">
                플래시카드로 더 학습
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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

  // ==================== READY ====================
  if (phase === 'ready') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">오늘의 챌린지</h1>
        <p className="text-muted-foreground mb-8">
          매일 {DAILY_COUNT}문제, 꾸준히 실력을 쌓으세요.
        </p>

        <Card className="p-6 text-center">
          <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">
            오늘의 {questions.length}문제가 준비되었습니다
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            복습 카드와 새 카드가 혼합되어 있습니다.
          </p>

          {streak > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-medium">{streak}일 연속 학습 중</span>
            </div>
          )}

          <Button
            onClick={() => setPhase('study')}
            size="lg"
            className="gap-2"
            disabled={questions.length === 0}
          >
            시작하기
          </Button>

          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              학습할 문제가 없습니다. 먼저 레퍼런스에서 질문을 확인해보세요.
            </p>
          )}
        </Card>
      </div>
    );
  }

  // ==================== DONE ====================
  if (phase === 'done') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-6">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">챌린지 완료!</h1>

          {streak > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-xl font-bold">{streak}일 연속 학습!</span>
            </div>
          )}
        </div>

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
        </Card>

        <div className="flex gap-3">
          <Link href="/learn/flashcard" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              플래시카드로 더 학습
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/mypage/progress" className="flex-1">
            <Button variant="ghost" className="w-full gap-2">
              학습 현황 보기
            </Button>
          </Link>
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
              {currentIndex + 1} / {questions.length}
            </span>
            {isNewCard && (
              <Badge variant="secondary" className="text-xs">NEW</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {!isFlipped ? 'Space로 뒤집기' : '1~4로 평가'}
          </span>
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
            <div className="flex items-center gap-2 mb-4">
              <DifficultyBadge difficulty={currentQuestion?.difficulty ?? 'easy'} />
              {currentQuestion?.sub_category && (
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.sub_category}
                </Badge>
              )}
            </div>

            <div className="flex flex-col items-center justify-center min-h-[120px] mb-4">
              <p className="text-lg font-medium text-center leading-relaxed">
                {currentQuestion?.question}
              </p>
            </div>

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

      {/* Rating buttons */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.1 }}
          className="mt-4"
        >
          <p className="text-xs text-muted-foreground text-center mb-3">
            얼마나 잘 기억했나요?
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
