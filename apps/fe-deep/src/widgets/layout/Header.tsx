'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, LogIn, LogOut, User, BookOpen, GraduationCap, Shield, Clock, Calendar, Settings, Bookmark } from 'lucide-react';
import { Button, Sheet, SheetContent, SheetTrigger, SheetTitle, ThemeToggle, Avatar, AvatarFallback, AvatarImage } from '@shared/ui';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@shared/ui/DropdownMenu';
import { cn } from '@shared/lib/utils';
import { useHeader } from './model/useHeader';

const navItems = [
	{ href: '/reference', label: '레퍼런스', icon: BookOpen },
	{ href: '/learn/daily', label: '오늘의 학습', icon: Calendar },
	{ href: '/learn/flashcard', label: '플래시카드', icon: GraduationCap },
	{ href: '/search', label: '검색', icon: Search },
];

export function Header() {
	const pathname = usePathname();
	const mounted = typeof window !== 'undefined';
	const { user, open, setOpen, dueCount, isAdminUser, handleSignOut } = useHeader();

	return (
		<header
			className={cn(
				'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur',
				'supports-backdrop-filter:bg-background/60',
			)}
		>
			<div className="container flex h-14 items-center px-4 mx-auto max-w-7xl">
				<Link href="/" className="mr-6 flex items-center space-x-2 font-bold">
					<span className="hidden sm:inline-block">프딥</span>
					<span className="sm:hidden">프딥</span>
				</Link>

				<nav className="hidden md:flex items-center space-x-1 flex-1" aria-label="메인 네비게이션">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href || (pathname.startsWith(item.href + '/'));
						const showDueBadge = mounted && item.href === '/learn/flashcard' && dueCount > 0;
						return (
							<Link key={item.href} href={item.href}>
								<Button variant={isActive ? 'secondary' : 'ghost'} size="sm" className="gap-2">
									<Icon className="h-4 w-4" />
									{item.label}
									{showDueBadge && (
										<span className="flex items-center gap-0.5 text-xs bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">
											<Clock className="h-3 w-3" />
											{dueCount}
										</span>
									)}
								</Button>
							</Link>
						);
					})}
				</nav>

				<div className="flex items-center gap-2 ml-auto">
					<ThemeToggle />

					{user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="rounded-full" aria-label="사용자 메뉴">
									<Avatar className="h-8 w-8">
										<AvatarImage src={user.user_metadata?.avatar_url} alt={`${user.email ?? '사용자'} 프로필`} />
										<AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link href="/mypage/progress">
										<User className="h-4 w-4 mr-2" />
										학습 현황
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="/mypage/bookmarks">
										<Bookmark className="h-4 w-4 mr-2" />
										북마크
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="/mypage/account">
										<Settings className="h-4 w-4 mr-2" />
										계정 설정
									</Link>
								</DropdownMenuItem>
								{isAdminUser && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link href="/admin">
												<Shield className="h-4 w-4 mr-2" />
												관리자
											</Link>
										</DropdownMenuItem>
									</>
								)}
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut}>
									<LogOut className="h-4 w-4 mr-2" />
									로그아웃
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Link href="/auth/login" aria-label="로그인">
							<Button variant="outline" size="sm" className="gap-2">
								<LogIn className="h-4 w-4" aria-hidden="true" />
								<span className="hidden sm:inline">로그인</span>
							</Button>
						</Link>
					)}

					{/* Mobile menu */}
					<Sheet open={open} onOpenChange={setOpen}>
						<SheetTrigger asChild className="md:hidden">
							<Button variant="ghost" size="icon" aria-label="메뉴 열기">
								<Menu className="h-5 w-5" aria-hidden="true" />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-[280px]">
							<SheetTitle className="sr-only">메뉴</SheetTitle>
							<nav className="flex flex-col gap-1 mt-8 px-2">
								{navItems.map((item) => {
									const Icon = item.icon;
									const isActive = pathname === item.href || (pathname.startsWith(item.href + '/'));
									const showDueBadge = mounted && item.href === '/learn/flashcard' && dueCount > 0;
									return (
										<Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
											<Button variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-start gap-3">
												<Icon className="h-4 w-4" />
												{item.label}
												{showDueBadge && (
													<span className="flex items-center gap-0.5 text-xs bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full ml-auto">
														<Clock className="h-3 w-3" />
														{dueCount}
													</span>
												)}
											</Button>
										</Link>
									);
								})}
								{user && (
									<>
										<div className="my-2 border-t" />
										<Link href="/mypage/progress" onClick={() => setOpen(false)}>
											<Button variant="ghost" className="w-full justify-start gap-3">
												<User className="h-4 w-4" />
												학습 현황
											</Button>
										</Link>
										<Link href="/mypage/bookmarks" onClick={() => setOpen(false)}>
											<Button variant="ghost" className="w-full justify-start gap-3">
												<Bookmark className="h-4 w-4" />
												북마크
											</Button>
										</Link>
										<Link href="/mypage/account" onClick={() => setOpen(false)}>
											<Button variant="ghost" className="w-full justify-start gap-3">
												<Settings className="h-4 w-4" />
												계정 설정
											</Button>
										</Link>
										{isAdminUser && (
											<Link href="/admin" onClick={() => setOpen(false)}>
												<Button variant="ghost" className="w-full justify-start gap-3">
													<Shield className="h-4 w-4" />
													관리자
												</Button>
											</Link>
										)}
										<div className="my-2 border-t" />
										<Button
											variant="ghost"
											className="w-full justify-start gap-3"
											onClick={() => { handleSignOut(); setOpen(false); }}
										>
											<LogOut className="h-4 w-4" />
											로그아웃
										</Button>
									</>
								)}
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
