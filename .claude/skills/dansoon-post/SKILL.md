---
name: dansoon-post
description: dansoon 블로그 글을 쓰거나 고치거나 발행할 때 반드시 따르는 전체 절차 — 사실 확인, 문체, frontmatter, 이미지(cover·썸네일 스크립트), im-not-ai 윤문, open-seo 점검, 내부 링크, 검증, 발행. "블로그 글 써줘", "글 고쳐줘", "발행해줘", "기존 글 정비" 같은 요청이면 먼저 이 스킬을 연다.
---

# dansoon 블로그 글 절차

글 하나 = 아래 단계 전부. 하나라도 빼면 끝난 게 아니다. 결과 보고에는 각 단계를 했는지 적는다.

## 1. 사실 확인

- 도구·서비스·설정 절차는 **공식 문서를 먼저 읽고** 메뉴 이름·명령을 그대로 옮긴다. 기억으로 쓰지 않는다.
- 사용자의 경험·감정·결과를 지어내지 않는다. 모르는 부분은 사용자에게 묻거나 작업 중에만 `<!-- TODO: ... -->`로 표시한다.
- 확인하지 못한 사실은 단정하지 않는다.

## 2. 문체

- 본문은 `-다` 체 평서문(기존 글과 통일). 합니다체로 쓴 옛 글에 문장을 넣을 땐 그 글의 말투를 따른다.
- `description`은 해요체(`~정리해요.`), 200자 이내.
- "이 글은 ~한 이야기다" 같은 메타 문장 금지.
- 소제목은 `## 1. ...` 번호 형식, 끝은 `## 정리` 또는 마무리 문단.
- 개발자끼리 쓰는 말투("붙기" 등)보다 일반적인 말(접속·연결)을 쓴다.
- "포트폴리오" 단어 금지(대체어: 프로젝트 허브, 개인 프로젝트 모음).

## 3. frontmatter

`apps/dansoon/contents/posts/<영문-slug>/index.md`. 스키마는 `src/content.config.ts`가 검증한다.

```yaml
---
title: "제목"
description: "요약(해요체, 200자 이내)"
publishedAt: "2026-11-09T21:00:00+09:00"
category: "dev"            # dev | retro | reading
tags: ["ai", "side-project"] # src/lib/taxonomy.ts의 TAG_IDS만
draft: true                # 초안은 true, 발행 때 false
thumbnail: "./thumbnail.jpg"
cover: "./cover.jpg"
---
```

- 새 태그·카테고리는 `src/lib/taxonomy.ts`에 먼저 추가한다.
- **slug(폴더 이름)는 URL이라 절대 바꾸지 않는다.**

## 4. 이미지 (글과 한 세트)

이미지는 직접 그리지 않고 `codexgen` 스킬로 만든다(`~/.claude/skills/codexgen/codexgen.sh <out.png> "<영문 프롬프트>"`). 여러 장은 순차 호출.

**cover.jpg** — 글 상단 + 썸네일 배경

- 3:2, **제목·글자 없음**, **모티프는 오른쪽, 왼쪽 절반 이상은 비운다**(썸네일 스크립트가 왼쪽에 제목을 얹는다).
- 글마다 은유와 화풍을 바꾼다. 큰 한글 제목 + 파란 강조 + 연회색 배경 + 플랫 UI 아이콘(브라우저 창·톱니·화살표) 템플릿은 피한다.
- 변환: `sips -s format jpeg -s formatOptions 82 -z 1024 1536 cover.png --out cover.jpg` 후 png 삭제.

**thumbnail.jpg** — 목록·링크 미리보기(1200×630)

- **직접 자르지 않는다.** 앱 폴더에서 `node scripts/make-thumbnails.ts <slug>`로 만든다.
- **제목이나 카테고리를 바꾸면 그 글의 썸네일을 반드시 다시 만든다.** 여러 글 제목을 고쳤으면 slug를 모두 넘긴다.

**본문 이미지** — 최소 1장. 구성도·은유 그림 등 글 내용을 보여 주는 것. 3:2 jpg, `![설명](./이름.jpg)`.

만든 이미지는 Read로 열어 눈으로 확인한다(글자가 섞였는지, 왼쪽이 비었는지, 썸네일 제목이 모티프와 겹치는지).

## 5. 링크

- 내부 링크는 끝에 `/`: `](/posts/slug/)`, 앵커는 `/posts/slug/#h`. (`trailingSlash: 'always'`라 슬래시가 없으면 404)
- 관련 글로 가는 내부 링크를 넣는다. **draft 글로는 링크하지 않는다**(배포 사이트에서 404). 발행할 때 연결한다.
- 외부 링크는 공식 문서를 우선한다.

## 6. im-not-ai 윤문 (초안 직후 바로, 미루지 않음)

`humanize-korean:humanize-korean` 스킬을 연다. TODO·캡처가 남아 있어도 바로 돌린다.

- `_workspace`는 **scratchpad에 둔다**(저장소에 만들지 않음).
- 입력은 frontmatter를 뺀 본문만. 코드블록·표·링크·굵은 UI 라벨·HTML 주석은 보존 대상으로 지시한다.
- 스킬 절차대로 shim → monolith → `restore_modality.py`·`strip_injected_commas.py` → `verify_gates.py`까지 돌리고, 게이트 통과한 본문을 frontmatter와 합친다(frontmatter 뒤 빈 줄 확인).
- 헤딩을 일부러 바꾸면 P3 heading_lost가 뜨는데 무시해도 된다.

## 7. open-seo 점검 (윤문과 함께 바로)

`content-brief` 스킬을 연다. Ryze MCP는 연결하지 않았으므로 SERP는 WebSearch(한국어·영어 각 1회)로 대신한다. 매번 네 가지를 본다.

1. 제목·description에 사람들이 실제로 검색하는 말(제품명·도구명·문제 상황)이 들어갔는가.
2. 상위 글과 비교해 빠진 기본 내용과 이 글만의 차별점. 같은 문제를 푸는 다른 방법이 흔하면 `다른 방법과 비교` 표를 넣는다.
3. 관련 글 내부 링크(5단계 규칙).
4. slug는 그대로.

## 8. 검증

명령은 **저장소 루트에서** 실행한다. `contents/posts/` 안에서 명령을 돌리면 OMC 훅이 `.omc/` 폴더를 만들어 Astro 설정 로드가 깨진다(생겼으면 지운다).

```bash
pnpm --filter dansoon exec astro check   # 0 errors
```

- 내부 링크 대상 확인: 모든 `](/posts/<slug>/` 의 slug 폴더가 존재하는지.
- dev 서버(`localhost:4321`)는 draft도 보여 준다. 글 페이지가 200인지, 이미지가 뜨는지 확인한다. 화면 변경은 캡처로 사용자에게 확인받는다.

## 9. 발행

- `draft: false`, `publishedAt`을 발행 시각(KST)으로.
- **`<!-- TODO -->` 주석은 모두 지운다.** 화면엔 안 보여도 페이지 소스에 노출된다. 남은 할 일은 PR 설명의 체크리스트로 옮긴다.
- 관련 글에서 새 글로 링크를 건다.
- 커밋은 `/commit` 규칙: main에서 브랜치(`docs/...`)를 파고 `docs(dansoon): ...` 원자적 커밋. 사이트에 반영하려면 PR을 열고 CI(`verify`) 통과 후 머지한다(머지 = 배포).

## 완료 보고 체크리스트

- [ ] 공식 문서 확인, 지어낸 경험 없음
- [ ] cover(왼쪽 비움, 글자 없음) + 본문 이미지 + 스크립트 썸네일, 눈으로 확인
- [ ] im-not-ai 게이트 통과(변경률 수치)
- [ ] open-seo 4항목 반영
- [ ] 내부 링크(슬래시, draft 링크 없음)
- [ ] astro check 0 errors, dev 페이지 확인
- [ ] 발행 시 TODO 주석 제거, 제목 바꾼 글 썸네일 재생성
