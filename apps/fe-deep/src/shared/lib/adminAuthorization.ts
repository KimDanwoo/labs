import { isAdmin } from './isAdmin';

type AuthenticatedUser = { email?: string | null };

export function assertAdminUser(user: AuthenticatedUser | null): asserts user is AuthenticatedUser {
  if (!user || !isAdmin(user.email)) throw new Error('관리자 권한이 필요합니다.');
}
