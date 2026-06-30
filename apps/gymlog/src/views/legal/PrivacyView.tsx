import { AppHeader } from '@widgets/app-header/ui';

const SECTIONS = [
  {
    title: '수집하는 항목',
    body: '로그인 시 Google 계정의 이메일과 고유 식별자(UID), 그리고 운동 기록·루틴·설정 정보를 수집합니다. 비회원은 기기 로컬에만 저장됩니다.',
  },
  { title: '이용 목적', body: '운동 기록 저장·기기 간 동기화, 통계와 루틴 추천 제공을 위해 사용합니다.' },
  {
    title: '보관과 파기',
    body: '회원 탈퇴 시 계정과 저장된 데이터를 즉시 삭제합니다. 비회원 데이터는 기기 로컬에만 보관됩니다.',
  },
  {
    title: '제3자 제공',
    body: '수집한 정보를 제3자에게 판매·제공하지 않습니다. 다만 저장·인증을 위해 Google Firebase를 사용합니다.',
  },
  {
    title: '이용자의 권리',
    body: '언제든 본인 데이터를 열람·수정·삭제할 수 있으며, 회원 탈퇴로 전체 삭제를 요청할 수 있습니다.',
  },
  { title: '문의', body: '개인정보 관련 문의는 운영자 연락처(추후 기입)로 접수할 수 있습니다.' },
];

export function PrivacyView() {
  return (
    <>
      <AppHeader title="개인정보처리방침" />
      <main className="mx-auto flex w-full max-w-content flex-col gap-lg px-lg pb-3xl pt-lg">
        <p className="rounded-lg border border-warning bg-glass p-md text-xs text-muted">
          ⚠️ 아래는 예시 초안입니다. 실제 서비스 공개 전 법률 전문가의 검토·보완이 필요합니다.
        </p>
        {SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-xs">
            <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
            <p className="text-sm leading-relaxed text-muted">{section.body}</p>
          </section>
        ))}
      </main>
    </>
  );
}
