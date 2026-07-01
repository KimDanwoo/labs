import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  description: '프딥의 개인정보 처리방침입니다.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">개인정보 처리방침</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <p className="text-muted-foreground">시행일: 2026년 4월 27일</p>

        <section>
          <h2 className="text-lg font-semibold mb-3">1. 수집하는 개인정보 항목</h2>
          <p>
            프딥은 Google OAuth를 통한 로그인 시 아래 정보를 수집합니다.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>이메일 주소</li>
            <li>프로필 이미지 URL</li>
            <li>표시 이름 (닉네임)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 식별 및 로그인 인증</li>
            <li>학습 진도 및 북마크 저장</li>
            <li>서비스 이용 통계 분석</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴 시 수집된 개인정보는 즉시 파기됩니다.
            단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. 개인정보의 제3자 제공</h2>
          <p>
            프딥은 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
            다만, 아래의 경우에는 예외로 합니다.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 요청이 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. 개인정보의 파기 절차 및 방법</h2>
          <p>
            회원 탈퇴 요청 시 해당 이용자의 개인정보 및 학습 데이터는
            즉시 삭제되며 복구할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">6. 개인정보 보호를 위한 기술적 대책</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>인증 및 데이터 저장은 Supabase를 통해 암호화되어 관리됩니다.</li>
            <li>모든 통신은 HTTPS를 통해 암호화됩니다.</li>
            <li>Row Level Security(RLS) 정책을 적용하여 본인의 데이터만 접근 가능합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">7. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 마이페이지에서 회원 탈퇴를 통해
            개인정보의 삭제를 요청할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">8. 개인정보 보호 책임자</h2>
          <p>
            개인정보 처리방침에 관한 문의는 아래 연락처로 문의해 주세요.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>서비스명: 프딥</li>
            <li>이메일: support@fdeep.kr</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">9. 방침 변경에 관한 사항</h2>
          <p>
            본 개인정보 처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있으며,
            변경 시 본 페이지를 통해 공지합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
