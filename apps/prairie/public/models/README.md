# 모델

- `runner.glb` — 말. Quaternius LowPoly Animated Animals(CC0). 뼈·클립 이름은 `src/entities/runner/model/constants`에서 참조한다(원본 뼈대와 클립을 보존한다).

- `unicorn.glb` — 위 원본에 곡면 세분화와 꼬리 털 다발을 적용한 파생 모델. `node scripts/refine-runner.mjs`로 재생성한다. 현재 화면에서 사용하는 모델이다.

잔디 blade는 glb 없이 절차 생성한다(`src/entities/grass/model/constants`의 `makeBladeGeometry`). 다른 오브젝트도 전부 프로시저럴이다.
