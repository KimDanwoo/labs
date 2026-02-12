# Awesome Sudoku

> 9x9 칸 안에서 벌어지는 두뇌 싸움.

클래식 스도쿠와 킬러 스도쿠를 지원하는 웹 기반 퍼즐 게임입니다.
TypeScript + Next.js로 만들었고, 알고리즘부터 UI까지 직접 구현했습니다.

## Preview

| Light | Dark |
|-------|------|
| *coming soon* | *coming soon* |

## Features

**Game**
- 4단계 난이도 (Easy / Medium / Hard / Expert)
- 클래식 모드 & 킬러 모드 (케이지 합산 규칙)
- 메모 모드, 힌트 시스템, 충돌 감지
- Undo / Redo
- 실수 5회 초과 시 게임 오버
- 게임 결과 바텀시트 (성공/실패 분기)

**Record & Stats**
- 난이도 기반 포인트 시스템 (4~10점)
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
- 드래그로 닫는 바텀시트, 토스트 알림
- Jonathan Ive 인스파이어드 미니멀 디자인

## Tech Stack

```
Next.js 15 (App Router + Turbopack)
React 19 · TypeScript · Tailwind CSS v4
Zustand v4 (persist middleware)
Firebase Auth + Firestore
```

## Architecture

[Feature-Sliced Design](https://feature-sliced.design/) 기반 구조.

```
src/
├── views/        # 페이지 (Home, Profile, Leaderboard)
├── widgets/      # 조합 UI (GameBoard, GameHeader, Overlays)
├── features/     # 기능 단위 (sudoku-game, auth, leaderboard...)
├── entities/     # 도메인 모델 (board, game, game-record)
├── shared/       # 공통 유틸 & UI (cn, BottomSheet, Snackbar...)
└── apps/         # 외부 서비스 초기화 (Firebase)
```

## Getting Started

```bash
git clone https://github.com/KimDanwoo/awesome-sudoku.git
cd awesome-sudoku
npm install
npm run dev
```

`http://localhost:3005`에서 확인할 수 있습니다.

## Roadmap

- [ ] PWA 지원
- [ ] 온라인 멀티플레이어 모드
- [ ] 퍼즐 공유 기능
- [ ] 게임 저장 & 이어하기

## License

MIT
