'use client';

type BlurredSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function BlurredSection({ title, children }: BlurredSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* 블러 처리된 콘텐츠 */}
      <div
        className="blur-sm pointer-events-none select-none"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* 오버레이 */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,26,0.6) 0%, rgba(10,10,26,0.85) 100%)',
          backdropFilter: 'blur(2px)',
        }}
      >
        {/* 자물쇠 아이콘 */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
          style={{
            background: 'rgba(212,165,116,0.12)',
            border: '1px solid rgba(212,165,116,0.4)',
            boxShadow: '0 0 24px rgba(212,165,116,0.15)',
          }}
        >
          🔒
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-gold mb-1">{title}</p>
          <p className="text-xs text-muted">
            전체 분석을 확인하려면 결제가 필요합니다
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center h-10 px-6 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
          style={{
            background:
              'linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-bright) 100%)',
            color: '#0a0a1a',
            boxShadow: '0 4px 16px rgba(212,165,116,0.35)',
          }}
        >
          결제하고 전체 보기
        </button>
      </div>
    </div>
  );
}
