-- 오답노트 — 다시 볼 학습 주제 표시
create table public.study_review (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_slug text not null,
  topic_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, doc_slug, topic_key)
);

-- RLS
alter table public.study_review enable row level security;

create policy "Users can read own study_review"
  on public.study_review for select
  using (auth.uid() = user_id);

create policy "Users can insert own study_review"
  on public.study_review for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own study_review"
  on public.study_review for delete
  using (auth.uid() = user_id);

-- 인덱스
create index study_review_user_doc_idx on public.study_review(user_id, doc_slug);
