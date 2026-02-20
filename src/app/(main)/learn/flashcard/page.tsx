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
    } else {
      setPhase('result');
    }
  };

  const handleSkip = () => {
    if (currentIndex + 1 < studyQuestions.length) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
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
    </div>
  );
}
