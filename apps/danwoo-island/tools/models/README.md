# 섬 모델 생성 스크립트

섬 소품 GLB를 만드는 Blender 스크립트 모음이에요. 모두 앱 폴더(`apps/danwoo-island`)에서 실행해요.

## 준비

```bash
pnpm models:sources
```

원작 `folio-2025`의 고정 커밋(`scripts/worldSource.mjs`)에서 `resources/palette.png`와 `resources/folio-2025.blend`를 `tools/models/.sources/`로 받아요. 이미 있으면 건너뛰어요.

## 만들기

```bash
blender -b --factory-startup --disable-autoexec --python tools/models/<이름>.py
```

결과물은 `tools/models/.work/<묶음>/`에 GLB와 미리보기 PNG로 나와요. `.sources/`와 `.work/`는 커밋하지 않아요.

## 반영

1. 미리보기 PNG로 모양을 확인해요.
2. 쓸 GLB를 `world-overrides/areas/island/models/`로 복사해요.
3. `pnpm models:compress`로 압축해요.
4. `pnpm world:sync`로 `public/world`에 반영해요.
