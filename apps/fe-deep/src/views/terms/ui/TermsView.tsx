import { LegalDocument } from '@shared/ui/legal-document';

import { TERMS_DOCUMENT } from '@views/terms/config/document';

export function TermsView() {
  return <LegalDocument {...TERMS_DOCUMENT} />;
}
