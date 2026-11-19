import { PageTitle } from '@shared/ui/PageTitle';

export function ProgressIntro() {
  return (
    <>
      <PageTitle className="mb-2">학습 현황</PageTitle>
      <p className="text-muted-foreground mb-8">전체 학습 진도를 확인하세요.</p>
    </>
  );
}
