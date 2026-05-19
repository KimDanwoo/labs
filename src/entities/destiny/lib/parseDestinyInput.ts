import type { DestinyInput } from '@entities/destiny/model';

export function parseDestinyInput(
  params: URLSearchParams,
): DestinyInput | null {
  const year = Number(params.get('year'));
  const month = Number(params.get('month'));
  const day = Number(params.get('day'));
  const hour = Number(params.get('hour'));
  const minute = Number(params.get('minute'));
  const gender = params.get('gender');

  if (
    !year ||
    !month ||
    !day ||
    isNaN(hour) ||
    isNaN(minute) ||
    (gender !== 'male' && gender !== 'female')
  ) {
    return null;
  }

  return { year, month, day, hour, minute, gender };
}
