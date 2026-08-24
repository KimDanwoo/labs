import { updateSession } from '@shared/config/supabase/middleware';
import { isAdmin } from '@shared/lib/isAdmin';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/** 관리자 이메일만 접근 가능한 경로. /study는 유저 레이아웃을 쓰지만 접근은 관리자 전용이다. */
const ADMIN_ONLY_PREFIXES = ['/admin', '/study'];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  if (ADMIN_ONLY_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
