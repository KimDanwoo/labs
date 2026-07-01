# 프딥 — 프론트엔드, 딥하게 알자

> 프론트엔드 기술면접을 체계적으로 준비할 수 있는 학습 플랫폼

<br>

## Overview

프론트엔드 기술면접에 필요한 핵심 개념을 레퍼런스, 플래시카드, 퀴즈 등 다양한 학습 방식으로 제공합니다.

<br>

## Tech Stack

| 영역      | 기술                                         |
| --------- | -------------------------------------------- |
| Framework | Next.js 15 (App Router)                      |
| Language  | TypeScript                                   |
| Styling   | Tailwind CSS, shadcn/ui, Radix UI            |
| Database  | Supabase (PostgreSQL + Auth + RLS)           |
| Animation | Framer Motion                                |
| Markdown  | react-markdown, rehype-highlight, remark-gfm |
| AI        | OpenAI API (질문 자동 생성)                  |
| Deploy    | Vercel                                       |

<br>

## Architecture — FSD 2.1

Feature-Sliced Design을 기반으로 한 레이어 구조입니다.

```
src/
├── app/                  # 라우팅 & 페이지
│   ├── (main)/           # 사용자 페이지
│   │   ├── page.tsx          # 홈 (히어로 + 카테고리)
│   │   ├── reference/        # 레퍼런스 (카테고리별 Q&A)
│   │   ├── learn/            # 학습 (플래시카드, 퀴즈, 데일리)
│   │   ├── search/           # 검색
│   │   ├── mypage/           # 마이페이지 (진도, 북마크)
│   │   └── auth/             # 인증
│   └── admin/            # 어드민 (질문 CRUD, AI 생성)
│
├── widgets/              # 조합된 UI 블록
│   └── layout/               # 헤더, 푸터
│
├── features/             # 사용자 행동 단위
│   └── bookmark/             # 북마크 기능
│
├── entities/             # 도메인 모델
│   ├── question/             # 질문/카테고리 도메인
│   └── progress/             # 학습 진도 도메인
│
└── shared/               # 공통 인프라
    ├── config/supabase/      # Supabase 클라이언트
    ├── ui/                   # shadcn/ui 컴포넌트
    └── lib/                  # 유틸리티
```

**의존성 방향**: `app → widgets → features → entities → shared`

<br>

## Database Schema

```
categories ─┐
             ├── questions ──┬── quiz_options
             │               ├── user_progress
             │               └── bookmarks
             └── daily_streaks
```

- `categories` / `questions` — 공개 읽기 (RLS)
- `user_progress` / `bookmarks` / `daily_streaks` — 사용자별 접근 제어

<br>

## Getting Started

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 등 설정

# 개발 서버 실행
npm run dev
```

`http://localhost:3009`에서 확인할 수 있습니다.
<br>

## Scripts

```bash
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버
npm run lint      # ESLint 검사
```
