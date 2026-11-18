import type { Category } from '@entities/question';

import { styles } from './ReferenceDetailView.styles';

interface CategoryHeadingProps {
  category: Category;
  questionCount: number;
}

export function CategoryHeading({ category, questionCount }: CategoryHeadingProps) {
  return (
    <div className={styles.titleBlock}>
      <div className={styles.titleRow}>
        <span className={styles.categoryIcon}>{category.icon}</span>
        <h1 className={styles.title}>{category.title}</h1>
      </div>
      <p className={styles.description}>
        {category.description}
        {questionCount > 0 && <span className={styles.count}>({questionCount}개 질문)</span>}
      </p>
    </div>
  );
}
