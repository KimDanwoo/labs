import ReactDOM from 'react-dom';

import { BasicFormView } from '@views/destiny-input';

export default function BasicFormPage() {
  ReactDOM.preload('/form_step_1.webp', { as: 'image', fetchPriority: 'high' });

  return <BasicFormView />;
}
