# GLTF 모델 슬롯 (하이브리드 에셋)

지금은 모든 오브젝트가 **프로시저럴 프리미티브**로 그려진다. 실제 `.glb` 모델로 교체하려면:

1. CC0 모델을 받아 이 폴더에 넣는다. 예: `bicycle.glb`
   - [Poly Pizza](https://poly.pizza) · [Kenney](https://kenney.nl/assets) · [Quaternius](https://quaternius.com) (모두 CC0)
2. 해당 엔티티 상수의 모델 경로를 채운다.
   - 자전거: `src/entities/bicycle/model/constants/index.ts` → `BICYCLE_MODEL_URL = '/models/bicycle.glb'`
3. 경로가 채워지면 `Bicycle` 컴포넌트가 프로시저럴 대신 `GltfModel`로 자동 전환된다.

draco 압축 모델도 지원한다(`shared/r3f/GltfModel`이 디코더를 필요 시 로드).
모델 단위 스케일·회전이 다르면 `GltfModel`에 `scale` / `rotation` props로 보정한다.
