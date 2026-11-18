import { EMPTY_DATE } from '../config/docTable';

export function formatStudyDate(date: string | null) {
  return date ? date.replaceAll('-', '.') : EMPTY_DATE;
}
