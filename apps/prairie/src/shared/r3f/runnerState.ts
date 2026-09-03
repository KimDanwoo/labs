import { Vector2, Vector3 } from 'three';

// 주행 루프(RunnerRig)가 매 프레임 쓰고, 물·잔디 셰이더와 이펙트가 useFrame에서 읽는다.
// React 상태가 아니라 리렌더 없음. r3f 트리에서 features → entities로 내려갈 수 없어 공유 객체로 잇는다.
export const runnerState = {
  // 표시 위치(y = 지면/하상 높이 + 점프 높이).
  position: new Vector3(),
  heading: 0,
  speed: 0,
  waterDepth: 0,
  isSprinting: false,
  airborneHeight: 0,
  // 수직 속도(m/s). 날개짓 직후 양수 → 날개가 세게 내려친다.
  verticalSpeed: 0,
  // 마지막 착지 시각(초). 물속 착지 시 물보라 폭발 트리거.
  landedAt: -1,
  // 질주 발동 지점·시각 — 잔디를 쓸고 지나가는 돌풍 파동의 원점.
  gustOrigin: new Vector2(),
  gustStartedAt: -1,
};
