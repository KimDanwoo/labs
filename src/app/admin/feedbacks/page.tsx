'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getFeedbacks, updateFeedbackStatus } from '@/features/feedback';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card, CardContent } from '@/shared/ui/Card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/shared/ui/Select';
import { MessageSquare, CheckCircle, Eye, Clock, Trash2 } from 'lucide-react';

interface Feedback {
  id: string;
  user_id: string;
  type: string;
  question_id: string | null;
  content: string;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: '대기', icon: Clock, variant: 'outline' },
  reviewed: { label: '확인됨', icon: Eye, variant: 'secondary' },
  resolved: { label: '완료', icon: CheckCircle, variant: 'default' },
  deleted: { label: '삭제됨', icon: Trash2, variant: 'outline' },
};

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFeedbacks(filter);
      setFeedbacks(data as Feedback[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateFeedbackStatus(id, status);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '상태 변경 실패');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">피드백 관리</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
            <SelectItem value="reviewed">확인됨</SelectItem>
            <SelectItem value="resolved">완료</SelectItem>
            <SelectItem value="deleted">삭제됨</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">불러오는 중...</div>
      ) : feedbacks.length === 0 ? (
        <Card className="p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">피드백이 없습니다.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => {
            const statusConf = STATUS_CONFIG[fb.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;
            return (
              <Card key={fb.id} className="shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={fb.type === 'add_question' ? 'default' : 'secondary'} className="text-xs">
                        {fb.type === 'add_question' ? '추가 요청' : '수정 요청'}
                      </Badge>
                      <Badge variant={statusConf.variant} className="text-xs gap-1">
                        <StatusIcon className="size-3" />
                        {statusConf.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(fb.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  <ContentToggle text={fb.content} />

                  {fb.question_id && (
                    <p className="text-xs text-muted-foreground">
                      질문 ID: {fb.question_id}
                    </p>
                  )}

                  <div className="flex gap-1.5 pt-1">
                    {fb.status !== 'deleted' && (
                      <>
                        {fb.status !== 'reviewed' && (
                          <Button variant="outline" size="xs" onClick={() => handleStatusChange(fb.id, 'reviewed')}>
                            확인됨
                          </Button>
                        )}
                        {fb.status !== 'resolved' && (
                          <Button variant="outline" size="xs" onClick={() => handleStatusChange(fb.id, 'resolved')}>
                            완료
                          </Button>
                        )}
                        {fb.status !== 'pending' && (
                          <Button variant="ghost" size="xs" onClick={() => handleStatusChange(fb.id, 'pending')}>
                            대기로
                          </Button>
                        )}
                        <Button variant="ghost" size="xs" className="text-destructive ml-auto" onClick={() => handleStatusChange(fb.id, 'deleted')}>
                          <Trash2 className="size-3" />
                          삭제
                        </Button>
                      </>
                    )}
                    {fb.status === 'deleted' && (
                      <Button variant="ghost" size="xs" onClick={() => handleStatusChange(fb.id, 'pending')}>
                        복원
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContentToggle({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight);
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`text-sm whitespace-pre-wrap ${expanded ? '' : 'line-clamp-2'}`}
      >
        {text}
      </p>
      {clamped && (
        <button
          className="text-xs text-primary hover:underline mt-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '접기' : '더보기'}
        </button>
      )}
    </div>
  );
}
