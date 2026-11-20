import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/Select';

import { ALL_CATEGORIES } from '@views/learn/model/constants/study';
import { useStudySetupContext } from '@views/learn/model/hooks/useStudySetupContext';
import { FieldLabel } from '@views/learn/ui/setup/FieldLabel';

export function StudySetupCategory() {
  const { categories, isLoadingCategories, settings, changeSettings } = useStudySetupContext();

  return (
    <div>
      <FieldLabel>카테고리</FieldLabel>
      <Select
        value={settings.categorySlug}
        onValueChange={(categorySlug) => changeSettings({ categorySlug })}
        disabled={isLoadingCategories}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoadingCategories ? '카테고리 불러오는 중...' : '카테고리 선택'} />
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
