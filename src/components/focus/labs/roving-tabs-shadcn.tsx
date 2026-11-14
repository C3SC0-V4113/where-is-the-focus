import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { en, es, type Locale } from '@/i18n/messages';
import { cn } from '@/lib/utils';

const values = ['description', 'dimensions', 'shipping', 'reviews'] as const;
type TabValue = (typeof values)[number];

export function RovingTabsShadcn({ locale }: { locale: Locale }) {
  const text = (locale === 'en' ? en : es).sections.movement.lab6;
  const [selected, setSelected] = useState<TabValue>('description');

  return (
    <Tabs value={selected} onValueChange={(value) => setSelected(value as TabValue)}>
      <TabsList
        variant="line"
        activateOnFocus
        loopFocus
        aria-label={text.shadcnTablist}
        className="grid w-full grid-cols-2 group-data-horizontal/tabs:h-auto sm:grid-cols-4"
      >
        {values.map((value, index) => {
          return (
            <TabsTrigger
              key={value}
              value={value}
              className="h-auto min-h-12 flex-col gap-1 rounded-none px-2 py-2 text-sm whitespace-normal forced-colors:focus-visible:shadow-none forced-colors:aria-selected:underline forced-colors:aria-selected:decoration-2 group-data-[variant=line]/tabs-list:data-active:not-forced-colors:focus-visible:focus-ring"
              render={(props) => (
                <button {...props}>
                  {text.tabs[index]}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'font-mono text-xs',
                      props.tabIndex === 0 ? 'text-brand-text' : 'text-muted-foreground'
                    )}
                  >
                    {`tabindex="${props.tabIndex}"`}
                  </span>
                </button>
              )}
            />
          );
        })}
      </TabsList>
      {values.map((value, index) => (
        <TabsContent
          key={value}
          value={value}
          className="py-3 text-sm leading-relaxed forced-colors:focus-visible:outline-solid"
        >
          {text.panels[index]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
