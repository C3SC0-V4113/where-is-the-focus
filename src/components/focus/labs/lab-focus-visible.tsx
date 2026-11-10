import { useEffect, useRef, useState } from 'react';

import { ComplianceBadge } from '@/components/common/compliance-badge';
import { Button } from '@/components/ui/button';
import { en, es, type Locale } from '@/i18n/messages';

type FocusResult = { selector: string; pointer: boolean; ring: boolean; good: boolean };

export function LabFocusVisible({ locale }: { locale: Locale }) {
  const text = (locale === 'en' ? en : es).sections.focusVisible.lab1;
  const lastInputWasPointer = useRef(false);
  const [result, setResult] = useState<FocusResult | null>(null);

  useEffect(() => {
    const updateInputMethod = (event: Event) => {
      lastInputWasPointer.current = event.type === 'pointerdown';
    };
    const inputEvents = ['pointerdown', 'keydown'];
    inputEvents.forEach((type) => window.addEventListener(type, updateInputMethod, true));
    return () => {
      inputEvents.forEach((type) => window.removeEventListener(type, updateInputMethod, true));
    };
  }, []);

  const reportFocus = (selector: ':focus' | ':focus-visible') => {
    const pointer = lastInputWasPointer.current;
    const ring = selector === ':focus' || !pointer;
    setResult({ selector, pointer, ring, good: pointer ? !ring : ring });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="grid justify-items-start gap-3 rounded-md border border-border bg-background p-5">
        <span className="font-mono text-xs text-muted-foreground">{text.tags[0]}</span>
        <Button
          className="h-auto rounded-md border-0 bg-foreground px-5 py-3 text-base font-semibold text-background transition-none focus:shadow-none focus:outline-3 focus:outline-offset-3 focus:outline-destructive-text focus-visible:border-transparent"
          onFocus={() => reportFocus(':focus')}
        >
          {text.save}
        </Button>
      </div>
      <div className="grid justify-items-start gap-3 rounded-md border border-border bg-background p-5">
        <span className="font-mono text-xs text-muted-foreground">{text.tags[1]}</span>
        <Button
          className="h-auto rounded-md border-0 bg-foreground px-5 py-3 text-base font-semibold text-background transition-none focus:shadow-none focus:outline-none focus-visible:border-transparent focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:outline-solid"
          onFocus={() => reportFocus(':focus-visible')}
        >
          {text.save}
        </Button>
      </div>
      <p aria-live="polite" className="col-span-full min-h-lh text-sm text-muted-foreground">
        {result ? (
          <>
            <ComplianceBadge state={result.good ? 'ok' : 'warn'}>
              {text.outcomes[result.good ? 0 : 1]}
            </ComplianceBadge>{' '}
            {text.buttonWith[0]} <strong className="text-foreground">{result.selector}</strong>{' '}
            {text.buttonWith[1]} {text.inputMethods[result.pointer ? 0 : 1]}:{' '}
            {text.ringOutcomes[result.ring ? 0 : 1]}.
          </>
        ) : (
          text.initial
        )}
      </p>
    </div>
  );
}
