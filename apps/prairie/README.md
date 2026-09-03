# prairie

3D 초원 위를 달리는 인터랙티브 비주얼 실험 — 기술 시연 목적의 단일 페이지 앱.

**라이브:** https://prairie.danwoo.dev

---

## 개요

React Three Fiber 기반의 실시간 3D 씬. 러너 캐릭터가 무한 초원을 달리며, 키보드(데스크톱) 또는 터치 조이스틱(모바일)으로 이동 방향을 제어한다. 잔디·하늘·마을 오브젝트로 구성된 환경은 렌더링 성능을 유지하기 위해 인스턴싱과 청크 분할을 사용한다.

---

## 기술 포인트

- **인스턴싱 잔디 + LOD**: `InstancedMesh` 기반 청크 시스템. 카메라 주변 셀만 유지하고 멀어지면 재활용. 시드 기반 결정적 PRNG(mulberry32)로 셀마다 항상 같은 잔디 배치를 보장한다. 진짜 blade는 72m까지(링 풀 2200·5분할 → 1500·2분할), 그 너머는 unlit 지면 셰이더의 잔디 인상 무늬(가늘고 긴 셀 + 얼룩, 멀어지면 흐려짐)가 이어가고 안개가 닫는다. blade는 멀어지며 안개색이 아니라 "그 자리 지면색(안개 적용)"에 녹아 청크 끝이 보이지 않는다. 링은 실제 밀도·크기는 버텍스 셰이더가 카메라 거리로 연속 계산한다(blade 인덱스 비율 `aLodIndex ≤ keep(d)`, 임계 근처는 자라나듯 커지고 멀리는 2배까지 확대) → 링 경계·거리 어디서도 팝 없음. 각 링 풀 ≥ 첫 링 풀 × keep(경계 거리) 불변식은 테스트로 고정. 삼각형은 원본 glb blade(144삼각형) 대비 약 1/20. blade는 절차 생성(glb 로드 없음). 프레임이 떨어지면 drei `PerformanceMonitor`로 DPR을 자동 하향한다.
- **GLSL 잔디 셰이더**: ghibli-grass-v2(MIT, Wilson Ko)의 바람 버텍스 셰이더와 밑동→끝 색 그라데이션을 Next/Turbopack용 인라인 셰이더로 이식. 돌풍·거리 페이드·색 얼룩·말 회피·질주 돌풍 파동은 추가 튜닝.
- **천마 변신(에셋 교체 없음)**: 말 glb의 `Head` 뼈에 `createPortal`로 뿔을, 루트에 절차적 빛의 날개(uv 수식 실루엣, 끝이 처지는 곡면 + 뒤로 젖힘이라 아래·뒤에서도 면이 보임)를 붙인다. 뼈에 스케일 100이 들어 있어 자식은 0.01로 보정. 머티리얼 이름(`Main`/`Hair`)별 색 덮어쓰기로 백마 + 라벤더 갈기.
- **비행**: 공중에서 Space를 누르고 있으면 상승, 놓으면 활공 속도로 하강(공중에서도 갤럽 애니메이션 유지), 고도 상한 14m(잔디 청크 반경이 원반으로 보이기 전). 카메라가 고도를 따라 오르고, 떠 있으면 발밑 잔디는 눕지 않는다.
- **질주·점프**: Shift 질주는 최고속도 ×1.6에 FOV가 벌어지고, 발동 순간 말에서 퍼지는 돌풍 파동이 잔디를 쓸고 지나가며(잔디 버텍스 셰이더 유니폼), 발굽에서 금빛 잔광(`SprintTrail`, additive)이 뒤로 흩날린다. 잔디는 질주 여부와 무관하게 말 주변 2.6m에서 말을 피해 눕는다. Space 점프는 포물선 홉(≈1.4m), 공중에선 물보라가 멈추고 물에 착지하면 한 번 크게 터진다.
- **GLTF 러너 애니메이션**: `useGLTF` + `useAnimations`로 캐릭터 로드. 이동 속도(`speedRef`)에 따라 idle↔run 가중치를 `useFrame` 루프에서 실시간으로 혼합한다(리렌더 없음).
- **모바일/데스크톱 품질 분기**: `pointer: coarse` 미디어 쿼리로 기기를 감지해 DPR과 잔디 블레이드 수를 각각 조정한다.
- **터치 조이스틱**: 손 댄 자리에 조이스틱이 생기는 방식(`onPointerDown` 기준점 동적 생성). `pointer-coarse` 환경에서만 렌더링.
- **씬 구성 오브젝트**: Ground, Pond, House, Tree, Haystack 등 마을 요소를 상수 배열로 선언적 배치. 큐브맵 스카이박스.
- **무한 반복 강**: Z축으로 무한한 강 골. 하상·수면 메시가 Z로 카메라를 따라가고 X는 가장 가까운 강 중심에 스냅한다 — 반복 주기(220)가 안개 시야(105×2)보다 넓어 화면에 강이 둘 이상 들어오지 않는 덕에 한 세트로 무한 반복이 성립한다. 강 기하(위치·하상 프로파일)는 `RIVER_GLSL` 하나를 Ground 구멍(`onBeforeCompile` discard), 하상 변위, 수심 계산이 공유하고, JS 쪽 같은 식(`riverBedDepthAt`)을 말의 y와 감속에 쓴다(중앙 수심 1.5m, 수심 비례 감속). 유니폼 갱신 없이 순수 수식. 물속을 달리면 수면이 말에 반응한다 — 물 셰이더가 말 위치·방향·속도 유니폼으로 뱃머리 파도(높이)와 V자 거품 항적(색·알파)을 그리고, `WadeSplash`가 속도 방향으로 늘어난 물보라(InstancedMesh 256개, 포물선 낙하, 수면 아래 소멸)와 퍼져나가는 파문 링을 얹는다. 말 상태는 `runnerState`(r3f 내부 공유 객체, 리렌더 없음)로 흘린다.
- **물 셰이더**: 하늘 큐브맵(`scene.background`)을 `samplerCube`로 받아 슐릭 프레넬로 비춘다 — 내려다보면 맑아 자갈이 비치고, 스치는 각에서는 하늘·구름이 반사된다. 추가 렌더 패스 없음. 파도 세 겹이 하류로 흐르고 유한차분 노멀로 태양 글린트, 수심 0 근처엔 거품선. 자갈 하상은 3×3 보로노이 프로시저럴(텍스처 없음) + 깊이 AO + 젖은 띠 + 물속 커스틱.
- **강 방위 HUD**: 강은 안개 밖에선 보이지 않아 화면 안내가 유일한 길잡이다. 카메라 yaw에서 화면 기준 방위(앞·뒤·좌·우)와 거리를 계산해 `rideStore`(외부 스토어)로 DOM HUD에 넘긴다 — r3f 루트와 DOM 루트가 달라 컨텍스트를 쓸 수 없다.
- **Three.js Fog + 지평선 헤이즈**: fog 범위를 기기별로 잔디 거리 페이드 뒤에 맞춰(데스크톱 36→105, 모바일 16→50) 잔디가 끝나는 곳에 색 띠가 생기지 않게 한다. 단색 fog 바닥과 그라데이션 큐브맵 하늘 사이의 선은 카메라를 따라다니는 원통(`Haze`)이 fog색→투명으로 녹여 지운다. 바닥 평면은 64×64로 분할한다 — fog 깊이가 정점에서 보간되므로 900m 삼각형 2개면 원경이 덜 안개 낀 채 대각선 경계가 생긴다(공중에서 확연).

---

## 기술 스택

| 분류       | 라이브러리                                        |
| ---------- | ------------------------------------------------- |
| 렌더링     | three.js, `@react-three/fiber`                    |
| 3D 유틸    | `@react-three/drei` (useGLTF, useAnimations, Sky) |
| 프레임워크 | Next.js (App Router)                              |
| 상태       | Jotai (`sceneReady`), 외부 스토어 (`rideStore`)   |
| 스타일     | Tailwind CSS 4, `@tokens/css`                     |
| 언어       | TypeScript 5                                      |

---

## 구조

FSD(Feature-Sliced Design) 기반.

```
src/
  app/providers/          # 전역 프로바이더
  views/ride/RideView     # 단일 뷰 — SceneCanvas·Hud·TouchControls 조립
  widgets/
    scene/                # SceneCanvas(R3F Canvas), SceneLoader, ReadySignal
    hud/                  # 강 방위·키 안내 오버레이 (KeyCap)
  features/
    runner-control/       # 키보드·터치 입력 → RunnerRig 카메라 추적
  entities/
    grass/                # GrassField (청크 관리), GrassChunk (InstancedMesh)
    river/                # River (무한 반복 강 — 물 셰이더 + 강변)
    runner/               # Runner (GLTF + 애니메이션 블렌딩)
    scenery/              # Scenery (Sky + 환경), Sky
    village/              # Ground, Pond, House, Tree, Haystack, Village
  shared/
    config/               # 씬 상수 (카메라·안개·조명·색)
    lib/                  # useCoarsePointer 훅
    r3f/                  # GltfModel 공용 래퍼, rideStore
```

---

## 실행

```bash
pnpm --filter prairie dev
```

`http://localhost:3001` 에서 확인 (포트는 turbo dev 설정에 따라 다를 수 있다).

---

## 크레딧

GLSL 잔디 셰이더 기반(바람·색 그라데이션)은 [ghibli-grass-v2](https://github.com/Carbine28/ghibli-grass-v2) (MIT, Copyright 2024 Wilson Ko)에서 가져왔다. 자세한 내용은 [CREDITS.md](./CREDITS.md) 참조.
