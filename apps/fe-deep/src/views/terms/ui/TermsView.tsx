import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관',
  description: '프딥의 서비스 이용약관입니다.',
};

export function TermsView() {
  return (
    <div className="container mx-auto max-w-[48rem] px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">이용약관</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <p className="text-muted-foreground">시행일: 2026년 11월 18일 (이전 약관 시행일: 2026년 4월 27일)</p>

        <section>
          <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
          <p>
            본 약관은 프딥(이하 &quot;서비스&quot;)의 이용과 관련하여 서비스 제공자와 이용자 간의 권리, 의무 및 책임
            사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제2조 (정의)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>&quot;서비스&quot;란 프딥이 제공하는 프론트엔드 면접 학습 플랫폼을 말합니다.</li>
            <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제3조 (약관의 효력 및 변경)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>본 약관은 서비스 내 공지함으로써 효력이 발생합니다.</li>
            <li>서비스 제공자는 필요한 경우 약관을 변경할 수 있으며, 변경 시 본 페이지를 통해 공지합니다.</li>
            <li>변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제4조 (서비스의 제공)</h2>
          <p>서비스는 다음의 기능을 제공합니다.</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>프론트엔드 면접 질문 레퍼런스 열람</li>
            <li>카드 기반 인출 학습</li>
            <li>데일리 학습 및 진도 관리</li>
            <li>북마크 및 검색 기능</li>
            <li>면접 학습 문서 열람</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제5조 (학습 기록)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스는 회원 가입이나 로그인 없이 이용할 수 있습니다.</li>
            <li>학습 진도와 북마크는 이용자의 브라우저에만 저장되며, 브라우저 데이터를 삭제하면 함께 삭제됩니다.</li>
            <li>서비스 제공자는 이용자의 브라우저에 저장된 학습 기록을 보관하거나 복구할 수 없습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제6조 (이용자의 의무)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>이용자는 서비스를 정상적인 목적으로만 이용해야 합니다.</li>
            <li>서비스 콘텐츠의 무단 복제, 배포, 상업적 이용을 금지합니다.</li>
            <li>서비스의 안정적 운영을 방해하는 행위를 금지합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제7조 (면책 조항)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스 제공자는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>이용자가 서비스를 통해 얻은 정보에 대한 최종 판단과 책임은 이용자에게 있습니다.</li>
            <li>서비스에서 제공하는 학습 콘텐츠는 참고 목적이며, 면접 결과를 보장하지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">제8조 (분쟁 해결)</h2>
          <p>
            서비스 이용과 관련하여 분쟁이 발생한 경우, 서비스 제공자와 이용자 간의 합의에 의해 해결하는 것을 원칙으로
            합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
