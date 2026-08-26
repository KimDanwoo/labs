-- 학습 주제 이해됨 체크
create table public.study_understood (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_slug text not null,
  topic_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, doc_slug, topic_key)
);

-- RLS
alter table public.study_understood enable row level security;

create policy "Users can read own study_understood"
  on public.study_understood for select
  using (auth.uid() = user_id);

create policy "Users can insert own study_understood"
  on public.study_understood for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own study_understood"
  on public.study_understood for delete
  using (auth.uid() = user_id);

-- 인덱스
create index study_understood_user_doc_idx on public.study_understood(user_id, doc_slug);
