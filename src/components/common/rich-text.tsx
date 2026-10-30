import { Kbd } from '@/components/ui/kbd';

import type { ReactNode } from 'react';

interface Props {
  text: string;
}

export function RichText({ text }: Props) {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(/\[\[([^\[\]]+)\]\]/g)) {
    const start = match.index;
    const end = start + match[0].length;
    parts.push(text.slice(cursor, start));
    parts.push(
      <Kbd key={text.slice(0, end)} className="inline">
        {match[1]}
      </Kbd>
    );
    cursor = end;
  }

  parts.push(text.slice(cursor));
  return <span>{parts}</span>;
}
