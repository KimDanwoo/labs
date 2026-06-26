import { Button } from '@ui/react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-content flex-col items-center justify-center gap-lg px-lg py-3xl text-center">
      <div className="flex flex-col gap-sm">
        <h1 className="font-display text-2xl font-bold text-foreground">페이지를 찾을 수 없어요</h1>
        <p className="text-sm text-muted">주소가 바뀌었거나 사라진 화면이에요.</p>
      </div>
      <Link href="/" className="w-full">
        <Button className="h-12 w-full">홈으로</Button>
      </Link>
    </main>
  );
}
