import { AppHeader } from '@widgets/app-header/ui';

const ARTICLES = [
  {
    title: '제1조 (목적)',
    body: '본 약관은 gymlog(이하 "서비스")의 이용 조건과 절차, 이용자와 운영자의 권리·의무를 정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (서비스 내용)',
    body: '서비스는 운동 루틴 추천·기록·통계 기능을 제공합니다. 운영자는 서비스의 내용을 변경하거나 중단할 수 있습니다.',
  },
  {
    title: '제3조 (계정)',
    body: 'Google 계정으로 로그인해 클라우드에 기록을 저장할 수 있습니다. 비회원은 기기 로컬 저장만 사용합니다.',
  },
  { title: '제4조 (이용자의 의무)', body: '이용자는 타인의 정보를 도용하거나 서비스를 부정하게 이용해서는 안 됩니다.' },
  {
    title: '제5조 (데이터와 백업)',
    body: '로그인 시 기록은 클라우드에 저장됩니다. 비회원의 데이터는 기기에만 저장되어 캐시 삭제 등으로 유실될 수 있습니다.',
  },
  {
    title: '제6조 (회원 탈퇴)',
    body: '설정에서 언제든 탈퇴할 수 있으며, 탈퇴 시 계정과 클라우드에 저장된 데이터가 영구 삭제됩니다.',
  },
  {
    title: '제7조 (면책)',
    body: '서비스는 운동을 돕는 보조 도구이며 의학적 조언이 아닙니다. 운동에 따른 부상 등의 책임은 이용자에게 있으며, 필요 시 전문가와 상담하시기 바랍니다.',
  },
  {
    title: '제8조 (약관의 변경)',
    body: '운영자는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 서비스 내에 공지합니다.',
  },
];

export function TermsView() {
  return (
    <>
      <AppHeader title="이용약관" />
      <main className="mx-auto flex w-full max-w-mobile flex-col gap-lg px-lg pb-3xl pt-lg">
        <p className="rounded-lg border border-warning bg-glass p-md text-xs text-muted-foreground">
          ⚠️ 아래는 예시 초안입니다. 실제 서비스 공개 전 법률 전문가의 검토·보완이 필요합니다.
        </p>
        {ARTICLES.map((article) => (
          <section key={article.title} className="flex flex-col gap-xs">
            <h2 className="text-base font-semibold text-foreground">{article.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{article.body}</p>
          </section>
        ))}
      </main>
    </>
  );
}
