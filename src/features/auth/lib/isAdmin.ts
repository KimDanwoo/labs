/**
 * 환경 변수에 포함된 관리자 이메일인지 확인한다.
 * 서버에서는 ADMIN_EMAILS, 클라이언트에서는 NEXT_PUBLIC_ADMIN_EMAILS를 참조한다.
 * 서버 컴포넌트, Server Action, 미들웨어, 클라이언트 컴포넌트 모두에서 사용 가능하다.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
