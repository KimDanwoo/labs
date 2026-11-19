import { Bookmark, BookOpen, GraduationCap, Search, User, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface TextLink {
  href: string;
  label: string;
}

export const SITE_NAME = '프딥';

export const MAIN_NAV_ITEMS: readonly NavItem[] = [
  { href: '/reference', label: '레퍼런스', icon: BookOpen },
  { href: '/learn', label: '학습', icon: GraduationCap },
  { href: '/search', label: '검색', icon: Search },
];

export const MY_PAGE_NAV_ITEMS: readonly NavItem[] = [
  { href: '/mypage/progress', label: '학습 현황', icon: User },
  { href: '/mypage/bookmarks', label: '북마크', icon: Bookmark },
];

export const FOOTER_NAV_LINKS: readonly TextLink[] = [
  { href: '/reference', label: '레퍼런스' },
  { href: '/learn', label: '학습하기' },
  { href: '/search', label: '검색' },
];

export const LEGAL_LINKS: readonly TextLink[] = [
  { href: '/privacy', label: '개인정보 처리방침' },
  { href: '/terms', label: '이용약관' },
];
