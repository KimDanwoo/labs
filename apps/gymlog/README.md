# gymlog

헬스장에서 폰 하나로 루틴을 따라가고, 세트를 기록하고, 쉬는 시간을 챙기고, 달력으로 돌아보는 **모바일 우선 운동 동행 웹앱(PWA)**.

## 개요

웨이트 트레이닝 입문~중급자를 위한 운동 기록 앱. 큰 버튼·최소 입력 원칙으로 헬스장 환경(한 손 조작, 짧은 세트 간 시간)에 최적화했다. 종목 마스터 데이터(50종목), 프리셋 루틴(12개), 목표×난이도별 권장 렙/세트 테이블을 내장해 처음 시작하는 사람도 즉시 쓸 수 있다.

## 주요 기능

- **루틴 관리** — 직접 만들거나 프리셋(무분할·상하체·PPL·브로 스플릿 등)을 복제해 커스텀
- **세션 실행** — 종목 순서대로 진행, 세트별 무게·횟수 기록, 이전 기록 기반 기본값 자동 채움
- **휴식 타이머** — 세트 종료 시 자동 카운트다운 + 진동 알림
- **달력 & 히스토리** — 날짜별 운동 기록, 연속 운동(streak) 표시
- **랭킹** — 그룹 내 운동량 비교
- **PWA** — 홈 화면 설치, 오프라인 동작(로컬 우선 저장), Screen Wake Lock

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) + React 19 |
| 언어 | TypeScript 5 |
| 스타일 | Tailwind CSS 4 |
| 상태관리 | Jotai + localStorage (로컬 우선) |
| 백엔드 | Firebase (Auth + Firestore + Cloud Messaging) |
| 드래그 앤 드롭 | @dnd-kit |
| 공용 패키지 | `@ui/react`, `@tokens/css` |

## 구조

```
app/                       # Next.js App Router (라우팅만)
  /, /history, /plan, /ranking, /routines, /session, /settings, /onboarding
src/
  entities/                # 도메인 모델 (exercise, routine, session, profile, user)
  features/                # 유저 인터랙션 단위 기능
    auth/                  # Firebase 인증
    routine-builder/       # 루틴 생성·편집 (dnd-kit 정렬)
    session-runner/        # 세션 실행 + 휴식 타이머
    workout-plan/          # 오늘 운동 추천
    cloud-sync/            # Firestore 동기화
    ranking/               # 랭킹 조회
    notifications/         # 푸시 알림
  views/                   # 페이지 단위 뷰 조합
  widgets/                 # 독립 UI 블록 (app-header, bottom-nav, level-card, …)
  shared/
    firebase/              # Firebase 클라이언트 싱글턴
    training/              # 렙 스킴·부위 상수 (FSD 공유 어휘)
```

아키텍처는 [FSD (Feature-Sliced Design)](https://feature-sliced.design/) 기반. `app/` 은 Next.js 라우터 역할만 하고 구현은 `src/` 안에서만 이루어진다.

## 환경 변수

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase config 값은 공개 식별자이며, 보안은 Firestore 규칙과 Auth가 담당한다.

## 시작하기

```bash
# 모노레포 루트에서
pnpm install
pnpm --filter gymlog dev   # http://localhost:3000
```

자세한 기능 설계는 [`docs/PRD.md`](./docs/PRD.md) 참고.
