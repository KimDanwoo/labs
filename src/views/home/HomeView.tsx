import Link from 'next/link';

export function HomeView() {
  return (
    <main className="relative w-full max-w-[500px] mx-auto h-dvh overflow-hidden bg-background">
      {/* 배경 영상 — 전체 화면 */}
      <video
        src="/intro.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/30 to-background" />

      {/* 콘텐츠 — 하단 정렬 */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-12 pt-6 text-center">
        <div className="mb-6 flex items-center gap-3">
          <span className="w-12 h-px bg-gold/60" />
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium">
            Destiny
          </span>
          <span className="w-12 h-px bg-gold/60" />
        </div>

        <h1 className="text-5xl font-bold text-gold mb-3 tracking-tight drop-shadow-2xl">
          청연사주
        </h1>

        <p className="text-lg text-foreground/80 mb-10 font-light tracking-wide drop-shadow-lg">
          당신의 운명을 읽어드립니다
        </p>

        <Link
          href="/input"
          className="w-full max-w-xs h-14 rounded-full text-base font-bold tracking-wide shadow-2xl shadow-gold/30 hover:scale-[1.03] inline-flex items-center justify-center bg-gold text-background hover:bg-gold-bright active:scale-[0.98] transition-all duration-200"
        >
          사주 보러가기 →
        </Link>

        <p className="mt-6 text-xs text-foreground/40 tracking-wider">
          생년월일시를 입력하고 사주팔자를 확인하세요
        </p>
      </div>
    </main>
  );
}
