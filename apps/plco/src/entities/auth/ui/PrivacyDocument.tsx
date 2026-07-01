// NOTE: 초안 템플릿입니다. 실제 서비스 배포 전 법무 검토를 권장합니다.

export default function PrivacyDocument() {
  return (
    <div className="space-y-5 text-gray-700">
      <header className="space-y-1">
        <h1 className="text-lg font-bold">개인정보 수집·이용</h1>
        <p className="text-[11px] text-gray-400">시행일: 2026년 6월 2일</p>
      </header>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">1. 수집하는 개인정보 항목</h2>
        <ul className="text-xs leading-relaxed text-gray-500 list-disc pl-4 space-y-0.5">
          <li>구글 로그인 시: 이메일 주소, 구글 계정 식별자</li>
          <li>서비스 이용 시: 게임 진행 데이터(캐릭터 상태, 코인, 해금 정보)</li>
        </ul>
        <p className="text-xs leading-relaxed text-gray-500">
          게스트(로그인 전)로 이용하는 경우 이메일 등 개인을 식별할 수 있는
          정보는 수집하지 않습니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">2. 수집 방법</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          이용자가 구글 OAuth 로그인에 동의하는 시점에 구글로부터 이메일을
          제공받습니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">3. 이용 목적</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          계정 식별 및 여러 기기 간 게임 진행도 동기화를 위해 사용합니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">4. 보유 및 파기</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          수집한 정보는 회원 탈퇴 시 즉시 파기됩니다. 이용자는 설정 화면에서
          언제든지 탈퇴할 수 있습니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">5. 처리 위탁</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          데이터 저장 및 인증을 위해 Supabase(데이터베이스·인증) 및 Google
          (소셜 로그인)을 이용합니다.
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-sm font-bold">6. 이용자의 권리</h2>
        <p className="text-xs leading-relaxed text-gray-500">
          이용자는 자신의 개인정보에 대한 열람, 정정, 삭제(탈퇴)를 요청할 수
          있습니다.
        </p>
      </section>
    </div>
  );
}
