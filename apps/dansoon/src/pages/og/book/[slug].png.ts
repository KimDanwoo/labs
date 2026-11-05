import type { APIRoute, GetStaticPaths } from 'astro';
import { getBookReports, REPORT_KIND_LABEL, splitReportTitle, type BookReport } from '~/lib/books';
import { OG_ACCENT, pngResponse, renderOgImage } from '~/lib/ogImage';

export const getStaticPaths = (async () => {
  const reports = await getBookReports();
  return reports.map((report) => ({ params: { slug: report.id }, props: { report } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ report: BookReport }> = async ({ props: { report } }) => {
  const { heading, week } = splitReportTitle(report);
  return pngResponse(
    await renderOgImage({
      label: `주간 책 순위 · ${REPORT_KIND_LABEL[report.data.category]}`,
      color: OG_ACCENT.book,
      title: heading,
      subtitle: week,
    }),
  );
};
