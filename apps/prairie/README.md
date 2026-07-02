# prairie

3D 초원 위를 달리는 인터랙티브 비주얼 실험 — 기술 시연 목적의 단일 페이지 앱.

**라이브:** https://d-prairie.vercel.app

---

## 개요

React Three Fiber 기반의 실시간 3D 씬. 러너 캐릭터가 무한 초원을 달리며, 키보드(데스크톱) 또는 터치 조이스틱(모바일)으로 이동 방향을 제어한다. 잔디·하늘·마을 오브젝트로 구성된 환경은 렌더링 성능을 유지하기 위해 인스턴싱과 청크 분할을 사용한다.

---

## 기술 포인트

- **인스턴싱 잔디**: `InstancedMesh` 기반 청크 시스템. 카메라 주변 셀만 유지하고 멀어지면 재활용. 시드 기반 결정적 PRNG(mulberry32)로 셀마다 항상 같은 잔디 배치를 보장한다.
- **GLSL 잔디 셰이더**: ghibli-grass-v2(MIT, Wilson Ko)의 바람 버텍스 셰이더와 밑동→끝 색 그라데이션을 Next/Turbopack용 인라인 셰이더로 이식. 돌풍·거리 페이드·색 얼룩은 추가 튜닝.
- **GLTF 러너 애니메이션**: `useGLTF` + `useAnimations`로 캐릭터 로드. 이동 속도(`speedRef`)에 따라 idle↔run 가중치를 `useFrame` 루프에서 실시간으로 혼합한다(리렌더 없음).
- **모바일/데스크톱 품질 분기**: `pointer: coarse` 미디어 쿼리로 기기를 감지해 DPR과 잔디 블레이드 수를 각각 조정한다.
- **터치 조이스틱**: 손 댄 자리에 조이스틱이 생기는 방식(`onPointerDown` 기준점 동적 생성). `pointer-coarse` 환경에서만 렌더링.
- **씬 구성 오브젝트**: Ground, Pond, House, Tree, Haystack 등 마을 요소를 상수 배열로 선언적 배치. 큐브맵 스카이박스.
- **Three.js Fog**: 씬 전체에 fog를 적용해 잔디 청크 경계를 자연스럽게 감춘다.

---

## 기술 스택

| 분류 | 라이브러리 |
| --- | --- |
| 렌더링 | three.js, `@react-three/fiber` |
| 3D 유틸 | `@react-three/drei` (useGLTF, useAnimations, Sky) |
| 프레임워크 | Next.js (App Router) |
| 상태 | Jotai (`rideStore` — 씬 준비 상태) |
| 스타일 | Tailwind CSS 4, `@tokens/css` |
| 언어 | TypeScript 5 |

---

## 구조

FSD(Feature-Sliced Design) 기반.

```
src/
  app/providers/          # 전역 프로바이더
  views/ride/RideView     # 단일 뷰 — SceneCanvas·Hud·TouchControls 조립
  widgets/
    scene/                # SceneCanvas(R3F Canvas), SceneLoader, ReadySignal
    hud/                  # 키 안내 오버레이 (KeyCap)
  features/
    runner-control/       # 키보드·터치 입력 → RunnerRig 카메라 추적
  entities/
    grass/                # GrassField (청크 관리), GrassChunk (InstancedMesh)
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

잔디 blade 모델과 GLSL 셰이더 기반은 [ghibli-grass-v2](https://github.com/Carbine28/ghibli-grass-v2) (MIT, Copyright 2024 Wilson Ko)에서 가져왔다. 자세한 내용은 [CREDITS.md](./CREDITS.md) 참조.
