import { NextResponse } from 'next/server';
import {
  getAdminSupabase,
  requireUser,
} from '@shared/lib/server/supabase-admin';

/**
 * 회원 탈퇴. 본인 인증 후 auth.users 를 삭제하면
 * profiles·game_saves·daily_logins·achievements 가 cascade 로 함께 제거된다.
 */
export async function DELETE(req: Request) {
  const auth = await requireUser(req);
  if (!auth) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  const { error } = await getAdminSupabase().auth.admin.deleteUser(auth.userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
