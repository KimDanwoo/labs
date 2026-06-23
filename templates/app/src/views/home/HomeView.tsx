import { Button } from '@ui/react';

export function HomeView() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-lg px-lg py-3xl">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">__APP_NAME__</h1>
      <p className="text-lg text-muted">
        Danwoo 디자인 시스템이 연결된 새 앱입니다. 토큰 기반 색상/여백/폰트가 바로 동작합니다.
      </p>
      <Button>시작하기</Button>
    </main>
  );
}
