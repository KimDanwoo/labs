# Danwoo Island

이전 이름은 Morning Drive(`apps/morning-drive`)다. 2026-11-13 포크 이식과 함께 이름을 바꿨다.

Bruno Simon의 `folio-2025`(MIT)를 포크한 3D 자유 주행 월드. Next.js 16 앱 안에서 원본 엔진을 그대로 돌리고, 화면의 HTML UI는 React 컴포넌트로 렌더한다.

```sh
pnpm --filter danwoo-island dev --port 3000
pnpm --filter danwoo-island build
pnpm --filter danwoo-island world:sync   # 월드 에셋·허브 콘텐츠만 준비
```

`dev`·`build`는 먼저 `world:sync`를 실행한다. 최초 1회는 GitHub에서 고정 커밋의 `static/`(약 200MB)을 받아 `public/world/`에 두고, 이후에는 커밋·허브 콘텐츠 해시가 같으면 건너뛴다. 원본 출처·라이선스·포크 이전 패치 기록은 [upstream/README.md](./upstream/README.md).

## 구조

```
app/page.tsx                 → @views/drive
src/views/drive/
  ui/DriveView.tsx           원본 index.html 본문(메뉴·모달·터치 버튼·알림 컨테이너) + 핵심 에셋 preload
  ui/WorldBoot.tsx           유일한 클라이언트 컴포넌트. effect에서 엔진을 한 번 시작
  ui/world.css               원본 Stylus의 Vite 결과 CSS (URL만 /world/로 교체)
  config/                    메뉴 섹션·조작표 데이터, worldAsset() 에셋 경로 헬퍼
  lib/bootWorld.ts           엔진 동적 import·중복 부팅 방지·분리된 DOM이면 새로고침
  lib/engine/                포크한 엔진. TS 전환 중 — 남은 .js만 ESLint 제외, 파일 camelCase·폴더 kebab-case. world가 진입점
  lib/engine/data/danwoo.js  허브 projects·profile에서 생성(커밋하지 않음)
  lib/engine/game/world/island*  열대 섬 소품·랜드마크·구조물(GLB 모델은 world-overrides/areas/island/models)
world-overrides/            world:sync가 public/world 위에 덮어쓰는 자체 에셋(벚꽃잎 잎 SDF 등)
```

- 엔진은 문서 수명과 같다. 정리(dispose) 경로가 없으므로 엔진 코드를 고친 뒤에는 브라우저를 새로고침한다.
- 1단계 이식 상태에서는 React가 마크업을 렌더하고 엔진이 그 DOM을 직접 조작한다. 해당 컴포넌트에 상태·조건부 렌더를 추가하기 전에 그 영역의 엔진 DOM 코드를 먼저 걷어낸다.
- 엔진의 에셋 상대 경로는 three 로더(`DefaultLoadingManager.setURLModifier`)와 Howler·지도·JSX에서 `worldAsset()`으로 `/world/`를 붙인다.

## 월드 내용

- 기본 차량은 검정 SUV, 출발 구역 입체 이름은 한글 `김단우`(MaruBuri Bold 윤곽선). W/A/S/D·방향키로 운전, B·Ctrl로 제동, M 지도, R 복귀.
- 프로젝트 전시·Lab 입구·경력(이력서)·소셜 표지판은 허브의 프로젝트 목록·링크에서 빌드 시 동기화한다. 허브 데이터를 바꾸면 `world:sync`가 다시 생성한다.
- 서버 연결·방명록·업적·순위 저장은 제거했다. 서킷 주행 시간·재도전과 로컬 장난감 반응은 유지한다.
- 작은 화면/터치 기기는 DPR 최대 1.5·150만 픽셀, 데스크톱은 DPR 최대 2·400만 픽셀로 렌더한다.
- `/work`는 `/`로 이동한다.

## 검증

루트 `pnpm lint`, `pnpm typecheck`, `pnpm test`와 `pnpm --filter danwoo-island build`. 자동 테스트는 에셋 경로 헬퍼만 다룬다. 주행·메뉴·지도·오디오·터치 흐름은 GPU 브라우저에서 확인한다.
