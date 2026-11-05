# dansoon

프론트엔드 엔지니어 김단우의 개발 노트·회고·독서 기록 블로그. Astro 정적 사이트.

**라이브:** [log.danwoo.dev](https://log.danwoo.dev)

## 기술 스택

| 영역       | 선택                                                            |
| ---------- | --------------------------------------------------------------- |
| 프레임워크 | Astro 7 (Sätteri 마크다운 처리기)                               |
| 스타일     | Tailwind CSS 4 + Typography 플러그인 + 공용 토큰(`@tokens/css`) |
| 서체       | 마루부리(`@tokens/css/fonts.css`)                               |
| 코드 블록  | astro-expressive-code (복사·줄 강조·라이트/다크)                |
| 콘텐츠     | Astro Content Collections (`contents/posts/<slug>/index.md`)    |
| 배포       | Vercel                                                          |

클라이언트 프레임워크(React 등)는 쓰지 않는다. 검색·목차·테마·이미지 확대는 Astro `<script>`로 처리한다.

## 구조

```
contents/posts/<slug>/index.md   # 글 1편 = 폴더 1개(이미지는 같은 폴더). 폴더 이름이 곧 URL slug
src/
  content.config.ts              # posts 스키마(카테고리·태그·연재·draft 검증)
  lib/
    taxonomy.ts                  # 카테고리·태그·연재 ID와 화면 이름
    posts.ts                     # 공개 글 조회·정렬·연재·이전/다음·관련 글
    format.ts                    # 날짜(Asia/Seoul)·읽는 시간
    articleHastPlugin.mjs        # 본문 후처리: 제목 앵커, 표 가로 스크롤
  layouts/BaseLayout.astro       # 메타·테마 초기화·사이드바 틀
  components/                    # AppSidebar, PostList, Toc, SearchDialog, Giscus 등
  pages/
    index.astro                  # 전체 글
    posts/[slug].astro           # 글 상세
    categories/ tags/ series/    # 목록
    rss.xml.ts search.json.ts    # RSS, 검색 인덱스
scripts/import-tistory.mjs       # 티스토리 글 이전(재실행 가능)
```

## 글 쓰기

`contents/posts/<영문-slug>/index.md`를 만들고 frontmatter를 채운다. 스키마는 `src/content.config.ts`가 검증한다.

```yaml
---
title: '제목'
description: '목록·검색·SNS 미리보기 요약(200자 이내)'
publishedAt: '2026-11-05T10:00:00+09:00'
category: 'dev' # dev | retro | reading
tags: ['react'] # src/lib/taxonomy.ts의 TAG_IDS
# series: 'hanghae-plus'
# seriesOrder: 10
# draft: true          # true면 목록·상세·RSS·검색 어디에도 나오지 않는다
---
```

새 태그·카테고리·연재는 `src/lib/taxonomy.ts`에 ID와 이름을 먼저 추가한다. slug(폴더 이름)는 URL이므로 바꾸지 않는다.

## 댓글

giscus(GitHub Discussions). `KimDanwoo/labs` 저장소에서 Discussions를 켜고 giscus 앱을 설치한 뒤, `src/components/Giscus.astro`의 `categoryId`를 채우면 표시된다.

## 시작하기

```bash
# 모노레포 루트에서
pnpm install
pnpm --filter dansoon dev   # http://localhost:4321
```
