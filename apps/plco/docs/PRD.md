# PLCO GOTCHI — Product Requirements Document

> 본 문서는 현재 코드베이스(2026-05 기준) 구현 상태를 정리한 PRD다.  
> 초기 기획서 대비 변경된 부분이 많아 실 구현을 기준으로 다시 작성됐다.

---

## 1. 개요

- **프로젝트명**: PLCO GOTCHI
- **컨셉**: 플레이브(PLAVE) 멤버를 함께 키우는 다마고치 스타일 캐릭터 육성 게임
- **플랫폼**: 웹 (모바일 우선 반응형, max-w-md 기준 세로형 레이아웃)
- **아트 스타일**: 8비트 픽셀 스프라이트 + 동화풍 파스텔 배경 하이브리드
- **목표**: 배고픔/청결/행복 관리로 캐릭터를 유지하고, 미니게임/만남/상점/알 시스템으로 자원을 순환시키며 5명의 멤버를 모두 해금하는 컬렉션 게임

### 기술 스택

| 영역 | 사용 라이브러리 |
|------|-----------------|
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript 5 |
| 스타일 | Tailwind CSS 4 (`@theme inline` 토큰) |
| 상태관리 | Jotai (`atomWithReducer` + `selectAtom` 패턴) |
| 데이터 동기화 | LocalStorage + Supabase (`game_saves` JSONB) |
| 인증 | Supabase Auth (Anonymous → Google OAuth Link) |
| 패키지 매니저 | pnpm |

---

## 2. 캐릭터

### 2.1 선택 가능 캐릭터 (5인 PLAVE 멤버 모티프)

| ID | 표시명 | 시그니처 컬러 | 이모지 | 본명 모티프 |
|----|--------|---------------|--------|-------------|
| `yeko` | 예코 | `#2D2D5E` (네이비-퍼플) | 💜 | 남예준 / 돌고래 |
| `ako` | 아코 | `#FFD93D` (옐로) | 💛 | — |
| `bamko` | 밤코 | `#FF6B9D` (핑크) | 🩷 | — |
| `eunko` | 은코 | `#B0C4DE` (라이트블루) | 🤍 | — |
| `hako` | 하코 | `#4A90D9` (블루) | 💙 | — |

> 초기 PRD에 있었던 “양갈래(아기 캐릭터)” 시스템은 제거되고, **알 → 미해금 멤버 해금** 메커닉으로 대체됨.

### 2.2 멀티 슬롯 구조

- 한 유저(=계정 또는 로컬)에 **캐릭터별로 독립된 `GameState` 슬롯**을 갖는다.
- `characterStatesAtom: Record<CharacterId, GameState>` 형태로 보관.
- URL `/play/[characterId]` 가 source of truth — 진입 시 `activeCharacterIdAtom` 동기화.
- 캐릭터 전환은 URL 라우팅으로만 일어남(`router.push('/play/<id>')`). atom으로 화면 전환하지 않음.

---

## 3. 핵심 게임 루프

```
인트로 / 친구 목록
   │
   ├─ 신규: 캐러셀 → 닉네임 → /play/[id] 진입
   └─ 기존 슬롯: 카드 클릭 → /play/[id] 진입 (오프라인 진행 적용)
        │
        ▼
   메인 룸 (Living)
   ├─ 게이지: 배고픔 / 청결 / 행복
   ├─ 코인 잔액 + 레벨 표시
   ├─ 액션: 밥주기 / 청소 / 놀기(미니게임) / 만남 / 약(아플 때) / 상점
   ├─ 자동 전환 룸: 수면→Bedroom, 만남중→Outdoor, 똥있음→Bathroom
   └─ 행복 100 + Lv3 도달 → 🥚 알 등장 → 다른 멤버 해금
```

---

## 4. 기능 상세

### 4.1 캐릭터 선택 / 친구 목록 (`views/character-select`)

3단계 화면 흐름을 jotai atom으로 관리한다 (`stepAtom`).

1. **`INTRO`**: 신규 시작 / 구글 로그인 버튼. 게스트는 익명 로그인 자동 진행.
2. **`CAROUSEL`**: 좌우 스와이프(pointer event)로 캐릭터 탐색, “이 친구로 할래!” 확정.
3. **`NAME`**: 닉네임 입력 → 슬롯 생성 → `/play/[id]` 이동.

이미 해금된 친구가 1명 이상이면 인트로 대신 **친구 카드 리스트**(`FriendList`)가 우선 노출되고, 카드를 누르면 해당 슬롯으로 바로 진입한다.

### 4.2 메인 룸 (`views/game/GameView`)

- 구성: `StatusBar` + `Room` + `ActionButtons` + `GameMessages`(토스트) + `ModalRoot`
- 부수효과 훅:
  - `useAutoDecay` — 10초 주기 hunger/heart 감쇠 & 수면 판정 & TICK 디스패치
  - `useCharacterMovement` — 캐릭터 랜덤 이동
  - `useBathroomExit` — 똥이 모두 사라지면 5초 후 거실 복귀

#### 4.2.1 룸 전환 규칙 (`roomTypeAtom`)

| 조건 | 룸 | 배경 |
|------|------|------|
| `isSleeping` | `bedroom` | `room_2.webp` |
| 만남 모달 오픈 | `outdoor` | `room_4.webp` |
| 똥 1개 이상 → 모두 청소 후 5초 유예 | `bathroom` | `room_3.webp` |
| 그 외 | `living` | `room_1.webp` |

#### 4.2.2 캐릭터 클릭 인터랙션

- 자거나 졸린 상태(`isDrowsy`)면 깨우기(`WAKE_UP`).
- 평상시: 점프 애니메이션 + 머리 위 💕 플로팅 이펙트.

### 4.3 게이지 시스템

| 게이지 | 최대 | 자동 감소 | 회복 트리거 |
|--------|------|-----------|--------------|
| 배고픔(`hunger`) | 100 | 매 분당 1 (수면 시 ×0.5, 행복≥50 ×0.8, 행복=0 ×1.5, 아플 때 ×2) | 음식 섭취 |
| 청결(`cleanliness`) | 100 | 똥 1개당 −10 | 청소(똥 클릭/일괄 청소) |
| 행복(`hearts`) | 100 | 아플 때 10초당 −1 | 밥주기 +3 / 청소 +2 / 만남 / 미니게임 / 상호작용 |

추가 메커닉:

- **과식 페널티**: hunger가 100인 상태에서 또 먹이면 hunger 감소 + hearts −3 + “이미 배불러요...” 토스트.
- **아픔(`isSick`)**: 똥이 `SICK_POOP_THRESHOLD = 4`개 누적되면 발병. 회복: 약(💊, 15코인).
- **사망 조건**: `hungerZeroSince` / `cleanlinessZeroSince` / `sickSince`가 **`DEATH_THRESHOLD_MS = 3일`** 이상 지속.
- **오프라인 처리**: 재진입 시 `PROCESS_OFFLINE` 액션으로 경과시간 기반 배고픔 감쇠, 사망 판정 일괄 적용 (최대 24시간 캡).

### 4.4 똥 시스템

- 밥 먹은 뒤 20초 후 캐릭터 좌표 부근에 똥 스폰(`pendingPoops` → `TICK`에서 생성).
- 똥 클릭 시 단일 청소(+2코인, +3xp, +2hearts, +10cleanliness).
- 일괄 청소 버튼은 추가로 +3 보너스 코인.

### 4.5 수면 시스템

- 매일 **22:00 ~ 08:00**에 자동 수면.
- 수면 상태에서 배고픔 감소 절반.
- 캐릭터 클릭 시 강제 기상(`WAKE_UP`), `wokeUpAt` 기록 후 5분간 “졸림” 유예 → 다시 수면 진입.

### 4.6 액션 바 (`widgets/action-bar`)

| 버튼 | 기능 | 비활성 조건 | 뱃지 |
|------|------|--------------|------|
| 🍖 밥주기 | FeedModal 오픈 | 인벤토리 식료품 0 | — |
| 🧹 청소 | 즉시 일괄 청소 | 똥 0개 | 똥 개수 |
| 🎮 놀기 | MiniGameModal 오픈 | 쿨다운 중 | 남은 시간 |
| 💌 만남 | MeetingModal 오픈 | 쿨다운/일일 3회 소진 | 남은 횟수 또는 ⛔ |
| 💊 약주기 | 즉시 GIVE_MEDICINE | 코인<15 또는 정상 | 아플 때만 노출 |
| 🏪 상점 | ShopModal 오픈 | — | — |

### 4.7 만남 시스템 (`features/meeting`)

- 5분 쿨다운, 하루 3회 제한 (`meetingDay` 키로 일일 카운트 리셋).
- 페이즈: `SEARCHING → FOUND → CHAT → RESULT`
  1. 검색 2초 후 같은 멤버 외 랜덤 매칭 + 랜덤 닉네임 부여.
  2. CHAT 3라운드 — 라운드당 객관식 옵션 중 선택 (`good`/`ok`/`awkward` 분기 + 상대 반응 문구).
  3. RESULT — 누적 행복도 + 코인 보상. 전 라운드 `good` 시 +10 코인 보너스 + “완벽한 만남” 표기.

### 4.8 미니게임 (`features/minigame`)

3개 모드를 단일 모달 내 선택형으로 제공한다. 모드 진입 = 별도 게임 컴포넌트 마운트.

| 모드 | 설명 | 보상 |
|------|------|------|
| 💖 하트 캐치 | 떨어지는 이모지(💖⭐🌟💕🎵)를 좌우 이동으로 받기 + 폭탄 회피 | `correctCount` 비례 코인/행복/경험치 |
| 🏃 플코런 | 탭 점프로 장애물 회피, 하트 픽업으로 점수 누적, 베스트 점수 LocalStorage 저장 | 동일 |
| 💡 PLCO 취향 퀴즈 | 활성 멤버 전용 문제 풀(예코:30+/멤버별)에서 3문제 랜덤, 객관식 4지선다 + 정답 후 fact 노출 | 동일 |

- **쿨다운**: 미니게임 클리어 시 `lastMinigameAt` 갱신, 다음 플레이까지 `MINIGAME_COOLDOWN_MS = 3분`.
- 정답/획득 1개당: 코인 +3 / 행복 +2 / 경험치 +4.

### 4.9 상점 (`features/shop`)

탭 2종:

- **음식** — 4종 구매(빵 10/주먹밥 20/고기 50/케이크 100).
- **교환** — 행복도 10 → 코인 15.

### 4.10 알 / 멤버 해금 (`features/egg`)

- 트리거: `hearts >= 100` AND `level >= 3` 일 때 미해금 멤버 중 1명을 `eggReadyCharacterId`로 지정.
- 모달 자동 오픈 (`ModalRoot`에서 100ms 후 푸시).
- 페이즈: `EGG → HATCHING → REVEAL`. REVEAL 시 캐릭터 스프라이트 + 닉네임 표기, 받기 버튼.
- 수령 시 `hearts = 0`, 해당 멤버 `unlockedCharacters`에 추가.
- 이미 5명 모두 해금된 상태라면 보너스 코인 +100으로 대체.

### 4.11 일일 출석 (`features/daily-login`)

- 7일 누적 보상 테이블: 코인 + 식료품. 7일차에 고기 1 + 빵 2 등 최대 보상.
- `STREAK_RESET_HOURS = 48` 경과 시 streak 리셋.
- (UI는 작성되어 있으며, 트리거 연결은 추후 활성화 단계)

### 4.12 사망 / 리셋 (`views/death`)

- 사망 화면: 캐릭터 회색 처리 + “{닉네임}(이)가 떠났어요...” + “다시 시작하기” 버튼.
- `RESET` 액션: `coins`와 `unlockedCharacters`는 보존, 게이지/인벤토리 등은 초기값.

### 4.13 설정 (`features/settings`)

- 계정 상태(게스트 / 구글 연동) 표시.
- 게스트일 때: **지금 진행도 구글에 묶기**(`linkIdentity`) / **다른 기기 데이터 가져오기**(`signInWithOAuth`) 분리 제공.
- 다른 친구 키우러 가기(`/` 이동), 게임 초기화(`RESET`, 2단계 확인).

---

## 5. 상태 모델

### 5.1 `GameState` 필드 요약

```ts
type GameState = {
  status: GameStatus;            // selecting | playing | dead | meeting
  characterId: CharacterId | null;
  nickname: string;
  level: number; exp: number;
  hunger: number; cleanliness: number; hearts: number; coins: number;
  poops: Poop[];
  inventory: Record<FoodId, number>;
  pendingPoops: number[];        // 곧 떨어질 똥의 출현 예정 시각
  lastUpdated: number;
  hungerZeroSince: number | null;
  cleanlinessZeroSince: number | null;
  isSleeping: boolean; wokeUpAt: number | null;
  isSick: boolean; sickSince: number | null;
  unlockedCharacters: CharacterId[];
  levelUpMessage: string | null;
  feedingMessage: string | null;
  eggReadyCharacterId: CharacterId | null;
  lastMeetingAt: number | null;
  meetingsToday: number; meetingDay: string | null;
  lastMinigameAt: number | null;
};
```

### 5.2 Jotai 구성

- `gameAtom`: `atom<GameState, [GameAction], void>` — 액티브 슬롯에 대해 `gameReducer` 위임.
- 자주 변하는 값은 `selectAtom`으로 개별 노출 (hunger/cleanliness/hearts/poops 등).
- 도메인 액션은 `useGameActions()` 훅으로 묶음 노출 — 컴포넌트는 필요한 액션만 구조분해해서 호출.
- 컴포넌트 간 prop drilling 금지(부모는 분기·합성, 자식은 구독·실행).

---

## 6. 데이터 동기화

### 6.1 저장소 우선순위

1. **In-memory atom** (`characterStatesAtom`)
2. **LocalStorage** key `plco-damagochi-saves` (구버전 `plco-damagochi-state` 자동 마이그레이션)
3. **Supabase `game_saves`** (`unique(user_id)` 한 행, `state` JSONB)

### 6.2 동기화 흐름 (`useGameSync`)

1. 마운트 시 LocalStorage 로드 → atom으로 머지.
2. 로그인된 `userId`가 있으면 Supabase에서 fetch → atom과 머지.
3. atom 변경마다 LocalStorage write.
4. 인증된 유저는 3초 디바운스로 Supabase upsert.
5. 머지 규칙: 슬롯별 `lastUpdated`가 더 큰 쪽을 유지(자동 머지, 사용자 confirm 없음).

### 6.3 인증 (`useAuth`)

- 진입 직후 자동 익명 로그인 (`signInAnonymously`).
- 구글 OAuth — 새로 로그인 / 기존 익명 계정에 link.
- 콜백 라우트: `/auth/callback/route.ts`.

### 6.4 Supabase 스키마 (`supabase/schema.sql`)

| 테이블 | 용도 |
|--------|------|
| `profiles` | auth.users → 닉네임 등 프로필 |
| `game_saves` | `state` JSONB(`{ characterStates }`) + `last_updated` |
| `daily_logins` | 출석 기록 (date / streak / 보상) |
| `achievements` | 캐릭터별 누적 통계 (피드/청소/만남/육성 횟수 등) |

RLS 정책: 본인 데이터만 access. 회원가입 시 `handle_new_user` 트리거로 profiles 자동 생성.

---

## 7. 라우팅 / 화면 구조

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | `CharacterSelectView` | 인트로 / 캐러셀 / 닉네임 / 친구 목록 분기 |
| `/play/[characterId]` | `GameView` | 활성 슬롯의 메인 룸 + 모달들 |
| `/auth/callback` | route handler | OAuth 콜백 |

URL 파라미터가 atom의 source of truth. 잘못된 `characterId` 또는 미존재 슬롯은 `/`로 replace.

---

## 8. 아키텍처 (FSD 2.1)

```
src/
├── app/        — Next.js App Router (page, layout, sync-provider)
├── views/
│   ├── character-select/ (CharacterSelectView, intro/carousel/nickname/friend-list)
│   ├── game/             (GameView + GameMessages, ModalRoot, ToastMessage)
│   └── death/            (DeathScreen)
├── widgets/
│   ├── status-bar/       (게이지 + 닉네임 + 코인 + 설정)
│   ├── game-room/        (Room — 배경/캐릭터/똥/오버레이)
│   └── action-bar/       (ActionButtons)
├── features/
│   ├── feed/        ├── shop/      ├── meeting/
│   ├── minigame/    ├── egg/       ├── daily-login/
│   └── settings/
├── entities/
│   ├── auth/   (useAuth)
│   └── game/   (reducer + atoms + hooks: actions/decay/movement/status/sync/bathroom)
└── shared/
    ├── ui/ (CharacterSprite, EggLoading, GoogleIcon)
    ├── types/ (game), constants/ (game, sprite), lib/ (supabase client)
```

### 8.1 강제 규칙 (ESLint + CLAUDE.md)

- 레이어 의존성: `app → views → widgets → features → entities → shared` (단방향).
- 슬라이스 루트(`@widgets/X`, `@views/X` …) 직접 import 금지. **항상 `ui/`, `model/...` 세그먼트까지 명시**.
- View 메인 파일 외 모든 컴포넌트는 `ui/` 하위 파일로 분리.
- 매직 스트링(`status`, `phase`, `modalType` 등)은 `as const` 상수로 추출 (`GAME_STATUS`, `MODAL_TYPE`, `ROOM_TYPE`, `MEETING_PHASE`, `EGG_PHASE`, `MINIGAME_PHASE`, `RUN_PHASE`).

---

## 9. 밸런스 상수 (`src/shared/constants/game.ts`)

| 상수 | 값 | 비고 |
|------|------|------|
| `MAX_HUNGER` / `MAX_CLEANLINESS` / `MAX_HEARTS` | 100 | |
| `HUNGER_DECAY_PER_MINUTE` | 1 | 수면 ×0.5, 행복≥50 ×0.8, 행복=0 ×1.5, 아픔 ×2 |
| `CLEANLINESS_PER_POOP` | 10 | |
| `DEATH_THRESHOLD_MS` | 3일 | hunger/cleanliness/sick 공통 |
| `SICK_POOP_THRESHOLD` | 4 | |
| `MEDICINE_PRICE` | 15 | |
| `COINS_PER_CLEAN` | 2 | 일괄청소 보너스 +3 |
| `COINS_PER_MEETING` | 5 | 완벽 보너스 +10 |
| `HEARTS_PER_FEED` / `HEARTS_PER_CLEAN` | 3 / 2 | |
| `HEART_DECAY_WHEN_SICK` | 1 / 10s | |
| `OVERFEED_HEART_PENALTY` | 3 | |
| `MEETING_COOLDOWN_MS` | 5분 | |
| `MEETING_DAILY_LIMIT` | 3 | |
| `MEETING_ROUNDS` | 3 | |
| `MEETING_REWARD_GOOD/OK/AWKWARD` | 6 / 3 / 0 | 라운드당 행복 |
| `HEART_EXCHANGE_UNIT/COINS` | 10 / 15 | |
| `EGG_HEART_THRESHOLD` | 100 | |
| `EGG_LEVEL_THRESHOLD` | 3 | |
| `EGG_ALL_UNLOCKED_COINS` | 100 | 5명 모두 해금 시 보너스 |
| `MINIGAME_COIN_PER_CORRECT` | 3 | |
| `MINIGAME_HEART_PER_CORRECT` | 2 | |
| `MINIGAME_EXP_PER_CORRECT` | 4 | |
| `MINIGAME_COOLDOWN_MS` | 3분 | |
| `LEVEL_SCALE_PER_LEVEL` | 0.05 | 캐릭터 사이즈 보정 |
| `SLEEP_START_HOUR` / `SLEEP_END_HOUR` | 22 / 8 | |
| `WAKE_UP_GRACE_MS` | 5분 | 졸림 유예 |
| `DANGER_THRESHOLD` / `WARNING_THRESHOLD` | 20 / 40 | 게이지 색 변경 |

### 레벨업 보상 (`LEVEL_REWARDS`)

| 레벨 | 보상 |
|------|------|
| 2 | 빵 ×2, 30코인 |
| 3 | 주먹밥 ×2, 50코인 |
| 4 | 고기 ×1, 80코인 |
| 5 | 케이크 ×1, 150코인 |

레벨 임계값 (`LEVEL_THRESHOLDS`): `[0, 50, 150, 300, 500]`.

---

## 10. 아트 & 에셋

### 스프라이트

- 멤버 5종 — `SPRITE_MAP[characterId]` 기준 시트 (`FRAME_SIZE`/`SHEET_SIZE` 상수로 슬라이스).
- 방향: `up / down / left / right` 4행, `TOTAL_FRAMES` 프레임의 워크 사이클.
- idle 상태는 `down` 행의 0번 프레임 고정.
- 레벨에 따라 `1 + (level-1) * 0.05` 만큼 스케일 업.
- 상태 오버레이: 수면(💤 Z 자), 졸림(z), 질병(💀 펄스), 사망(`death-animation` 클래스 + opacity 0.5).

### 배경

- `room_1.webp`(거실) / `room_2.webp`(침실) / `room_3.webp`(화장실) / `room_4.webp`(야외) — webp 우선, png 폴백.
- 거실/침실 전환 시 부드러운 opacity 전환(`transition-opacity duration-500`).

### 타이포 / 컬러 토큰

- 메인 폰트: `Gowun Dodum` (Korean handwriting style).
- Tailwind 4 `@theme inline` 토큰: `gold`, `card-bg`, `gauge-hunger`, `gauge-clean`, `gauge-heart` 등 — `[var(--…)]` 임의값 사용 금지.

---

## 11. 구현 현황 / Phase 로드맵

### ✅ 완료 (현 코드베이스 반영)

- 캐릭터 슬롯 5종 + URL 라우팅
- 게이지/사망/리셋/오프라인 처리
- 똥 시스템(자동 생성/지연 큐/일괄 청소/질병)
- 수면/졸림/약 시스템
- 만남(검색→매칭→대화 3R→결과) + 쿨다운/일일 제한
- 미니게임 3종(하트 캐치 / 플코런 / 멤버 퀴즈) + 쿨다운
- 상점(음식/하트 교환) + 레벨업 보상
- 알 시스템(다른 멤버 해금) + 자동 모달 오픈
- LocalStorage + Supabase 동기화 (자동 머지)
- 익명 로그인 → 구글 OAuth link / 가져오기
- 룸 4종 자동 전환 (거실 / 침실 / 화장실 / 야외)

### 🟡 후속 / 다듬기

- 일일 출석 트리거 연결 (UI는 완료, 진입 동작 wire-up)
- 캐릭터별 도감(`achievements`) 통계 표시
- 사운드 / BGM
- 잠금 친구를 카드 형태로 노출(미스터리 모드)
- 알 해금 보상 결과 화면의 상세 강조 (이펙트)

### 🔴 향후 검토

- 실시간 매칭(Supabase Realtime) — 현재는 클라이언트 시뮬레이션
- 푸시 알림 / PWA
- 친구 ↔ 친구 사이 상호작용 (선물, 방문)
- 의상 / 악세서리 커스터마이즈

---

## 12. 코드 컨벤션 (요약, 자세한 규칙은 `CLAUDE.md`)

- 함수 컴포넌트, `type` 우선, `any` 금지.
- 비동기 — React Query 가능 시 우선(현재는 Supabase + jotai만).
- 훅: 최상위 호출, `use` prefix, deps 명시. `useEffect` 남용 금지.
- 매직 리터럴 금지 — `as const` 상수 객체 + 파생 타입.
- 슬라이스 루트 import 금지 — 항상 세그먼트(`/ui`, `/model/hooks` 등) 명시.
- 컨테이너 vs presentational 분리, prop drilling 금지(필요한 atom/액션을 직접 구독·호출).
- 컬러는 Tailwind 토큰으로만, 인라인 `[var(--…)]` 금지.

---

## 13. 성공 지표 (제안)

| 지표 | 목표 |
|------|------|
| 일일 재접속률 | 활성 슬롯 보유자 기준 60% 이상 |
| 평균 세션 시간 | 4분 이상 |
| 미니게임 이용률 | 활성 세션 중 50% 이상 |
| 만남 일일 이용률 | 30% 이상 |
| 멤버 해금 완주율(5/5) | 신규 진입 후 30일 내 15% |
| 구글 연동율 | 게스트 진입자 중 25% 이상 |
