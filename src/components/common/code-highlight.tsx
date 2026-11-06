import type { ReactNode } from 'react';

const tokenPattern =
  /(\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|\/\/[^\n]*)|(:?focus-visible:?|outline-hidden|scroll-padding[\w-]*|scroll-p[tb]-\d+|forced-colors:?)/g;

interface Props {
  code: string;
}

export function CodeHighlight({ code }: Props) {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of code.matchAll(tokenPattern)) {
    const [token, comment] = match;
    const start = match.index;

    if (start > cursor) nodes.push(code.slice(cursor, start));
    nodes.push(
      <span className={comment ? 'text-code-dim' : 'text-code-hi'} key={start}>
        {token}
      </span>
    );
    cursor = start + token.length;
  }

  if (cursor < code.length) nodes.push(code.slice(cursor));
  return <>{nodes}</>;
}
