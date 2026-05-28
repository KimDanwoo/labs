import ReactDOM from 'react-dom';

import { AdditionalGuideView } from '@views/destiny-input';

export default function AdditionalGuidePage() {
  ReactDOM.preload('/form_step_2.webp', { as: 'image', fetchPriority: 'high' });

  return <AdditionalGuideView />;
}
