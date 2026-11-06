import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { CodeHighlight } from '@/components/common/code-highlight';
import { Button } from '@/components/ui/button';
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockHeader,
} from '@/components/ui/code-block';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHydrated } from '@/hooks/use-hydrated';
import {
  getFocusLanguage,
  getServerFocusLanguage,
  setFocusLanguage,
  subscribeToFocusLanguage,
} from '@/lib/focus-language';

interface Labels {
  copy: string;
  copied: string;
  selectAndCopy: string;
  language: string;
}

interface Props {
  css: string;
  tailwind: string;
  labels: Labels;
}

export function hasHorizontalOverflow(
  content: Pick<HTMLElement, 'clientWidth' | 'scrollWidth'> | null
) {
  return Boolean(content && content.scrollWidth > content.clientWidth + 1);
}

function HighlightedContent({
  code,
  contentRef,
  tabIndex,
}: {
  code: string;
  contentRef: React.RefObject<HTMLPreElement | null>;
  tabIndex: number;
}) {
  const lines = code.split('\n').reduce<Array<{ key: string; text: string }>>((entries, text) => {
    const occurrence = entries.filter((entry) => entry.text === text).length;
    entries.push({ key: `${text}:${occurrence}`, text });
    return entries;
  }, []);
  return (
    <CodeBlockContent ref={contentRef} tabIndex={tabIndex} data-testid="code-example-content">
      {lines.map(({ key, text }, lineNumber) => (
        <span className="block min-h-lh" key={key}>
          <CodeHighlight code={text} />
          {lineNumber < lines.length - 1 ? '\n' : ''}
        </span>
      ))}
    </CodeBlockContent>
  );
}

export function CodeExample({ css, tailwind, labels }: Props) {
  const isHydrated = useHydrated();
  const language = useSyncExternalStore(
    subscribeToFocusLanguage,
    getFocusLanguage,
    getServerFocusLanguage
  );
  const cssRef = useRef<HTMLPreElement>(null);
  const tailwindRef = useRef<HTMLPreElement>(null);
  // Keep each panel tabbable until layout confirms that it does not overflow.
  const [overflow, setOverflow] = useState({ css: true, tw: true });
  const [feedback, setFeedback] = useState('');
  const activeCode = language === 'css' ? css : tailwind;
  const activeRef = language === 'css' ? cssRef : tailwindRef;

  const measureOverflow = useCallback(() => {
    const cssContent = cssRef.current;
    const tailwindContent = tailwindRef.current;
    const next = {
      css: language === 'css' && hasHorizontalOverflow(cssContent),
      tw: language === 'tw' && hasHorizontalOverflow(tailwindContent),
    };
    setOverflow((current) => (current.css === next.css && current.tw === next.tw ? current : next));
  }, [language]);

  useEffect(() => {
    let mounted = true;
    let frame = 0;
    const measureAfterLayout = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureOverflow);
    };
    measureAfterLayout();
    window.addEventListener('resize', measureAfterLayout);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureAfterLayout);
    if (cssRef.current) {
      observer?.observe(cssRef.current);
      if (cssRef.current.parentElement) observer?.observe(cssRef.current.parentElement);
    }
    if (tailwindRef.current) {
      observer?.observe(tailwindRef.current);
      if (tailwindRef.current.parentElement) observer?.observe(tailwindRef.current.parentElement);
    }
    const fonts = document.fonts;
    fonts?.addEventListener('loadingdone', measureAfterLayout);
    void fonts?.ready.then(() => {
      if (mounted) measureAfterLayout();
    });
    return () => {
      mounted = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measureAfterLayout);
      fonts?.removeEventListener('loadingdone', measureAfterLayout);
      observer?.disconnect();
    };
  }, [language, measureOverflow]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(''), 1600);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(activeCode);
      setFeedback(labels.copied);
    } catch {
      const node = activeRef.current;
      if (node) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setFeedback(labels.selectAndCopy);
    }
  }

  function handleLanguageChange(value: string | null) {
    if (value === 'css' || value === 'tw') {
      setOverflow((current) => ({ ...current, [value]: true }));
      setFocusLanguage(value);
    }
  }

  return (
    <Tabs value={language} onValueChange={handleLanguageChange} className="mt-6 min-w-0">
      <CodeBlock
        data-testid="code-example-block"
        className="rounded-sm border-code-fg/10 bg-code-bg text-code-fg dark:bg-code-bg"
      >
        <CodeBlockHeader className="min-h-12 items-center border-b border-code-fg/10 px-3 py-2">
          <TabsList
            aria-label={labels.language}
            activateOnFocus
            variant="default"
            className="h-8 gap-1 rounded-md bg-code-bg p-0.5 font-mono text-code-dim"
          >
            <TabsTrigger
              value="css"
              {...(!isHydrated && language === 'css' ? { tabIndex: 0 } : {})}
              className="flex-none rounded-sm px-3 font-mono text-code-dim dark:text-code-dim data-active:border-transparent data-active:bg-code-fg/10 data-active:text-code-fg dark:data-active:border-transparent dark:data-active:bg-code-fg/10 dark:data-active:text-code-fg"
            >
              CSS
            </TabsTrigger>
            <TabsTrigger
              value="tw"
              {...(!isHydrated && language === 'tw' ? { tabIndex: 0 } : {})}
              className="flex-none rounded-sm px-3 font-mono text-code-dim dark:text-code-dim data-active:border-transparent data-active:bg-code-fg/10 data-active:text-code-fg dark:data-active:border-transparent dark:data-active:bg-code-fg/10 dark:data-active:text-code-fg"
            >
              Tailwind
            </TabsTrigger>
          </TabsList>
          <CodeBlockActions className="static ms-auto opacity-100">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-code-dim hover:bg-code-fg/10 hover:text-code-fg dark:text-code-dim"
              onClick={() => {
                void handleCopy();
              }}
            >
              <span>{feedback || labels.copy}</span>
            </Button>
          </CodeBlockActions>
          <span className="sr-only" role="status">
            {feedback}
          </span>
        </CodeBlockHeader>
        <div className="grid grid-cols-1">
          <TabsContent
            value="css"
            keepMounted
            hidden={false}
            tabIndex={-1}
            aria-hidden={language !== 'css'}
            className="col-start-1 row-start-1 m-0 aria-hidden:invisible"
          >
            <HighlightedContent
              code={css}
              contentRef={cssRef}
              tabIndex={language === 'css' && overflow.css ? 0 : -1}
            />
          </TabsContent>
          <TabsContent
            value="tw"
            keepMounted
            hidden={false}
            tabIndex={-1}
            aria-hidden={language !== 'tw'}
            className="col-start-1 row-start-1 m-0 aria-hidden:invisible"
          >
            <HighlightedContent
              code={tailwind}
              contentRef={tailwindRef}
              tabIndex={language === 'tw' && overflow.tw ? 0 : -1}
            />
          </TabsContent>
        </div>
      </CodeBlock>
    </Tabs>
  );
}
