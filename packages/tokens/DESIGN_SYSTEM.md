# Danwoo 디자인 시스템 — 통합 스펙

> **상태**: P1·P2 완료. P1=토큰 OKLCH 재작성 + `--brand-hue` seam(이름 하위호환). P2=앱별 스킨 — hub(코발트+Plus Jakarta Sans)·gymlog(코발트+Space Grotesk)는 기존 반영 확인, prairie에 Sora 추가(색은 코발트 공유). **색은 코발트 단일, 정체성은 디스플레이 폰트로** 원칙 확정. 다음은 P3(cheongyeon·fe-deep를 베이스로 이관). 기본값: 중립 gray 고정 hue264 · accent=브랜드 subtle 표면 · brand-hue 265.
> **한 줄**: 프딥 수준의 **OKLCH 단일 베이스**를 만들고, 앱은 **아주 얇은 스킨(브랜드 hue + 디스플레이 폰트)**만 덧입혀 정체성을 유지한다.

## 1. 목표 & 원칙

- **하나의 잘 만든 시스템을 돌려쓴다.** 소스 오브 트루스는 `packages/tokens`(→ `@tokens/css`).
- **"베이스 + 스킨"으로 클론화 방지.** 과거 실패("앱이 다 hub 같고 AI스럽다")를 구조로 차단한다.
  - **베이스(공유)**: 구조·중립 스케일·상태색·시맨틱 토큰 *이름 계약*·`@ui/react` 컴포넌트. 기본 브랜드 = 코발트.
  - **스킨(앱별, 최소)**: ① 브랜드 **hue 1개** ② **디스플레이 폰트** ③ (선택) 밀도. 이 이상은 오버라이드하지 않는다.
- **절제된 모던 유지**: 그라데이션·큰 글로우·grain·shimmer 지양. 강조는 단색 브랜드 1곳.

## 2. 색공간 — OKLCH

- 프딥이 이미 채택. hex 대비 **지각적 균일성**이 높아 스케일이 매끈하고 대비 계산이 안정적.
- **핵심 이점**: L(밝기)·C(채도) 고정 + **hue만 회전**하면 앱별 브랜드색이 같은 시스템에서 자동으로 조화롭게 나온다. → 스킨이 사실상 `--brand-hue` 하나로 끝난다(hex로는 불가능).

## 3. 아키텍처 (3-tier)

```
primitives(원자)      →  semantic(역할 alias)   →  skin(앱 오버라이드)
oklch(L C H) 스케일       --color-primary 등          --brand-hue / --font-display
```

- **primitives**: 브랜드 램프 + 중립(gray) + 상태(green/red/amber/…) + (opt-in) 차트 hue.
- **semantic**: primitives를 역할로 alias(light/dark 2값). codegen 입력.
- **skin**: 앱 `globals.css`가 `@tokens/css/theme.css`를 import한 뒤 `:root`에서 소수 변수만 덮어씀.

## 4. 브랜드 hue 회전 seam (스킨의 심장)

브랜드 램프를 **hue를 변수로** 정의한다:

```css
/* theme.css (생성물) — 개념 예시 */
:root {
  --brand-hue: 266;               /* 코발트 기본값 */
  --brand-600: oklch(0.47 0.22 var(--brand-hue));   /* primary(light) 앵커 */
  --brand-400: oklch(0.66 0.18 var(--brand-hue));   /* primary(dark) */
  /* …50–900 램프 전부 hue만 변수 참조 */
}
```

앱은 이렇게만 리스킨한다:

```css
/* apps/<app>/src/app/globals.css */
@import '@tokens/css/theme.css';
:root {
  --brand-hue: 150;               /* 예: 이 앱은 그린 계열 */
  --font-display: var(--font-space-grotesk);
}
```

- L·C는 베이스가 잡으므로 어떤 hue를 넣어도 **대비·톤이 붕괴하지 않는다**.
- 중립(gray)은 기본적으로 **고정 쿨톤**(안정성 우선). 원하면 `--brand-hue`를 살짝 섞는 옵션을 둘 수 있으나 기본 off.

## 5. 시맨틱 토큰 계약 (통일 이름)

현재 공유 토큰 + 프딥 계약을 병합한 **상위집합**. 이름은 고정, 값은 primitives 참조.

### Core (모든 앱 필수)
| 그룹 | 토큰 |
|---|---|
| Surface | `background` `foreground` `card` `card-foreground` `card-border` `muted` `muted-foreground` |
| Brand | `primary` `primary-foreground` `primary-subtle` `primary-accent` |
| Accent 표면 | `accent` `accent-foreground` (= 브랜드 연한 틴트 표면; 프딥 호환) |
| Secondary | `secondary` `secondary-foreground` `secondary-subtle` |
| Form/Line | `border` `input` `ring` |
| Status | `success` `error`(=destructive) `warning` `info` + 각 `-foreground` `-subtle` |
| Effect | `glass` `glass-border` `glow` `glow-strong` |

> 마이그레이션 호환: 프딥의 `destructive`는 `error`로, `accent`는 유지(브랜드 subtle 표면 역할로 정렬).

### Opt-in (성격 맞는 앱만)
| 그룹 | 토큰 | 대상 |
|---|---|---|
| Charts | `chart-1`…`chart-5` (고유 hue) | 데이터 시각화(프딥) |
| Sidebar | `sidebar-*` | 관리자/대시보드(프딥 admin) |
| Reading | 본문 17px·프로즈 measure 스케일 | 장문 콘텐츠(프딥) |

- 게임·3D 앱(plco·prairie)은 opt-in 미사용. 베이스는 이들에게 짐이 되지 않는다.

## 6. 다크 모드

- 프딥 방식 유지: `.dark`에서 semantic 재매핑(브랜드는 밝은 스텝 up, foreground 반전). primitives는 공유.
- `@custom-variant dark (&:where(.dark, .dark *))` 현행 유지.

## 7. 스킨 계약 (앱이 오버라이드하는 것 — 이게 전부)

| 변수 | 의미 | 기본값 |
|---|---|---|
| `--brand-hue` | 브랜드 램프 hue 회전 | `266`(코발트) |
| `--font-display` | 제목용 디스플레이 폰트 | `var(--font-sans)` |
| `--density`(선택) | 여백 배율 | `1` |

- 앱별 정체성은 **폰트로** 주로 준다(취향과 일치): 예) gymlog=Space Grotesk, hub=Plus Jakarta Sans.
- 그 외 토큰 오버라이드는 **금지**(클론화·불일치 방지). 새 색이 필요하면 베이스에 추가.

## 8. 파이프라인 규칙 (현행 유지)

- `packages/tokens/src/*.ts`가 유일 소스. 수정 후 `pnpm tokens`로 `generated/theme.css` 재생성.
- **`generated/theme.css`는 AUTO-GENERATED — 직접 수정 금지.**
- 앱은 토큰 유틸만 사용(임의 hex/px 금지). 카탈로그(`apps/design`)처럼 토큰 값 자체를 보여주는 경우에만 inline 예외.

## 9. 마이그레이션 단계

| 단계 | 내용 | 리스크 |
|---|---|---|
| **P0** | 이 스펙 확정 | — |
| **P1** | `packages/tokens` OKLCH 재작성 + hue seam. **시맨틱 이름 하위호환 유지**(hub/gymlog/prairie 안 깨지게). `apps/design` 카탈로그로 검증 | 중 — 값 변화, 이름 유지로 완화 |
| **P2** | hub/gymlog/prairie에 스킨(hue+디스플레이 폰트) 부여 | 저 |
| **P3** | cheongyeon·프딥을 베이스로 이관. 프딥은 charts/sidebar/reading을 opt-in으로 유지, `--brand-hue`만 코발트(또는 자기 hue) | 중 — 앱별 QA 필요 |

- 각 단계 후 `pnpm --filter <app> build`로 검증. 실제 적용은 사용자 확인 후 진행.

## 10. 열린 결정 (P1 착수 전 확정)

1. **중립 hue**: 완전 고정 vs `--brand-hue` 살짝 반영(기본 off 제안).
2. **코발트 OKLCH 최종값**: 4절 램프는 목표치. L/C 미세조정은 P1에서 카탈로그 보며 확정.
3. **`accent` 의미**: 프딥의 "브랜드 연한 표면"으로 통일(= 기존 `primary-subtle`과 관계 정리).
