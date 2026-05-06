'use client';

import { Card, CardContent, Button, Avatar, AvatarFallback, AvatarImage, Sheet, SheetContent, SheetTitle } from '@shared/ui';
import { Mail, User } from 'lucide-react';
import { useAccount } from '../model';

export function AccountPage() {
  const { displayName, email, avatarUrl, open, deleting, error, handleDelete, handleOpenChange } = useAccount();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-2">계정 설정</h1>
      <p className="text-muted-foreground mb-8">계정 정보를 관리합니다.</p>

      <Card className="shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} alt={`${displayName} 프로필`} />
              <AvatarFallback className="text-lg">
                <User className="h-7 w-7" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate block">{email}</span>
              </div>
              <p className="text-xs text-muted-foreground">Google 계정으로 로그인 중</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border-t pt-6">
        <button
          className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors"
          onClick={() => handleOpenChange(true)}
        >
          회원 탈퇴
        </button>
      </div>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 max-w-lg mx-auto">
          <SheetTitle className="text-base font-semibold mb-1">정말 탈퇴하시겠습니까?</SheetTitle>
          <div className="text-xs text-muted-foreground space-y-0.5 mb-5">
            <p>탈퇴 시 아래 데이터가 즉시 영구 삭제되며 복구할 수 없습니다.</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>계정 정보 (이메일, 프로필)</li>
              <li>학습 진도 및 연속 학습 기록</li>
              <li>북마크</li>
            </ul>
          </div>

          {error && <p className="text-sm text-destructive mb-3">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} disabled={deleting}>
              취소
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? '탈퇴 중...' : '탈퇴하기'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
