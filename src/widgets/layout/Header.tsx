'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Menu, Search, LogIn, User, BookOpen, GraduationCap, Shield, Clock, Calendar } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/shared/ui/sheet';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { createClient } from '@/shared/config/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { getDueCardCount, syncProgress } from '@/entities/progress';
import { clearUserIdCache } from '@/entities/progress/sync';

const navItems = [
	{ href: '/reference', label: '레퍼런스', icon: BookOpen },
	{ href: '/learn/daily', label: '오늘의 학습', icon: Calendar },
	{ href: '/learn/flashcard', label: '플래시카드', icon: GraduationCap },
	{ href: '/search', label: '검색', icon: Search },
];

export function Header() {
	const pathname = usePathname();
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [mounted] = useState(() => typeof window !== 'undefined');
	const [open, setOpen] = useState(false);
	const [dueCount, setDueCount] = useState(() => typeof window !== 'undefined' ? getDueCardCount() : 0);

	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getUser().then(({ data: { user } }) => {
			setUser(user);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			clearUserIdCache();
			// 로그인 시 localStorage ↔ Supabase 양방향 동기화
			if (session?.user) {
				syncProgress().then(() => {
					setDueCount(getDueCardCount());
				}).catch(() => {});
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	const isAdminUser = useMemo(() => {
		if (!user?.email) return false;
		const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
			.split(',')
			.map((e) => e.trim().toLowerCase())
			.filter(Boolean);
		return adminEmails.includes(user.email.toLowerCase());
	}, [user]);

	const handleSignOut = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		setUser(null);
	};

	return (
		<header
			className={cn(
				'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur',
				'supports-[backdrop-filter]:bg-background/60',
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
										<AvatarImage src={user.user_metadata?.avatar_url} />
										<AvatarFallback>{user.email?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link href="/mypage/progress">학습 현황</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="/mypage/bookmarks">북마크</Link>
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
								<DropdownMenuItem onClick={handleSignOut}>로그아웃</DropdownMenuItem>
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
							<nav className="flex flex-col gap-2 mt-8">
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
												<BookOpen className="h-4 w-4" />
												북마크
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
