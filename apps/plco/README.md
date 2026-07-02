# plco (플코)

아이돌 컨셉 다마고치 게임. 캐릭터를 선택해 육성하고, 팬끼리 채팅 룸에서 미니게임을 즐기는 Next.js + Supabase 앱.

**라이브:** [plco-tamagochi.vercel.app](https://plco-tamagochi.vercel.app)

## 개요

PLAVE 멤버를 모티프로 한 5인 캐릭터 중 하나를 선택해 밥 주기, 씻기기, 놀아주기 등 돌봄 루프를 반복하며 레벨을 올린다. 캐릭터가 죽으면 리셋. 익명 로그인으로 시작해 Google 계정을 연동하면 멀티 디바이스 저장이 된다. 친구와 같은 채팅 룸에 입장해 미니게임 대결을 즐길 수 있다.

## 주요 기능

- **캐릭터 선택·육성** — 배고픔·청결·호감도 스탯 관리, 레벨·경험치 성장, 캐릭터 사망 & 부활
- **멀티 슬롯** — 캐릭터를 여럿 키우며 슬롯 간 전환
- **채팅 룸** — 실시간 채팅 (Supabase Realtime), 온라인 유저 표시, 방 생성·초대
- **미니게임** — 룸 안에서 플레이하는 대결형 게임
- **쇼핑** — 코인으로 아이템 구매, 인벤토리 관리
- **인증** — 익명 로그인 → Google OAuth 업그레이드 (Supabase Auth)

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) + React 19 |
| 언어 | TypeScript 5 |
| 스타일 | Tailwind CSS 4 |
| 상태관리 | Jotai (`atomWithReducer` + `selectAtom`) |
| 데이터 동기화 | LocalStorage + Supabase (`game_saves` JSONB) |
| 인증 | Supabase Auth (Anonymous → Google OAuth) |
| 실시간 | Supabase Realtime (채팅·온라인 유저) |
| 서버 캐시 | TanStack Query |

## 구조

```
app/                        # Next.js App Router (라우팅만)
  /, /play/[characterId]    # 게임 진입점
  /admin/                   # 관리자 CMS (캐릭터·퀴즈·미팅씬 편집)
  /api/                     # Route Handlers (admin API, auth callback)
src/
  entities/                 # 도메인 모델 (auth, chat-room, game)
  features/                 # 유저 인터랙션 단위 기능
    chat/                   # 채팅 송수신·삭제
    egg/                    # 알 부화 시퀀스
    feed/                   # 캐릭터 피드
    meeting/                # 미팅씬
    minigame/               # 미니게임
    room-lobby/             # 룸 로비·초대
    settings/               # 계정 설정
    shop/                   # 쇼핑
  views/                    # 페이지 단위 뷰 조합
    character-select/       # 캐릭터 선택 화면
    game/                   # 게임 플레이 화면
    death/                  # 사망 화면
  widgets/                  # 독립 UI 블록
    action-bar/             # 하단 액션 바
    game-room/              # 게임 룸
    rooms/                  # 룸 목록·생성
    status-bar/             # 상단 스탯 바
  shared/                   # 공유 상수·유틸·UI
```

아키텍처는 [FSD (Feature-Sliced Design)](https://feature-sliced.design/) 기반. `app/` 은 Next.js 라우터 역할만 하고 구현은 `src/` 안에서만 이루어진다.

## 환경 변수

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # 서버 전용, 클라이언트 번들에 포함 금지
```

## 시작하기

```bash
# 모노레포 루트에서
pnpm install
pnpm --filter plco dev   # http://localhost:3000
```

자세한 기능 설계는 [`docs/PRD.md`](./docs/PRD.md) 참고.
