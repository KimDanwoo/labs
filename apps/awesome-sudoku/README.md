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
- 게임 결과 바텀시트 (성공/실패 분기, 완료 시간)
- 서버 없이 브라우저에서만 동작 (진행 중인 게임은 브라우저에 저장)

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
```

## Architecture

[Feature-Sliced Design](https://feature-sliced.design/) 기반 구조.

```
src/
├── views/        # 화면 (home) — 화면 전용 UI·상태 포함
├── features/     # 여러 화면에서 쓰는 동작 (theme)
├── entities/     # 여러 화면에서 쓰는 도메인 모델 (game, theme)
└── shared/       # 공통 유틸 & UI (cn, BottomSheet...)
```

## License

MIT
