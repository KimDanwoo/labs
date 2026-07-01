---
description: 변경사항을 프로젝트 커밋 컨벤션대로 원자적으로 커밋
---

CLAUDE.md의 "커밋 컨벤션" 섹션을 source of truth로 삼아 커밋한다.

## 절차

1. `git status`와 `git diff HEAD`로 스테이징 여부와 무관하게 변경 전체를 파악한다.
2. **브랜치 확인**: 현재 브랜치가 `main`이면 직접 커밋하지 않는다. 변경 성격에 맞는 브랜치를 새로 파고(`git switch -c <type>/<요약>`) 그 위에 커밋한다. 이미 feature 브랜치면 그대로 진행한다.
3. 변경을 논리 단위로 그룹핑한다. 서로 다른 앱/관심사가 섞였으면 **여러 커밋으로 나눈다**.
4. 각 그룹마다:
   - 의도한 파일만 `git add`로 스테이징한다 (`git add -A` 남발 금지).
   - `type(scope): 설명` 형식의 한국어 메시지를 작성한다 (아래 규칙 준수).
   - `git commit`.
5. 마지막에 `git log --oneline -n <커밋수>`로 결과를 보여준다.

## 브랜치 규칙

- `main`에는 직접 커밋하지 않는다 — 먼저 브랜치를 판다.
- 브랜치명: `<type>/<kebab-요약>` (커밋 type과 맞춤). 예: `feat/plco-invite-room`, `fix/gymlog-ranking`.
- 브랜치 생성 후에도 push는 요청이 있을 때만 한다.

## 규칙 (CLAUDE.md 커밋 컨벤션 요약)

- **type**: `feat` · `fix` · `refactor` · `chore` · `docs` · `style` · `test`
- **scope**: 앱·패키지명(`plco`/`gymlog`/`hub`/`dansoon`/`tokens`/`ui` …), 전역이면 생략
- **설명**: 한국어·간결·명령형, 제목 끝 마침표 금지, 필요 시 `— 이유/절충` 부연
- **원자적**: 한 커밋 = 한 논리적 변경

## 하지 말 것

- 요청 없이 `git push` 하지 않는다.
- 관련 없는 변경을 한 커밋에 뭉치지 않는다.
- AI 서명 푸터(`Co-Authored-By` 등)를 붙이지 않는다 — 기존 히스토리와 통일.
- 스테이징에 비밀·`.env`·남은 `console.log`가 섞였는지 확인하고, 있으면 **경고 후 제외**한다.

`$ARGUMENTS`가 주어지면 그 지침(특정 파일만, 메시지 톤 등)을 우선 반영한다.
