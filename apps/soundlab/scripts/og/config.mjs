export const WIDTH = 1200;

export const HEIGHT = 630;

/**
 * 그림이 읽히면서도 가장자리 픽셀은 아직 흩어져 있는 지점.
 * 셰이더가 휘도별로 `delay`(최대 0.44)를 주기 때문에 실효 진행도는 이보다 한참 낮다 —
 * 0.6에서는 형체가 안 보이고 1.0이면 그냥 앨범 커버가 된다. 눈으로 스윕해 고른 값.
 */
export const MORPH = 0.97;

/**
 * 액자 한 변. 흩어진 픽셀이 액자 밖 30px 남짓까지 날아가므로
 * (630 - SLOT) / 2 가 그보다 커야 아래위가 잘리지 않는다.
 */
export const SLOT = 410;

export const SLOT_CENTER_X = 796;

export const DEFAULT_TRACK = 20;
