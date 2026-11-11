# dansoon

프론트엔드 엔지니어 김단우의 개발 노트·회고·독서 기록과 주간 책 순위 리포트. Astro 정적 사이트.

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
contents/book/<날짜>-<종류>/      # 주간 책 순위 리포트(자동 생성, /book/<폴더 이름>/)
src/
  content.config.ts              # posts 스키마(카테고리·태그·draft 검증)
  lib/
    taxonomy.ts                  # 카테고리·태그·연재 ID와 화면 이름
    posts.ts                     # 공개 글 조회·정렬·이전/다음·관련 글
    format.ts                    # 날짜(Asia/Seoul)·읽는 시간
    articleHastPlugin.mjs        # 본문 후처리: 제목 앵커, 표 가로 스크롤
  layouts/BaseLayout.astro       # 메타·테마 초기화·사이드바 틀
  components/                    # AppSidebar, PostList, Toc, SearchDialog, Giscus 등
  pages/
    index.astro                  # 전체 글
    posts/[slug].astro           # 글 상세
    categories/ tags/            # 목록
    rss.xml.ts search.json.ts    # RSS, 검색 인덱스
scripts/import-tistory.mjs       # 티스토리 글 이전(재실행 가능)
scripts/fetch_bestseller.py      # 주간 베스트셀러 리포트 생성
scripts/fetch_webnovel.py        # 주간 웹소설 순위 리포트 생성
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
# draft: true          # 로컬 dev에서는 보이고, 프로덕션의 목록·상세·RSS·검색에서 제외한다
---
```

새 태그·카테고리는 `src/lib/taxonomy.ts`에 ID와 이름을 먼저 추가한다. slug(폴더 이름)는 URL이므로 바꾸지 않는다.

본문 이미지와 커버는 **WebP만 저장**한다. JPG는 품질 85로, PNG는 글자·도표를 보존하도록 무손실로 변환하며 이미지 크기는 유지한다. 기존 WebP·SVG·GIF와 공유용 `thumbnail.jpg`는 건드리지 않는다. 변환 전 JPG·PNG를 함께 보관할 필요는 없다.

새 JPG·PNG를 글 폴더에 넣은 뒤 모노레포 루트에서 실행한다.

```bash
pnpm --filter dansoon images:optimize <slug>
# slug를 생략하면 모든 글 폴더를 처리한다.
```

변환기는 `index.md`의 상대 이미지 경로(frontmatter 포함)를 WebP로 바꾸고, 변환한 JPG·PNG를 삭제한다. 같은 이름의 WebP가 이미 있으면 덮어쓰지 않고 중단한다. 기존 WebP는 다시 압축하지 않으므로 재실행해도 화질이 떨어지지 않는다. 무손실 변환은 이미지에 따라 용량이 커질 수도 있다. 티스토리 가져오기도 본문 이미지는 같은 규칙으로 저장한다(SVG·GIF 제외).

커버: 글 폴더에 제목 없는 배경 `cover.webp`(3:2, 모티프는 오른쪽, 왼쪽은 비움)를 두고 **앱 폴더에서** `node scripts/make-thumbnails.ts <slug>`로 제목을 얹은 `thumbnail.jpg`(1200×630)를 만든다. frontmatter에 `thumbnail: './thumbnail.jpg'`, `cover: './cover.webp'`를 적는다. 커버는 글 상단, 썸네일은 목록·SNS 링크 미리보기에 쓰인다. 제목을 바꾸면 썸네일 생성기를 다시 돌린다.

## 주간 책 순위(자동)

GitHub Actions가 매주 월요일 리포트를 만들어 `contents/book/`에 커밋한다(`dansoon-weekly-bestseller`, `dansoon-weekly-webnovel`). 블로그는 `/book/`에서 주별로 모아 보여준다. 수집 스크립트는 Python이며 Gemini API 키와 `google-genai`가 필요하다. 테크 뉴스 자동 수집은 중단했다.

**애드센스 심사 동안 리포트 페이지는 내려 둔다.** Google 게시자 정책이 수동 검토 없는 자동 생성 콘텐츠에 광고를 허용하지 않기 때문이다. 라우트 폴더를 `src/pages/_book`, `src/pages/og/_book`으로 바꿔 Astro 라우팅에서 뺐고(밑줄 폴더는 페이지가 되지 않는다), 사이드바 메뉴와 글의 `/book/` 링크도 뺐다. 수집은 계속된다. 승인 후 되돌릴 때:

1. 두 폴더 이름을 `book`으로 되돌리고, `AppSidebar.astro`의 바로가기와 `about.md`의 항목, 글 3편(`bestseller-24-weeks`, `webnovel-24-weeks`, `bestseller-aggregator`)의 링크를 복구한다.
2. 리포트 페이지에는 Google 광고를 붙이지 않는다. `google-adsense-account` 메타 태그를 리포트 페이지에서 빼고, 애드센스 "페이지 제외"에 `danwoo.dev/book`과 `log.danwoo.dev/book`을 등록한다.
3. `_book/[slug].astro`의 `IS_EXCLUDED_FROM_SEARCH`와 `astro.config.mjs`의 sitemap filter를 유지할지 정한다.

## 댓글

giscus(GitHub Discussions). 댓글은 공개 저장소 `KimDanwoo/dansoon-comments`의 Announcements 카테고리에 쌓인다. 저장소에 giscus 앱이 설치돼 있어야 한다. 설정은 `src/components/Giscus.astro`.

## 시작하기

```bash
# 모노레포 루트에서
pnpm install
pnpm --filter dansoon dev   # http://localhost:4321
```
