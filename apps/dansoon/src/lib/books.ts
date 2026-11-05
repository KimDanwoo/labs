import { getCollection, type CollectionEntry } from 'astro:content';

export type BookReport = CollectionEntry<'books'>;
export type ReportKind = BookReport['data']['category'];

export const REPORT_KIND_LABEL = {
  bestseller: '베스트셀러',
  webnovel: '웹소설',
} satisfies Record<ReportKind, string>;

const REPORT_KIND_ORDER: readonly ReportKind[] = ['bestseller', 'webnovel'];

export const bookReportPath = (report: BookReport) => `/book/${report.id}/`;

export async function getBookReports(): Promise<BookReport[]> {
  const reports = await getCollection('books');
  return reports.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 같은 주(같은 날짜)에 나온 리포트를 한 줄로 묶는다. 최신 주가 먼저 온다. */
export function groupByWeek(reports: BookReport[]) {
  const byDate = Map.groupBy(reports, (report) => report.data.date.toISOString().slice(0, 10));
  return [...byDate].map(([date, weekReports]) => ({
    date: weekReports[0]?.data.date ?? new Date(date),
    reports: [...weekReports].sort(
      (a, b) => REPORT_KIND_ORDER.indexOf(a.data.category) - REPORT_KIND_ORDER.indexOf(b.data.category),
    ),
  }));
}
