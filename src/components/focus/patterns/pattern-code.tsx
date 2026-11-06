import { ChevronDown } from 'lucide-react';

import { CodeExample } from '@/components/common/code-example';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getSnippetCode, snippets } from '@/lib/focus/snippets';

import type { Locale } from '@/i18n/messages';

interface Props {
  snippet: keyof typeof snippets;
  locale: Locale;
  label: string;
  codeLabels: {
    copy: string;
    copied: string;
    selectAndCopy: string;
    language: string;
  };
}

export function PatternCode({ snippet, locale, label, codeLabels }: Props) {
  const code = snippets[snippet];

  return (
    <Collapsible className="grid" data-pattern-code="">
      <CollapsibleTrigger className="inline-flex" data-pattern-code-trigger="">
        {label}
        <ChevronDown aria-hidden="true" data-pattern-code-chevron="" />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid" data-pattern-code-panel="">
        <CodeExample
          css={getSnippetCode(code, 'css', locale)}
          tailwind={getSnippetCode(code, 'tw', locale)}
          labels={codeLabels}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
