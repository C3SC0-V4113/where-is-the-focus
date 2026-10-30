import { Badge } from '@/components/ui/badge';

import type { ReactNode } from 'react';

type ComplianceState = 'ok' | 'warn' | 'bad';

interface Props {
  state: ComplianceState;
  children: ReactNode;
}

const stateBadges: Record<ComplianceState, (children: ReactNode) => ReactNode> = {
  ok: (children) => (
    <Badge className="h-auto rounded-sm bg-success-muted font-mono leading-normal font-semibold tracking-wider text-success-text uppercase">
      <span aria-hidden="true">✓</span>
      {children}
    </Badge>
  ),
  warn: (children) => (
    <Badge className="h-auto rounded-sm bg-warning-muted font-mono leading-normal font-semibold tracking-wider text-warning-text uppercase">
      <span aria-hidden="true">◐</span>
      {children}
    </Badge>
  ),
  bad: (children) => (
    <Badge className="h-auto rounded-sm bg-destructive-muted font-mono leading-normal font-semibold tracking-wider text-destructive-text uppercase">
      <span aria-hidden="true">✕</span>
      {children}
    </Badge>
  ),
};

export function ComplianceBadge({ state, children }: Props) {
  return stateBadges[state](children);
}
