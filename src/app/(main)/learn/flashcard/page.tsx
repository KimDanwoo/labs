'use client';

import { useState, useEffect } from 'react';
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
import { MarkdownRenderer } from '@/shared/ui/markdown-renderer';
import { DifficultyBadge } from '@/entities/question/ui/difficulty-badge';
import { getAllCategories, getRandomQuestions } from '@/entities/question';
import type { Category, Question } from '@/entities/question';
import { updateQuestionProgress } from '@/entities/progress';
import {
  Check,
  X,
  SkipForward,
  RotateCcw,
  ArrowRight,
  Shuffle,
  Loader2,
  Send,
} from 'lucide-react';
import type { FlashcardResult } from '@/entities/progress';

type Phase = 'setup' | 'study' | 'result';

export default function FlashcardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [studyQuestions, setStudyQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    feedback: string;
    passed: boolean;
  } | null>(null);
  const [evaluateError, setEvaluateError] = useState<string | null>(null);

  useEffect(() => {
    getAllCategories().then((cats) => {
      setCategories(cats);
      setIsLoading(false);
    });
  }, []);

  const startStudy = async () => {
    const qs =
      selectedCategory === 'all'
        ? await getRandomQuestions(questionCount)
        : await getRandomQuestions(questionCount, selectedCategory);
    setStudyQuestions(qs);
    setCurrentIndex(0);
    setResults([]);
    setIsFlipped(false);
    setUserAnswer('');
    setIsEvaluating(false);
    setEvaluation(null);
    setEvaluateError(null);
    setPhase('study');
  };

  const currentQuestion = studyQuestions[currentIndex];
  const progressPercent = studyQuestions.length > 0
    ? ((currentIndex) / studyQuestions.length) * 100
    : 0;

  const handleAnswer = (knew: boolean) => {
    if (!currentQuestion) return;
    updateQuestionProgress(currentQuestion.id, knew);
    const newResults = [...results, { questionId: currentQuestion.id, knew }];
    setResults(newResults);

    if (currentIndex + 1 < studyQuestions.length) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setUserAnswer('');
      setEvaluation(null);
      setEvaluateError(null);
    } else {
      setPhase('result');
    }
  };

  const handleSkip = () => {
    if (currentIndex + 1 < studyQuestions.length) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setUserAnswer('');
      setEvaluation(null);
      setEvaluateError(null);
    } else {
      setPhase('result');
    }
  };

  const handleEvaluate = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    setIsEvaluating(true);
    setEvaluateError(null);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          correctAnswer: currentQuestion.answer,
          userAnswer: userAnswer.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `평가 요청 실패 (${res.status})`);
      }

      const data: { score: number; feedback: string; passed: boolean } =
        await res.json();
      setEvaluation(data);
      setIsFlipped(true);

      updateQuestionProgress(currentQuestion.id, data.passed);
      setResults((prev) => [
        ...prev,
        { questionId: currentQuestion.id, knew: data.passed },
      ]);
    } catch (err) {
      setEvaluateError(
        err instanceof Error ? err.message : 'AI 평가 중 오류가 발생했습니다.',
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextAfterEvaluation = () => {
    if (currentIndex + 1 < studyQuestions.length) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setUserAnswer('');
      setEvaluation(null);
      setEvaluateError(null);
    } else {
      setPhase('result');
    }
  };

  const knewCount = results.filter((r) => r.knew).length;
  const didntKnowCount = results.filter((r) => !r.knew).length;

  if (phase === 'setup') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">플래시카드</h1>
        <p className="text-muted-foreground mb-8">
          카드를 뒤집어 답변을 확인하고 학습 진도를 관리하세요.
        </p>

        <Card className="p-6 space-y-6">
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

          <Button onClick={startStudy} size="lg" className="w-full gap-2" disabled={isLoading}>
            <Shuffle className="h-4 w-4" />
            학습 시작
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">학습 완료!</h1>
        <p className="text-muted-foreground mb-8">
          총 {results.length}문제를 학습했습니다.
        </p>

        <Card className="p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-green-500/10">
              <div className="text-3xl font-bold text-green-500">{knewCount}</div>
              <div className="text-sm text-muted-foreground mt-1">알겠음</div>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10">
              <div className="text-3xl font-bold text-red-500">{didntKnowCount}</div>
              <div className="text-sm text-muted-foreground mt-1">모르겠음</div>
            </div>
          </div>
          {results.length > 0 && (
            <div className="mt-4">
              <Progress
                value={(knewCount / results.length) * 100}
                className="h-3"
              />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                정답률: {Math.round((knewCount / results.length) * 100)}%
              </p>
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button onClick={startStudy} className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" />
            다시 학습
          </Button>
          <Button
            variant="outline"
            onClick={() => setPhase('setup')}
            className="flex-1 gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            설정으로
          </Button>
        </div>
      </div>
    );
  }

  // Study phase
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {studyQuestions.length}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setPhase('setup')}>
            종료
          </Button>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            className="min-h-[300px] p-6 cursor-pointer relative"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="flex items-center gap-2 mb-4">
              <DifficultyBadge difficulty={currentQuestion?.difficulty ?? 'easy'} />
              {currentQuestion?.sub_category && (
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.sub_category}
                </Badge>
              )}
            </div>

            {!isFlipped ? (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <p className="text-lg font-medium text-center leading-relaxed">
                  {currentQuestion?.question}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  탭하여 답변 보기
                </p>
              </div>
            ) : (
              <div className="min-h-[200px]">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {currentQuestion?.question}
                </p>
                <div className="border-t pt-3">
                  <MarkdownRenderer content={currentQuestion?.answer ?? ''} />
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* AI 평가 결과 */}
      {evaluation && (
        <Card className="mt-4 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">점수</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    evaluation.score >= 70 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${evaluation.score}%` }}
                />
              </div>
              <span
                className={`text-lg font-bold ${
                  evaluation.score >= 70 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {evaluation.score}점
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
            <Badge variant={evaluation.passed ? 'default' : 'secondary'}>
              {evaluation.passed ? '학습 완료' : '학습 중'}
            </Badge>
          </div>
        </Card>
      )}

      {/* AI 평가 에러 */}
      {evaluateError && (
        <Card className="mt-4 p-4 border-red-500/30">
          <p className="text-sm text-red-500">{evaluateError}</p>
        </Card>
      )}

      {/* 답변 입력 + AI 평가 (평가 전에만 표시) */}
      {!evaluation && (
        <div className="mt-4 space-y-2">
          <textarea
            className="w-full min-h-[100px] p-3 rounded-lg border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="답변을 직접 입력해보세요..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isEvaluating}
          />
          <Button
            onClick={handleEvaluate}
            disabled={!userAnswer.trim() || isEvaluating}
            className="w-full gap-2"
          >
            {isEvaluating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isEvaluating ? 'AI 평가 중...' : 'AI 평가'}
          </Button>
        </div>
      )}

      {/* 평가 후: 다음 문제 버튼 */}
      {evaluation ? (
        <div className="flex items-center gap-3 mt-4">
          <Button
            size="lg"
            className="flex-1 gap-2"
            onClick={handleNextAfterEvaluation}
          >
            <ArrowRight className="h-4 w-4" />
            {currentIndex + 1 < studyQuestions.length ? '다음 문제' : '결과 보기'}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 mt-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
            onClick={() => handleAnswer(false)}
          >
            <X className="h-4 w-4" />
            모르겠음
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleSkip}
            className="gap-2"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2 border-green-500/30 text-green-500 hover:bg-green-500/10"
            onClick={() => handleAnswer(true)}
          >
            <Check className="h-4 w-4" />
            알겠음
          </Button>
        </div>
      )}
    </div>
  );
}
