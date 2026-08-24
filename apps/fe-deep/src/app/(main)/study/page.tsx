import { Card } from '@shared/ui';
import { countSteps } from '@views/study/model/parseHandbook';
import { getStudyDocs } from '@views/study/model/studyDocs';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: '면접 학습' };

export default async function AdminStudyListPage() {
  const docs = await getStudyDocs();

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:py-12">
      <div>
        <h1 className="text-2xl font-bold">면접 학습</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <code>content/study/</code>에 마크다운을 넣으면 학습 화면이 생깁니다.
        </p>
      </div>

      {docs.length === 0 ? (
        <Card>
          <Card.Content className="py-10 text-center text-sm text-muted-foreground">
            아직 문서가 없습니다. <code>content/study/이름.md</code>를 추가해주세요.
          </Card.Content>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {docs.map((doc) => (
            <Link key={doc.slug} href={`/study/${doc.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <Card.Content className="flex items-start gap-3 py-5">
                  <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="break-keep font-medium">{doc.title}</p>
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      주제 {doc.topics.length}개 · 단계 {countSteps(doc)}개
                    </p>
                  </div>
                </Card.Content>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
