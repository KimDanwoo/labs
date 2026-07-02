import { ThemeToggle } from '@ui/react';
import {
  ColorSemanticSection,
  ComponentsSection,
  PaletteSection,
  RadiusSection,
  ShadowSection,
  SpacingSection,
  TypographySection,
} from '@views/showcase/ui';

export function ShowcaseView() {
  return (
    <main className="mx-auto flex w-full flex-col gap-3xl px-lg py-2xl">
      <header className="flex items-start justify-between gap-md border-b border-card-border pb-lg">
        <div className="flex flex-col gap-xs">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Design System</span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Danwoo UI 카탈로그</h1>
          <p className="text-sm text-muted">
            @ui/react 공통 컴포넌트 + @tokens/css 디자인 토큰 전량. 전 앱 적용 판단용 참고 화면.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <ColorSemanticSection />
      <PaletteSection />
      <TypographySection />
      <SpacingSection />
      <RadiusSection />
      <ShadowSection />
      <ComponentsSection />
    </main>
  );
}
