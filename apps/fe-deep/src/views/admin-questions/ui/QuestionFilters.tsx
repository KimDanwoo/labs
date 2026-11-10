'use client';

import { DIFFICULTY_VALUES, type Category } from '@entities/question';
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/react';
import { DIFFICULTY_FILTER_LABEL, FILTER_ALL } from '../config/questionList';

interface QuestionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  difficultyFilter: string;
  onDifficultyFilterChange: (value: string) => void;
  categories: Category[];
}

export function QuestionFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
  categories,
}: QuestionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="질문 검색..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-[20rem]"
      />
      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>전체 카테고리</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.icon} {c.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={difficultyFilter} onValueChange={onDifficultyFilterChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="난이도" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>전체</SelectItem>
          {DIFFICULTY_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {DIFFICULTY_FILTER_LABEL[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
