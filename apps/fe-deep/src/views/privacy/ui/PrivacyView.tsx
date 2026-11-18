import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  description: '프딥의 개인정보 처리방침입니다.',
};

export function PrivacyView() {
  return (
    <div className="container mx-auto max-w-[48rem] px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">개인정보 처리방침</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <p className="text-muted-foreground">시행일: 2026년 11월 18일 (이전 방침 시행일: 2026년 4월 27일)</p>

        <section>
          <h2 className="text-lg font-semibold mb-3">1. 수집하는 개인정보</h2>
          <p>프딥은 로그인 기능이 없으며, 이용자의 개인정보를 수집하지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. 학습 기록의 저장 위치</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>학습 진도, 북마크, 면접 학습 표시는 이용자의 브라우저(localStorage)에만 저장됩니다.</li>
            <li>이 정보는 프딥 서버로 전송되지 않으며, 다른 기기와 동기화되지 않습니다.</li>
            <li>브라우저의 사이트 데이터를 삭제하면 학습 기록도 함께 삭제되며 복구할 수 없습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. 이전에 수집한 정보의 파기</h2>
          <p>
            2026년 11월 18일 이전에 Google 로그인으로 수집한 계정 정보(이메일 주소, 프로필 이미지 URL, 표시 이름)와
            서버에 저장된 학습 기록은 로그인 기능 종료와 함께 서비스 데이터베이스에서 파기합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. 개인정보 보호를 위한 기술적 대책</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>모든 통신은 HTTPS를 통해 암호화됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. 문의처</h2>
          <p>개인정보 처리방침에 관한 문의는 아래 연락처로 문의해 주세요.</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>서비스명: 프딥</li>
            <li>이메일: support@fdeep.kr</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">6. 방침 변경에 관한 사항</h2>
          <p>
            본 개인정보 처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 본 페이지를 통해
            공지합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
