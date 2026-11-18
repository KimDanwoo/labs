# Awesome Sudoku

> 9x9 칸 안에서 벌어지는 두뇌 싸움.

클래식 스도쿠와 킬러 스도쿠를 지원하는 웹 기반 퍼즐 게임입니다.
TypeScript + Next.js로 만들었고, 알고리즘부터 UI까지 직접 구현했습니다.

## Preview

| Light         | Dark          |
| ------------- | ------------- |
| _coming soon_ | _coming soon_ |

## Features

**Game**

- 4단계 난이도 (Easy / Medium / Hard / Expert)
- 클래식 모드 & 킬러 모드 (케이지 합산 규칙)
- 메모 모드, 힌트 시스템, 충돌 감지
- Undo / Redo
- 실수 5회 시 게임 오버
- 게임 결과 바텀시트 (성공/실패 분기)

**Record & Stats**

- 난이도·시간 기반 포인트 시스템 (쉬움 1~3, 중간 3~6, 어려움 6~9, 전문가 9~12점 · 킬러 모드 1점 감점)
- 게임별 기록 저장 (시간, 힌트, 실수, 포인트)
- 난이도별 통계, 완료율, 최고 포인트

**Social**

- Google 로그인
- 최고 기록 리더보드 (난이도/모드 필터)
- 누적 포인트 리더보드 (1~3위 메달)
- 프로필 페이지 (게임 상세 바텀시트)

**UI/UX**

- 다크 / 라이트 테마
- 반응형 레이아웃 (모바일 395px ~ 데스크탑)
- 드래그로 닫는 바텀시트
- Jonathan Ive 인스파이어드 미니멀 디자인

## Tech Stack

```
Next.js 16 (App Router + Turbopack)
React 19 · TypeScript · Tailwind CSS v4
Jotai v2 (state management)
Firebase Auth + Firestore
```

## Architecture

[Feature-Sliced Design](https://feature-sliced.design/) 기반 구조.

```
src/
├── views/        # 화면 (home, profile, leaderboard) — 화면 전용 UI·상태 포함
├── features/     # 여러 화면에서 쓰는 동작 (theme)
├── entities/     # 여러 화면에서 쓰는 도메인 모델 (game, session, theme)
├── shared/       # 공통 유틸 & UI (cn, BottomSheet, Snackbar...)
└── apps/         # 외부 서비스 초기화 (Firebase)
```

## Firestore 보안 규칙

규칙의 원본은 `firestore.rules`다. 게임 기록은 누구나 읽을 수 있고, 로그인한 사용자가 자기 기록만 만들 수 있으며 수정·삭제는 막는다. 기록을 만들 때 필드 목록, 난이도별 점수 범위(`POINT_RANGES`와 같은 값), 힌트·실수 개수, 서버 시각을 검사한다. 점수 계산식을 바꾸면 규칙의 범위도 함께 바꾼다.

```bash
pnpm --filter awesome-sudoku test:rules         # 에뮬레이터에서 규칙 테스트 (Java·firebase CLI 필요)
firebase deploy --only firestore:rules          # apps/awesome-sudoku에서 실행, 운영 반영
```

`test:rules`는 에뮬레이터가 필요해 기본 `pnpm test`와 CI에서는 돌지 않는다. macOS에서는 `brew install openjdk` 후 `/opt/homebrew/opt/openjdk/bin`을 PATH에 둔다.

## License

MIT
