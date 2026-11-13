import { Fragment } from 'react';

import type { KeyControl } from '../config/controls';

interface KeyControlRowProps {
  control: KeyControl;
}

export function KeyControlRow({ control }: KeyControlRowProps) {
  return (
    <tr>
      <td>
        {control.keys.map((key, index) => (
          <Fragment key={key}>
            {index > 0 && control.joiner}
            <span className="key">{key}</span>
          </Fragment>
        ))}
      </td>
      <td>{control.action}</td>
    </tr>
  );
}
