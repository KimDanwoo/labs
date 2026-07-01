import KoreanLunarCalendar from 'korean-lunar-calendar';

type LunarDate = {
  year: number;
  month: number;
  day: number;
  isIntercalation: boolean;
};

function solarToLunar(
  year: number,
  month: number,
  day: number,
): LunarDate | null {
  const cal = new KoreanLunarCalendar();
  const valid = cal.setSolarDate(year, month, day);
  if (!valid) return null;

  const lunar = cal.getLunarCalendar();
  return {
    year: lunar.year,
    month: lunar.month,
    day: lunar.day,
    isIntercalation: lunar.intercalation ?? false,
  };
}

export { solarToLunar };
export type { LunarDate };
