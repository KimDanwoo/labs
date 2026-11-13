import { getCollection, type CollectionEntry } from 'astro:content';

export type BookReport = CollectionEntry<'books'>;
export type ReportKind = BookReport['data']['category'];

export const REPORT_KIND_LABEL = {
  bestseller: '베스트셀러',
  webnovel: '웹소설',
} satisfies Record<ReportKind, string>;

const REPORT_KIND_ORDER: readonly ReportKind[] = ['bestseller', 'webnovel'];
// 생성기가 제목에 붙이는 주차 표기 — 예: '일반 도서 베스트셀러 (2026년 11월 2째주)'
const WEEK_IN_TITLE = /\((\d{4})년 (\d{1,2})월 (\d)째주\)/;

export const bookReportPath = (report: BookReport) => `/book/${report.id}/`;

export async function getBookReports(): Promise<BookReport[]> {
  const reports = await getCollection('books');
  return reports.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

type Week = { year: number; month: number; week: number };

function weekOf(report: BookReport): Week | null {
  const match = report.data.title.match(WEEK_IN_TITLE);
  if (!match) return null;
  const [, year, month, week] = match.map(Number);
  return year && month && week ? { year, month, week } : null;
}

export const formatWeek = ({ month, week }: Week) => `${month}월 ${week}주차`;

export function splitReportTitle(report: BookReport): { heading: string; week?: string } {
  const week = weekOf(report);
  if (!week) return { heading: report.data.title };
  return { heading: report.data.title.replace(WEEK_IN_TITLE, '').trim(), week: `${week.year}년 ${formatWeek(week)}` };
}

/**
 * 같은 주차의 리포트를 한 줄로 묶는다(최신 주가 먼저). 초기 리포트는 종류별 발행일이 하루씩 어긋나므로
 * 날짜가 아니라 제목의 주차로 묶고, 주차가 없으면 발행일로 묶는다.
 */
export function groupByWeek(reports: BookReport[]) {
  const keyOf = (report: BookReport) => {
    const week = weekOf(report);
    return week ? `${week.year}-${week.month}-${week.week}` : report.data.date.toISOString().slice(0, 10);
  };
  return [...Map.groupBy(reports, keyOf).values()].map((weekReports) => {
    const [first] = weekReports;
    return {
      week: first ? weekOf(first) : null,
      date: first?.data.date ?? new Date(),
      reports: [...weekReports].sort(
        (a, b) => REPORT_KIND_ORDER.indexOf(a.data.category) - REPORT_KIND_ORDER.indexOf(b.data.category),
      ),
    };
  });
}
