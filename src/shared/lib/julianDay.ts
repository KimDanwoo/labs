/**
 * 그레고리력 날짜를 Julian Day Number(JDN)로 변환
 *
 * known-good 검증값:
 * - gregorianToJdn(2024, 2, 4) === 2460345
 * - gregorianToJdn(1900, 1, 1) === 2415021
 * - gregorianToJdn(1986, 5, 22) === 2446573
 */
const gregorianToJdn = (year: number, month: number, day: number): number => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
};

type GregorianDate = {
  year: number;
  month: number;
  day: number;
};

/**
 * Julian Day Number(JDN)을 그레고리력 날짜로 역변환
 */
const jdnToGregorian = (jdn: number): GregorianDate => {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);

  return { year, month, day };
};

export { gregorianToJdn, jdnToGregorian };
export type { GregorianDate };
