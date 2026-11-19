# 프딥 — 프론트엔드, 딥하게 알자

> 프론트엔드 기술면접을 체계적으로 준비할 수 있는 학습 플랫폼

## Overview

프론트엔드 기술면접에 필요한 핵심 개념을 레퍼런스, 플래시카드, 검색으로 제공한다. 서버·DB·로그인 없이 동작한다. 문제는 레포의 마크다운 파일이 원본이고, 학습 진도와 북마크는 브라우저(localStorage)에만 저장한다.

## Tech Stack

| 영역      | 기술                                         |
| --------- | -------------------------------------------- |
| Framework | Next.js 16 (App Router)                      |
| Language  | TypeScript                                   |
| Styling   | Tailwind CSS, shadcn/ui, Radix UI            |
| Content   | 마크다운 + YAML frontmatter (`content/`)     |
| Animation | Framer Motion                                |
| Markdown  | react-markdown, rehype-highlight, remark-gfm |
| Deploy    | Vercel (모든 화면 정적 생성)                 |

## 문제 관리

문제는 `content/questions/`에서 관리한다. 빌드할 때 읽어서 화면을 정적으로 만들고, 브라우저 화면(학습·검색·마이페이지)은 같은 데이터를 정적 JSON(`/api/questions`)으로 받는다.

```
content/questions/
├── categories.yml        # 카테고리 목록 — 나열 순서가 화면 순서
└── <카테고리 slug>/
    ├── 001.md            # 파일 이름 번호가 카테고리 안 순서
    └── 002.md
```

문제 파일 형식:

```markdown
---
id: q-1 # 바꾸지 않는다 — 브라우저에 저장된 진도·북마크가 이 값을 가리킨다
question: 클로저란 무엇인가요?
difficulty: medium # easy | medium | hard
sub_category: 함수
tags:
  - 클로저
show_in_daily: true
show_in_flashcard: true
follow_ups: # 선택
  - question: 실무에서는 어떻게 쓰나요?
    keywords:
      - 모듈 패턴
    answer: |-
      답변 본문
---

답변 본문(마크다운)
```

- 새 문제는 해당 카테고리 폴더에 다음 번호로 파일을 만들고, 겹치지 않는 새 `id`를 붙인다.
- 필드가 빠지거나 `difficulty`가 잘못되거나 `id`가 겹치면 빌드와 `pnpm --filter fe-deep test`가 파일 경로와 함께 실패한다.
- Prettier가 frontmatter를 바꾸지 않도록 `content/questions/`는 `.prettierignore`에 들어 있다.

면접 학습(`/study`) 문서는 `content/study/`의 마크다운이다.

## Architecture — FSD 2.1

```
app/                      # Next 라우팅 진입점 (/, reference, learn, search, study, mypage, privacy, terms)
content/                  # 문제·면접 학습 원본 마크다운
src/
├── app/                  # FSD app 레이어 — 프로바이더, 전역 스타일, 헤더·푸터
├── views/                # 화면
├── features/             # 북마크
├── entities/
│   ├── question/             # 질문·카테고리 — model/server가 content/questions를 읽음
│   └── progress/             # 학습 진도(브라우저 저장)
└── shared/               # 설정, 유틸리티
```

**의존성 방향**: `app → views → features → entities → shared`

## Getting Started

```bash
pnpm install
pnpm --filter fe-deep dev     # http://localhost:3009
pnpm --filter fe-deep test    # 단위 테스트 + 문제 파일 검증
pnpm --filter fe-deep test:e2e
```
