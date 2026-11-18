import { LegalDocument } from '@shared/ui/legal-document';

import { PRIVACY_DOCUMENT } from '../config/document';

export function PrivacyView() {
  return <LegalDocument {...PRIVACY_DOCUMENT} />;
}
