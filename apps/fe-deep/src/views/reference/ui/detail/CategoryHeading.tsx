import type { Category } from '@entities/question';

interface CategoryHeadingProps {
  category: Category;
  questionCount: number;
}

export function CategoryHeading({ category, questionCount }: CategoryHeadingProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-2xl">{category.icon}</span>
        <h1 className="text-2xl font-bold tracking-tight">{category.title}</h1>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {category.description}
        {questionCount > 0 && <span className="ml-2 tabular-nums">({questionCount}개 질문)</span>}
      </p>
    </div>
  );
}
