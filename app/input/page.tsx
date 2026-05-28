import ReactDOM from 'react-dom';

import { BasicGuideView } from '@views/destiny-input';

export default function InputPage() {
  ReactDOM.preload('/form_step_1.webp', { as: 'image', fetchPriority: 'high' });

  return <BasicGuideView />;
}
