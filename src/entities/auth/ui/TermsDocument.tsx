// NOTE: 초안 템플릿입니다. 실제 서비스 배포 전 법무 검토를 권장합니다.

export default function TermsDocument() {
  return (
    <div className="space-y-5 text-gray-700">
      <header className="space-y-1">
        <h1 className="text-lg font-bold">이용약관</h1>
        <p className="text-[11px] text-gray-400">시행일: 2026년 6월 2일</p>
      </header>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">제1조 (목적)</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          본 약관은 PLCO GOTCHI(이하 &ldquo;서비스&rdquo;)가 제공하는 캐릭터
          육성 서비스의 이용과 관련하여 서비스와 이용자 간의 권리·의무 및
          책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">제2조 (계정)</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          이용자는 별도의 로그인 없이 게스트로 서비스를 이용할 수 있으며, 구글
          계정으로 로그인하여 여러 기기 간 진행도를 동기화할 수 있습니다. 구글
          로그인 시 개인정보처리방침에 따라 이메일이 수집됩니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">제3조 (서비스의 제공 및 변경)</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          서비스는 게임 콘텐츠를 제공하며, 운영상·기술상 필요에 따라 콘텐츠를
          변경하거나 일부 또는 전부를 중단할 수 있습니다. 무료로 제공되는
          서비스의 특성상 천재지변, 시스템 장애 등으로 인한 손해에 대해 책임을
          지지 않습니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">제4조 (이용자의 의무)</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          이용자는 타인의 계정을 도용하거나, 서비스의 정상적인 운영을 방해하는
          행위, 관련 법령을 위반하는 행위를 해서는 안 됩니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">제5조 (회원 탈퇴)</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          이용자는 설정 화면에서 언제든지 회원 탈퇴를 할 수 있습니다. 탈퇴 시
          계정 및 게임 데이터는 즉시 파기되며 복구할 수 없습니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">제6조 (면책)</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          본 서비스는 비상업적 팬 프로젝트로 제공되며, 게임 데이터의 영구 보관을
          보증하지 않습니다.
        </p>
      </section>
    </div>
  );
}
