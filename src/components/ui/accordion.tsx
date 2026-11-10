import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { cn } from 'cn';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn('flex w-full flex-col', className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('not-last:border-b', className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'group/accordion-trigger relative flex flex-1 scroll-my-2 items-start justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-surface not-forced-colors:outline-hidden hover:underline focus-visible:shadow-none aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground',
          className
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          data-slot="accordion-focus-corner"
          className="pointer-events-none absolute -top-2 -left-2 size-4.5 border-t-3 border-l-3 border-brand-text opacity-0 group-focus-visible/accordion-trigger:opacity-100 forced-colors:hidden"
        />
        <span
          aria-hidden="true"
          data-slot="accordion-focus-corner"
          className="pointer-events-none absolute -top-2 -right-2 size-4.5 border-t-3 border-r-3 border-brand-text opacity-0 group-focus-visible/accordion-trigger:opacity-100 forced-colors:hidden"
        />
        <span
          aria-hidden="true"
          data-slot="accordion-focus-corner"
          className="pointer-events-none absolute -bottom-2 -left-2 size-4.5 border-b-3 border-l-3 border-brand-text opacity-0 group-focus-visible/accordion-trigger:opacity-100 forced-colors:hidden"
        />
        <span
          aria-hidden="true"
          data-slot="accordion-focus-corner"
          className="pointer-events-none absolute -right-2 -bottom-2 size-4.5 border-r-3 border-b-3 border-brand-text opacity-0 group-focus-visible/accordion-trigger:opacity-100 forced-colors:hidden"
        />
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          'h-(--accordion-panel-height) pt-0 pb-2.5 data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
