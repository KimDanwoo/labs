import type { ReactNode } from 'react';
import { CardBody, CardDescription, CardHeader, CardRoot, CardTitle } from '../card/primitives';
import { Button } from '../ui/Button';

/**
 * Flat Card — 단순·고빈도 케이스용. title/description만으로 바로 쓴다.
 * 내부적으로는 Compound와 동일한 primitive 레이어를 조립한 결과라 한 벌의 source만 관리된다.
 */
type FlatCardProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  children?: ReactNode;
};

export function Card({ title, description, actionLabel, onActionClick, children }: FlatCardProps) {
  return (
    <CardRoot>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {actionLabel ? (
          <Button variant="outline" onClick={onActionClick}>
            {actionLabel}
          </Button>
        ) : null}
      </CardHeader>
      {description ? <CardDescription>{description}</CardDescription> : null}
      {children ? <CardBody>{children}</CardBody> : null}
    </CardRoot>
  );
}

export type { FlatCardProps };
