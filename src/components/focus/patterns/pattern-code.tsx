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
    <Collapsible className="mx-3 mt-2 mb-3 grid self-end font-sans" data-pattern-code="">
      <CollapsibleTrigger
        className="inline-flex w-fit cursor-pointer items-center gap-1.5 px-1 py-1.5 text-sm font-medium text-brand-text"
        data-pattern-code-trigger=""
        onPointerDown={(event) => {
          event.currentTarget
            .closest('[data-pattern-code]')
            ?.setAttribute('data-activation', 'pointer');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.currentTarget
              .closest('[data-pattern-code]')
              ?.setAttribute('data-activation', 'keyboard');
          }
        }}
      >
        {label}
        <ChevronDown aria-hidden="true" className="size-4" data-pattern-code-chevron="" />
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
