import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관',
  description: '프딥의 서비스 이용약관입니다.',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">이용약관</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <p className="text-muted-foreground">시행일: 2026년 4월 27일</p>

        <section>
          <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
          <p>
            본 약관은 프딥(이하 &quot;서비스&quot;)의 이용과 관련하여
            서비스 제공자와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제2조 (정의)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>&quot;서비스&quot;란 프딥이 제공하는 프론트엔드 면접 학습 플랫폼을 말합니다.</li>
            <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
            <li>&quot;회원&quot;이란 서비스에 로그인하여 계정을 생성한 이용자를 말합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제3조 (약관의 효력 및 변경)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>본 약관은 서비스 내 공지함으로써 효력이 발생합니다.</li>
            <li>서비스 제공자는 필요한 경우 약관을 변경할 수 있으며, 변경 시 본 페이지를 통해 공지합니다.</li>
            <li>변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제4조 (서비스의 제공)</h2>
          <p>서비스는 다음의 기능을 제공합니다.</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>프론트엔드 면접 질문 레퍼런스 열람</li>
            <li>플래시카드 기반 학습</li>
            <li>데일리 학습 및 진도 관리</li>
            <li>북마크 및 검색 기능</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제5조 (회원 가입 및 계정)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 가입은 Google OAuth를 통해 이루어집니다.</li>
            <li>로그인 시 본 약관 및 개인정보 처리방침에 동의한 것으로 간주합니다.</li>
            <li>회원은 자신의 계정 정보를 정확하게 유지해야 합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제6조 (회원 탈퇴 및 자격 제한)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원은 언제든지 마이페이지에서 회원 탈퇴를 요청할 수 있습니다.</li>
            <li>탈퇴 시 회원의 개인정보 및 학습 데이터는 즉시 삭제되며 복구할 수 없습니다.</li>
            <li>서비스 제공자는 다음의 경우 회원 자격을 제한할 수 있습니다:
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>서비스 운영을 고의로 방해한 경우</li>
                <li>타인의 정보를 도용한 경우</li>
                <li>관련 법령 또는 본 약관을 위반한 경우</li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제7조 (이용자의 의무)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>이용자는 서비스를 정상적인 목적으로만 이용해야 합니다.</li>
            <li>서비스 콘텐츠의 무단 복제, 배포, 상업적 이용을 금지합니다.</li>
            <li>서비스의 안정적 운영을 방해하는 행위를 금지합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제8조 (면책 조항)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스 제공자는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>이용자가 서비스를 통해 얻은 정보에 대한 최종 판단과 책임은 이용자에게 있습니다.</li>
            <li>서비스에서 제공하는 학습 콘텐츠는 참고 목적이며, 면접 결과를 보장하지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제9조 (분쟁 해결)</h2>
          <p>
            서비스 이용과 관련하여 분쟁이 발생한 경우, 서비스 제공자와
            이용자 간의 합의에 의해 해결하는 것을 원칙으로 합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
