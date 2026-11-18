export function HomeView() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-lg px-lg py-3xl">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">__APP_NAME__</h1>
      <p className="text-lg text-muted-foreground">
        공통 토큰(서체·간격·색)이 연결된 새 앱이에요. 컴포넌트는 이 앱의 src/shared/ui에 만들어요.
      </p>
    </main>
  );
}
