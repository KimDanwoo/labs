# Unicorn Rush

유니콘과 함께 초원·강·하늘을 탐험하는 3D 플레이그라운드.

앱 식별자는 `prairie`를 유지한다. [라이브](https://prairie.danwoo.dev) · 개발 서버: `pnpm --filter prairie dev`.

- WASD/방향키 이동, Shift 질주, Space 이륙·상승, C 하강
- Q 가속, E 공중 회전
- 데스크톱 드래그로 좌우·상하 시점 회전
- 가까운 주행/넓은 풍경 시점 전환, 시점 복원, 접이식 조작 안내
- 모바일은 화면 드래그로 이동하고 별도 비행·스킬 버튼을 사용

## 렌더링

- 로컬 HDR 하늘과 재질 반사: 데스크톱 2K, 터치 기기 1K. 출처와 CC0 라이선스는 [환경 에셋](public/environments/README.md)에 기록한다.
- 원경 산맥의 높이·사면 명암은 12 KiB 텍스처로 한 번 구운다. 매 프레임 산맥 노이즈를 다시 계산하지 않는다.
- DPR은 프레임 여유와 화면 크기에 따라 조정한다. 렌더 픽셀 상한은 데스크톱 320만, 모바일 125만이다.
- 데스크톱은 bloom·FXAA·출력 톤 매핑을 적용하고, 성능이 낮아지면 직접 렌더링으로 전환한다. 터치 기기는 처음부터 직접 렌더링한다.
- 가까운 나무는 인스턴싱한 잎, 원경은 단순한 수관으로 그린다. 이동 때마다 씬 전체를 재생성하지 않는다.
- 지형·강·탐험 경로는 CPU 배치와 GPU 표현의 공통 설정을 사용한다.

## 검증

루트에서 실행한다.

```bash
pnpm --filter prairie lint
pnpm --filter prairie typecheck
pnpm --filter prairie test
pnpm --filter prairie build
pnpm --filter prairie test:e2e
```

브라우저 검증은 빌드 결과를 사용한다. 3D 픽셀 출력, 카메라 전환·복원·4K 리사이즈, 질주·이륙·착지, 모바일 터치·배경 요청을 확인한다. 실제 기기별 FPS는 GPU와 전원 상태에 따라 달라진다.

## 탐험과 에셋

바람의 나무·꽃잠 정원·노을의 문을 발견하고, 하늘의 빛 고리 7개를 순서대로 통과하는 바람길에 도전할 수 있다. 발견과 최고 기록은 `prairie.exploration.v1`로 이 브라우저에 저장한다. 저장 공간을 사용할 수 없어도 플레이는 계속된다.

`runner.glb`는 Quaternius의 CC0 원본으로 보존한다. 화면에서 사용하는 `unicorn.glb`는 원본 리그·애니메이션을 유지하면서 곡면 세분화와 꼬리 털 다발을 적용한 파생 모델이다. `pnpm --filter prairie exec node scripts/refine-runner.mjs`로 재생성할 수 있다. 테스트는 뼈대·애니메이션 보존과 가중치·법선·인덱스·삼각형 예산도 검사한다.

잔디 셰이더의 바람·색 그라데이션 기반은 [ghibli-grass-v2](https://github.com/Carbine28/ghibli-grass-v2), MIT, Copyright 2024 Wilson Ko다. 라이선스 원문은 [CREDITS.md](CREDITS.md)에 보존한다. HDR 하늘 출처는 [환경 에셋](public/environments/README.md)을 참고한다.
