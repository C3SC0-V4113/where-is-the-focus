import { Badge } from '@/components/ui/badge';

import type { ReactNode } from 'react';

type ComplianceState = 'ok' | 'warn' | 'bad';

interface Props {
  state: ComplianceState;
  children: ReactNode;
}

const stateBadges: Record<ComplianceState, (children: ReactNode) => ReactNode> = {
  ok: (children) => (
    <Badge className="h-auto gap-1 rounded-sm bg-success-muted px-2 py-0.5 font-mono text-xs leading-normal font-semibold tracking-wider whitespace-nowrap text-success-text">
      <span aria-hidden="true">✓</span>
      {children}
    </Badge>
  ),
  warn: (children) => (
    <Badge className="h-auto gap-1 rounded-sm bg-warning-muted px-2 py-0.5 font-mono text-xs leading-normal font-semibold tracking-wider whitespace-nowrap text-warning-text">
      <span aria-hidden="true">◐</span>
      {children}
    </Badge>
  ),
  bad: (children) => (
    <Badge className="h-auto gap-1 rounded-sm bg-destructive-muted px-2 py-0.5 font-mono text-xs leading-normal font-semibold tracking-wider whitespace-nowrap text-destructive-text">
      <span aria-hidden="true">✕</span>
      {children}
    </Badge>
  ),
};

export function ComplianceBadge({ state, children }: Props) {
  return stateBadges[state](children);
}
