'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Question, Category } from '@/entities/question/model';
import type { QuestionInput } from '@/entities/question/model';
import { createQuestion, updateQuestion } from '@/entities/question/services';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer';

interface QuestionFormProps {
  categories: Category[];
  question?: Question;
}

export function QuestionForm({ categories, question }: QuestionFormProps) {
  const router = useRouter();
  const isEdit = !!question;

  const [form, setForm] = useState({
    question: question?.question ?? '',
    answer: question?.answer ?? '',
    category_id: question?.category_id ?? categories[0]?.id ?? '',
    sub_category: question?.sub_category ?? '',
    difficulty: question?.difficulty ?? ('medium' as const),
    tags: question?.tags ?? ([] as string[]),
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setField('tags', [...form.tags, tag]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setField(
      'tags',
      form.tags.filter((t) => t !== tag)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      alert('질문과 답변을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const input: QuestionInput = {
        question: form.question,
        answer: form.answer,
        category_id: form.category_id,
        sub_category: form.sub_category,
        difficulty: form.difficulty,
        tags: form.tags,
      };
      if (isEdit) {
        await updateQuestion(question.id, input);
      } else {
        await createQuestion(input);
      }
      router.push('/admin/questions');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">카테고리</label>
          <Select
            value={form.category_id}
            onValueChange={(v) => setField('category_id', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">난이도</label>
          <Select
            value={form.difficulty}
            onValueChange={(v) =>
              setField('difficulty', v as 'easy' | 'medium' | 'hard')
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">소분류 (sub_category)</label>
        <Input
          value={form.sub_category}
          onChange={(e) => setField('sub_category', e.target.value)}
          placeholder="예: React Hooks"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">질문</label>
        <textarea
          value={form.question}
          onChange={(e) => setField('question', e.target.value)}
          rows={2}
          className="border-input dark:bg-input/30 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          placeholder="면접 질문을 입력하세요"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">답변 (Markdown)</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((p) => !p)}
          >
            {showPreview ? '편집' : '미리보기'}
          </Button>
        </div>
        {showPreview ? (
          <div className="border rounded-md p-4 min-h-[200px]">
            <MarkdownRenderer content={form.answer} />
          </div>
        ) : (
          <textarea
            value={form.answer}
            onChange={(e) => setField('answer', e.target.value)}
            rows={12}
            className="border-input dark:bg-input/30 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] font-mono"
            placeholder="마크다운 형식으로 답변을 작성하세요"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">태그</label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="태그 입력 후 Enter"
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            추가
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {form.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                {tag} &times;
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? '저장 중...' : isEdit ? '수정' : '추가'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/questions')}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
