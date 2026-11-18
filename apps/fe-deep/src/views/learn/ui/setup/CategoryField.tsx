import type { Category } from '@entities/question';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/Select';

import { ALL_CATEGORIES } from '../../model/constants/study';
import { styles } from './LearnSetup.styles';

interface CategoryFieldProps {
  categories: Category[];
  value: string;
  isLoading: boolean;
  onChange: (categorySlug: string) => void;
}

export function CategoryField({ categories, value, isLoading, onChange }: CategoryFieldProps) {
  return (
    <div>
      <label className={styles.fieldLabel}>카테고리</label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? '카테고리 불러오는 중...' : '카테고리 선택'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CATEGORIES}>전체 카테고리</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.slug}>
              {category.icon} {category.title}
              {category.question_count !== undefined &&
                category.question_count !== null &&
                ` (${category.question_count})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
