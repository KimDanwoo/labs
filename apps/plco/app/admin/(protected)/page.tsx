import Link from 'next/link';
import { ADMIN_ROUTE } from '@app/admin/_lib/api';

const SECTIONS = [
  {
    href: ADMIN_ROUTE.meetingScenes,
    title: '만남 대사',
    desc: '캐릭터별 대화 시나리오 편집',
    emoji: '💬',
  },
  {
    href: ADMIN_ROUTE.characters,
    title: '캐릭터',
    desc: '이름·색상·이모지 표시값 편집',
    emoji: '🎭',
  },
  {
    href: ADMIN_ROUTE.quiz,
    title: '취향 퀴즈',
    desc: '퀴즈 문제·보기·해설 편집',
    emoji: '💡',
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="card p-4 btn-press flex items-center gap-3"
        >
          <span className="text-3xl">{section.emoji}</span>
          <div>
            <div className="text-sm font-bold text-foreground">
              {section.title}
            </div>
            <div className="text-[11px] text-muted">{section.desc}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
