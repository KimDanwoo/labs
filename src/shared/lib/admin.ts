/**
 * 환경 변수 ADMIN_EMAILS에 포함된 이메일인지 확인한다.
 * 서버 컴포넌트, Server Action, 미들웨어에서 공용으로 사용한다.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
