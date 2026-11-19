import { Button } from '@shared/ui/Button';

import { useStudySetupContext } from '../../model/hooks/useStudySetupContext';

export function StudySetupStart() {
  const { isLoadingCategories, isStarting, isEmpty, start } = useStudySetupContext();

  return (
    <>
      <Button
        onClick={start}
        size="lg"
        className="w-full gap-2 h-12 shadow-md hover:shadow-lg transition-all duration-300"
        disabled={isLoadingCategories || isStarting}
      >
        {isStarting ? '문제 불러오는 중...' : '학습 시작'}
      </Button>
      {isEmpty && <p className="text-sm text-muted-foreground text-center">조건에 맞는 문제가 없습니다.</p>}
    </>
  );
}
