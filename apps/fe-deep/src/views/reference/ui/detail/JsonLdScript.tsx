import { toJsonLd } from '@views/reference/lib/structuredData';

interface JsonLdScriptProps {
  data: unknown;
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(data) }} />;
}
