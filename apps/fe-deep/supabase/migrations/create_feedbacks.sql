-- 피드백 테이블
create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('add_question', 'edit_question')),
  question_id text references public.questions(id) on delete set null,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'deleted')),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.feedbacks enable row level security;

-- 본인 피드백 읽기
create policy "Users can read own feedbacks"
  on public.feedbacks for select
  using (auth.uid() = user_id);

-- 로그인 사용자 피드백 생성
create policy "Authenticated users can create feedbacks"
  on public.feedbacks for insert
  with check (auth.uid() = user_id);

-- 인덱스
create index feedbacks_user_id_idx on public.feedbacks(user_id);
create index feedbacks_status_idx on public.feedbacks(status);
create index feedbacks_created_at_idx on public.feedbacks(created_at desc);
