# Credits

이 앱의 잔디·하늘은 [ghibli-grass-v2](https://github.com/Carbine28/ghibli-grass-v2)에서 가져왔다.

- Copyright (c) 2024 Wilson Ko
- License: MIT

## 가져온 것

- **잔디 blade 모델**: `public/models/grass/iGrass.glb` (원본 에셋 그대로)
- **잔디 색/바람**: 원본 `BGrass.fs`의 밑동→끝 그라데이션(rgb 61,114,73 → 143,172,103 기반)과
  바람 버텍스 셰이더를 Next/Turbopack용 인라인 셰이더로 이식. 거리 페이드·돌풍·색 얼룩은 추가 튜닝.
- **하늘 큐브맵 스카이박스**: `public/assets/cubeMap/{px,nx,py,ny,pz,nz}.png` (원본 day 큐브맵).

## 가져오지 않은 것

- Totoro(= Studio Ghibli IP), night 큐브맵·HDR, 캐릭터 컨트롤러·물리(rapier)·leva·gsap·audio.

```
MIT License — Copyright (c) 2024 Wilson Ko
... (전문은 원본 저장소 LICENSE 참조)
```
