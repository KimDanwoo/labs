import type { ReactNode } from 'react';

interface ControlTabPanelProps {
  name: string;
  isDefault?: boolean;
  children: ReactNode;
}

export function ControlTabPanel({ name, isDefault = false, children }: ControlTabPanelProps) {
  return (
    <div
      className={`js-tabs-content-item tabs-content-item ${name}`}
      data-tabs-name={name}
      data-tabs-default={isDefault ? '' : undefined}
    >
      <div className="js-tabs-content-inner list">
        <table>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
