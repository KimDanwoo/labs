const LEADING_NUMBER_PATTERN = /^\d/;

export function hasLeadingNumber(title: string) {
  return LEADING_NUMBER_PATTERN.test(title);
}
