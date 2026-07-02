# dansoon

AI 기술 뉴스 큐레이션과 주간 베스트셀러 리포트를 제공하는 개인 블로그. Astro 기반 정적 사이트.

**라이브:** [danwoo-dev.netlify.app](https://danwoo-dev.netlify.app)

## 개요

두 개의 콘텐츠 섹션으로 구성된다.

- **Tech** — 주간 AI·개발 기술 뉴스 요약 (Python 스크립트로 자동 수집·생성)
- **Book** — 교보문고·YES24 주간 베스트셀러 및 웹소설 순위 리포트 (Python + Gemini API로 자동 파싱)

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Astro 5 |
| UI | React 19 (인터랙티브 컴포넌트만) |
| 스타일 | Tailwind CSS 4 + Typography 플러그인 |
| 콘텐츠 | Astro Content Collections (Markdown) |
| 배포 | Netlify |
| 콘텐츠 자동화 | Python + `google-genai` (Gemini 2.5 Flash) |

## 구조

```
src/
  pages/
    index.astro            # Tech 목록 메인
    tech/[...slug].astro   # Tech 포스트 상세
    book/index.astro       # Book 목록
    book/[slug].astro      # Book 리포트 상세
    rss.xml.ts             # RSS 피드
  layouts/BaseLayout.astro
  components/
    Main/PostList/         # 포스트 목록
    Category/              # 카테고리 필터
    Search/                # 클라이언트 사이드 검색
    Common/Utterances/     # 댓글 (utterances)
  hooks/useFilter.ts
  content.config.ts        # tech, book 컬렉션 스키마 정의
contents/
  tech/                    # 날짜별 Tech 뉴스 Markdown
  book/                    # 날짜별 Book 리포트 Markdown
scripts/                   # 콘텐츠 자동 수집 Python 스크립트
  fetch_tech_news.py       # HackerNews 수집 + Gemini 요약
  fetch_bestseller.py      # 교보/YES24 크롤링 + Gemini 파싱
  fetch_webnovel.py        # 웹소설 순위 크롤링 + Gemini 파싱
```

## 콘텐츠 자동화

`scripts/` 는 Node.js가 아닌 Python 환경에서 실행된다. Gemini API 키와 `google-genai` pip 패키지가 필요하다.

```bash
pip install google-genai playwright
python scripts/fetch_tech_news.py
python scripts/fetch_bestseller.py
```

## 시작하기

```bash
# 모노레포 루트에서
pnpm install
pnpm --filter dansoon dev   # http://localhost:4321
```
