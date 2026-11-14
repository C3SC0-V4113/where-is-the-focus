import { useId, useRef, useState, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import { en, es, type Locale } from '@/i18n/messages';
import { cn } from '@/lib/utils';

export function RovingTabsManual({ locale }: { locale: Locale }) {
  const text = (locale === 'en' ? en : es).sections.movement.lab6;
  const id = useId();
  const [selected, setSelected] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = refs.current.indexOf(event.currentTarget);
    const next = {
      ArrowRight: (index + 1) % text.tabs.length,
      ArrowLeft: (index + text.tabs.length - 1) % text.tabs.length,
      Home: 0,
      End: text.tabs.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSelected(next);
    refs.current[next]?.focus();
  }

  return (
    <>
      <div
        role="tablist"
        aria-label={text.manualTablist}
        className="grid w-full grid-cols-2 sm:grid-cols-4"
      >
        {text.tabs.map((label, index) => {
          const active = selected === index;
          return (
            <Button
              key={label}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              variant="ghost"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={active}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={handleKeyDown}
              className="h-auto min-h-12 w-full flex-col gap-1 rounded-none border-0 border-b-3 border-transparent px-2 py-2 text-sm aria-selected:border-brand-text forced-colors:focus-visible:shadow-none forced-colors:aria-selected:underline forced-colors:aria-selected:decoration-2"
            >
              {label}
              <span
                aria-hidden="true"
                className={cn(
                  'font-mono text-xs',
                  active ? 'text-brand-text' : 'text-muted-foreground'
                )}
              >
                {`tabindex="${active ? 0 : -1}"`}
              </span>
            </Button>
          );
        })}
      </div>
      {text.panels.map((panel, index) => {
        const active = selected === index;
        return (
          <div
            key={panel}
            id={`${id}-panel-${index}`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${index}`}
            hidden={!active}
            tabIndex={active ? 0 : -1}
            className="py-3 text-sm leading-relaxed"
          >
            {panel}
          </div>
        );
      })}
    </>
  );
}
