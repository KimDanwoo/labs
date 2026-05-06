import Link from 'next/link';
import { Button } from '@shared/ui';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md animate-fade-in-up">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold tracking-tighter bg-gradient-to-b from-foreground to-muted-foreground/50 bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-xl font-medium">
            페이지를 찾을 수 없습니다
          </p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Button asChild className="gap-2 shadow-md">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            홈으로 돌아가기
          </Link>
        </Button>
      </div>
    </div>
  );
}
