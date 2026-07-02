# hub

개인 프로젝트 갤러리를 한 곳에서 보여주는 허브 Next.js 앱.

**라이브:** [danwoo-lab.vercel.app](https://danwoo-lab.vercel.app)

## 개요

프론트엔드 엔지니어 김단우의 Lab 프로젝트 모음을 카드 형식으로 소개하는 단일 페이지 앱. 프로필 소개, 프로젝트 그리드, SNS·이력서 링크를 제공한다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) + React 19 |
| 언어 | TypeScript 5 |
| 스타일 | Tailwind CSS 4 |
| 패키지 매니저 | pnpm (monorepo) |
| 공용 패키지 | `@ui/react`, `@tokens/css` |

## 구조

```
app/                  # Next.js App Router (라우팅만, 얇게 유지)
src/
  entities/project/   # Project 타입 + PROJECTS 상수 (프로젝트 목록 단일 진실 공급원)
  views/home/         # HomeView — 페이지 조합
  widgets/
    profile-header/   # 프로필 소개 + 외부 링크
    project-grid/     # 프로젝트 카드 그리드
    site-header/      # 상단 헤더
    lab-footer/       # 하단 푸터
public/projects/      # 프로젝트 카드 커버 이미지
```

아키텍처는 [FSD (Feature-Sliced Design)](https://feature-sliced.design/) 기반. `app/` 은 Next.js 라우터 역할만 하고 구현은 `src/` 안에서만 이루어진다.

## 프로젝트 목록 추가

`src/entities/project/model/constants/index.ts` 의 `PROJECTS` 배열에 항목을 추가한다.

```ts
{
  title: '앱 이름',
  description: '한 줄 설명',
  href: 'https://...',
  image: '/projects/screenshot.png', // public/projects/ 에 이미지 추가 후
}
```

## 시작하기

```bash
# 모노레포 루트에서
pnpm install
pnpm --filter hub dev   # http://localhost:3000
```
