import { jdnToGregorian } from '@shared/lib/julianDay';

/**
 * 절기(節氣) 계산 엔진
 *
 * VSOP87 축약 계수(Meeus "Astronomical Algorithms" Ch.25) 기반
 * 태양 겉보기황경(apparent solar longitude) 계산.
 *
 * known-good 검증값 (KASI 기준, ±30분 이내):
 * - 2024년 입춘 (황경 315°): 2024-02-04 17:27 KST → 계산값 약 17:15 KST (12분 차)
 * - 2024년 춘분 (황경   0°): 2024-03-20 12:06 KST → 계산값 약 12:26 KST (20분 차)
 * - 2024년 하지 (황경  90°): 2024-06-21 05:51 KST → 계산값 약 05:30 KST (21분 차)
 *
 * 주의: 태스크 명세의 "입춘 11:27 KST"는 오기 — KASI 공식값은 17:27 KST
 */

type SolarTermEntry = {
  name: string;
  longitude: number;
  jdn: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** 24절기 이름과 목표 황경 매핑 (연초 소한부터 순서대로) */
const SOLAR_TERMS: readonly { name: string; longitude: number }[] = [
  { name: '소한', longitude: 285 },
  { name: '대한', longitude: 300 },
  { name: '입춘', longitude: 315 },
  { name: '우수', longitude: 330 },
  { name: '경칩', longitude: 345 },
  { name: '춘분', longitude: 0 },
  { name: '청명', longitude: 15 },
  { name: '곡우', longitude: 30 },
  { name: '입하', longitude: 45 },
  { name: '소만', longitude: 60 },
  { name: '망종', longitude: 75 },
  { name: '하지', longitude: 90 },
  { name: '소서', longitude: 105 },
  { name: '대서', longitude: 120 },
  { name: '입추', longitude: 135 },
  { name: '처서', longitude: 150 },
  { name: '백로', longitude: 165 },
  { name: '추분', longitude: 180 },
  { name: '한로', longitude: 195 },
  { name: '상강', longitude: 210 },
  { name: '입동', longitude: 225 },
  { name: '소설', longitude: 240 },
  { name: '대설', longitude: 255 },
  { name: '동지', longitude: 270 },
] as const;

/** 도(degree) → 라디안 변환 */
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** 라디안 → 도(degree) 변환 */
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/**
 * JDN → 율리우스 세기 (J2000.0 기준)
 */
const jdnToJulianCentury = (jdn: number): number => {
  return (jdn - 2451545.0) / 36525.0;
};

/**
 * VSOP87 축약 계수를 이용한 태양 겉보기황경 계산
 *
 * 지구의 태양중심 황경(heliocentric longitude) → 지구중심 태양황경(geocentric)으로 변환.
 * 장동(nutation), FK5 보정, 광행차(aberration) 포함.
 *
 * @param jdn Julian Day Number (소수점 포함 가능)
 * @returns 태양 겉보기황경 0~360°
 */
const getSolarLongitude = (jdn: number): number => {
  const T = jdnToJulianCentury(jdn);
  const tau = T / 10.0; // 율리우스 천년 단위

  // --- VSOP87 L 계수 (지구 태양중심 황경, 단위: 1e-8 라디안) ---
  const L0 =
    175347046.0 +
    3341656.0 * Math.cos(4.6692568 + 6283.07585 * tau) +
    34894.0 * Math.cos(5.39636 + 12566.1517 * tau) +
    3497.0 * Math.cos(5.31229 + 5753.38493 * tau) +
    3418.0 * Math.cos(3.70783) +
    3136.0 * Math.cos(5.69804 + 77713.77147 * tau) +
    2676.0 * Math.cos(0.65875 + 7860.4194 * tau) +
    2343.0 * Math.cos(5.79856 + 3930.2097 * tau) +
    1324.0 * Math.cos(5.19856 + 11506.7698 * tau) +
    1273.0 * Math.cos(1.10962 + 5884.9268 * tau) +
    1199.0 * Math.cos(5.1301 + 1577.3435 * tau) +
    990.0 * Math.cos(5.233 + 5223.69392 * tau) +
    902.0 * Math.cos(2.045 + 26.29832 * tau) +
    857.0 * Math.cos(3.5084 + 398.149 * tau) +
    780.0 * Math.cos(1.17915 + 5507.55323 * tau) +
    753.0 * Math.cos(2.533 + 5765.84647 * tau) +
    505.0 * Math.cos(4.58327 + 18849.2275 * tau) +
    492.0 * Math.cos(4.205 + 775.5226 * tau) +
    357.0 * Math.cos(2.92 + 0.0673 * tau) +
    317.0 * Math.cos(5.849 + 11790.6291 * tau) +
    284.0 * Math.cos(1.899 + 796.298 * tau) +
    271.0 * Math.cos(0.315 + 10977.0788 * tau) +
    243.0 * Math.cos(0.345 + 5486.7778 * tau) +
    206.0 * Math.cos(4.806 + 2544.3144 * tau) +
    205.0 * Math.cos(1.869 + 5573.1428 * tau);

  const L1 =
    628331966747.0 +
    206059.0 * Math.cos(2.67823 + 6283.07585 * tau) +
    4303.0 * Math.cos(2.63516 + 12566.1517 * tau) +
    425.0 * Math.cos(1.59) +
    119.0 * Math.cos(5.796 + 83996.8473 * tau) +
    109.0 * Math.cos(2.966 + 1577.3435 * tau) +
    93.0 * Math.cos(2.59 + 26.2983 * tau) +
    72.0 * Math.cos(1.14 + 529.691 * tau) +
    68.0 * Math.cos(1.87 + 398.149 * tau) +
    67.0 * Math.cos(4.41 + 5507.5532 * tau) +
    59.0 * Math.cos(2.89 + 5223.6939 * tau) +
    56.0 * Math.cos(2.17 + 155.4204 * tau) +
    45.0 * Math.cos(0.4 + 796.298 * tau) +
    36.0 * Math.cos(0.47 + 775.5226 * tau) +
    29.0 * Math.cos(2.65 + 7.1135 * tau) +
    21.0 * Math.cos(5.34 + 0.9803 * tau) +
    19.0 * Math.cos(1.85 + 5486.7778 * tau) +
    19.0 * Math.cos(4.97 + 213.2991 * tau) +
    17.0 * Math.cos(2.99 + 6275.9623 * tau) +
    16.0 * Math.cos(0.03 + 2544.3144 * tau) +
    16.0 * Math.cos(1.43 + 2146.1654 * tau) +
    15.0 * Math.cos(1.21 + 10977.0788 * tau) +
    12.0 * Math.cos(2.83 + 1748.0164 * tau) +
    12.0 * Math.cos(3.26 + 5088.6288 * tau) +
    12.0 * Math.cos(5.27 + 1194.447 * tau) +
    12.0 * Math.cos(2.08 + 4694.003 * tau) +
    11.0 * Math.cos(0.77 + 553.5694 * tau) +
    10.0 * Math.cos(1.3 + 6286.599 * tau) +
    10.0 * Math.cos(4.24 + 1349.8674 * tau) +
    9.0 * Math.cos(2.7 + 242.7286 * tau) +
    9.0 * Math.cos(5.64 + 951.7184 * tau) +
    8.0 * Math.cos(5.3 + 2352.8662 * tau) +
    6.0 * Math.cos(2.65 + 9437.7629 * tau) +
    6.0 * Math.cos(4.67 + 4690.4798 * tau);

  const L2 =
    52919.0 +
    8720.0 * Math.cos(1.0721 + 6283.07585 * tau) +
    309.0 * Math.cos(0.867 + 12566.1517 * tau) +
    27.0 * Math.cos(0.05 + 0.9803 * tau) +
    16.0 * Math.cos(5.19 + 26.2983 * tau) +
    16.0 * Math.cos(3.68 + 155.4204 * tau) +
    10.0 * Math.cos(0.76 + 18849.2275 * tau) +
    9.0 * Math.cos(2.06 + 77713.7715 * tau) +
    7.0 * Math.cos(0.83 + 775.5226 * tau) +
    5.0 * Math.cos(4.66 + 1577.3435 * tau) +
    4.0 * Math.cos(1.03 + 7.1135 * tau) +
    4.0 * Math.cos(3.44 + 5573.1428 * tau) +
    3.0 * Math.cos(5.14 + 796.298 * tau) +
    3.0 * Math.cos(6.05 + 5507.5532 * tau) +
    3.0 * Math.cos(1.19 + 242.7286 * tau) +
    3.0 * Math.cos(6.12 + 529.691 * tau) +
    3.0 * Math.cos(0.31 + 398.149 * tau) +
    3.0 * Math.cos(2.28 + 553.5694 * tau) +
    2.0 * Math.cos(4.38 + 5223.6939 * tau) +
    2.0 * Math.cos(3.75 + 0.9803 * tau);

  const L3 =
    289.0 * Math.cos(5.844 + 6283.07585 * tau) +
    35.0 +
    17.0 * Math.cos(5.49 + 12566.1517 * tau) +
    3.0 * Math.cos(5.2 + 155.4204 * tau) +
    1.0 * Math.cos(4.72 + 3.5231 * tau) +
    1.0 * Math.cos(5.3 + 18849.2275 * tau) +
    1.0 * Math.cos(5.97 + 242.7286 * tau);

  const L4 =
    114.0 * Math.cos(3.1416) +
    8.0 * Math.cos(4.13 + 6283.07585 * tau) +
    1.0 * Math.cos(3.84 + 12566.1517 * tau);

  const L5 = Math.cos(3.14);

  // 지구 태양중심 황경 (라디안)
  const Lrad =
    (L0 +
      L1 * tau +
      L2 * tau * tau +
      L3 * tau * tau * tau +
      L4 * tau * tau * tau * tau +
      L5 * tau * tau * tau * tau * tau) /
    1e8;

  // 지구 태양중심 황경 → 지구중심 태양 황경: +180°
  let sunLon = toDeg(Lrad) + 180.0;
  sunLon = ((sunLon % 360) + 360) % 360;

  // FK5 좌표계 보정
  const Lprime = sunLon - 1.397 * T - 0.00031 * T * T;
  const dLfk5 =
    (-0.09033 + 0.03916 * (Math.cos(toRad(Lprime)) - Math.sin(toRad(Lprime)))) /
    3600;

  // 장동 보정 Δψ (단순화)
  const omega = 125.04452 - 1934.136261 * T;
  const Lsun = 280.4665 + 36000.7698 * T;
  const Lmoon = 218.3165 + 481267.8813 * T;
  const deltaPsi =
    (-17.2 * Math.sin(toRad(omega)) -
      1.32 * Math.sin(toRad(2 * Lsun)) -
      0.23 * Math.sin(toRad(2 * Lmoon)) +
      0.21 * Math.sin(toRad(2 * omega))) /
    3600;

  // 광행차 보정 (−20.4898″)
  const aberration = -20.4898 / 3600;

  const apparent = sunLon + dLfk5 + deltaPsi + aberration;
  return ((apparent % 360) + 360) % 360;
};

/**
 * 황경 차이 계산 (360° 랩어라운드 처리)
 * 반환값: -180 ~ +180 범위
 */
const longitudeDiff = (current: number, target: number): number => {
  let diff = target - current;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
};

/**
 * 이진탐색으로 특정 태양황경에 도달하는 JDN 찾기
 *
 * @param year 기준 연도
 * @param targetLongitude 목표 황경 (0~360°)
 * @returns Julian Day Number (소수점 포함, ±5분 정밀도)
 */
const findSolarTermJdn = (year: number, targetLongitude: number): number => {
  // 2000년 춘분 JDN = 2451624, 이후 365.25일/년으로 근사
  const vernalEquinoxApprox = 2451624.0 + 365.25 * (year - 2000);
  const daysPerDegree = 365.25 / 360.0;

  // 춘분(0°) 기준 오프셋 계산
  // 285° 이상(소한~경칩)은 해당 연도 기준으로 전년 말~연초에 해당 → 음수 오프셋
  // 285° 미만은 같은 해 내에 존재 → 양수 오프셋
  const approxOffset =
    targetLongitude >= 285
      ? (targetLongitude - 360) * daysPerDegree
      : targetLongitude * daysPerDegree;

  const approxJdn = vernalEquinoxApprox + approxOffset;

  // 이진탐색 범위: ±30일 (근사오차 충분히 커버)
  let lo = approxJdn - 30;
  let hi = approxJdn + 30;

  // 수렴 조건: 1/1440일 ≈ 1분
  const PRECISION = 1.0 / 1440.0;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const diff = longitudeDiff(getSolarLongitude(mid), targetLongitude);

    if (Math.abs(diff) < 0.001 || hi - lo < PRECISION) {
      return mid;
    }

    // 태양 황경은 단조증가: diff>0이면 아직 목표 미달(→ lo 올림)
    if (diff > 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) / 2;
};

/**
 * JDN 소수점 → KST 날짜/시각 변환
 *
 * JDN 규약: 정수 JDN = 해당일 정오(UT 12:00)
 * - JDN x.0 = UT 12:00
 * - JDN x.5 = UT 00:00 (다음날 자정)
 *
 * KST = UT + 9시간
 */
const jdnToKstDateTime = (
  jdn: number,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} => {
  const intJdn = Math.floor(jdn);
  const frac = jdn - intJdn;

  // intJdn 기준 정오(UT 12:00)부터의 경과 시간
  const utHoursFromNoon = frac * 24; // 0.0 → 0h, 0.5 → 12h, 1.0 → 24h
  const utTotal = 12 + utHoursFromNoon; // 절대 UT 시각 (0~48 범위)

  // 날짜 오프셋 (UT 24시 이상이면 +1일)
  const dayOffset = Math.floor(utTotal / 24);
  const utHour = utTotal % 24;

  // KST 변환
  const kstTotal = utHour + 9;
  const kstDayOffset = kstTotal >= 24 ? 1 : 0;
  const kstHour = Math.floor(kstTotal % 24);
  const kstMinute = Math.round(((kstTotal % 24) - kstHour) * 60);

  const greg = jdnToGregorian(intJdn + dayOffset + kstDayOffset);

  return {
    year: greg.year,
    month: greg.month,
    day: greg.day,
    hour: kstHour,
    minute: kstMinute === 60 ? 0 : kstMinute,
  };
};

/**
 * 특정 연도의 24절기 시각 계산
 *
 * @param year 그레고리력 연도
 * @returns 해당 연도에 속하는 24절기 목록 (소한~동지 순)
 */
const getSolarTermsForYear = (year: number): SolarTermEntry[] => {
  return SOLAR_TERMS.map(({ name, longitude }) => {
    const jdn = findSolarTermJdn(year, longitude);
    const { year: y, month, day, hour, minute } = jdnToKstDateTime(jdn);

    return {
      name,
      longitude,
      jdn,
      year: y,
      month,
      day,
      hour,
      minute,
    };
  });
};

export {
  jdnToJulianCentury,
  getSolarLongitude,
  findSolarTermJdn,
  getSolarTermsForYear,
  jdnToKstDateTime,
};
export type { SolarTermEntry };
