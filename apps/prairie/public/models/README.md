# 모델

- `unicorn.glb` — 화면에서 쓰는 유니콘. 원본 말 모델(`scripts/runner/source/runner.glb`, Quaternius LowPoly Animated Animals, CC0)에 곡면 세분화와 꼬리 털 다발을 적용한 파생 모델이다. `node scripts/refine-runner.mjs`로 재생성한다. 뼈·클립 이름은 `src/views/ride/model/runner/constants.ts`에서 참조한다(원본 뼈대와 클립을 보존한다).

원본 `runner.glb`는 생성 스크립트의 입력이라 배포 폴더(`public`) 밖에 둔다.

잔디 blade는 glb 없이 절차 생성한다. 다른 오브젝트도 전부 프로시저럴이다.
