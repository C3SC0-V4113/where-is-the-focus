import { useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { en, es, type Locale } from '@/i18n/messages';
import { cn } from '@/lib/utils';

type TriggerId = 'focus' | 'focusVisible';

const triggerBase =
  'h-auto rounded-md border-0 bg-foreground px-5 py-3 text-base font-semibold text-background transition-none focus:shadow-none focus-visible:border-transparent';

type Status =
  | { kind: 'initial' }
  | { kind: 'opened' }
  | { kind: 'closed'; trigger: TriggerId; method: 'mouse' | 'keyboard' };

export function LabDialog({ locale }: { locale: Locale }) {
  const text = (locale === 'en' ? en : es).sections.movement.lab5;
  const via = useRef<'mouse' | 'keyboard'>('keyboard');
  const openedBy = useRef<TriggerId>('focus');
  const [status, setStatus] = useState<Status>({ kind: 'initial' });
  const labels = {
    focus: text.triggerFocus,
    focusVisible: text.triggerFocusVisible,
  } satisfies Record<TriggerId, string>;
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStatus({ kind: 'opened' });
    } else {
      setStatus({
        kind: 'closed',
        trigger: openedBy.current,
        method: via.current,
      });
    }
  };
  const visible =
    status.kind === 'closed' && (status.trigger === 'focus' || status.method === 'keyboard');

  return (
    <div className="grid gap-4">
      <AlertDialog open={status.kind === 'opened'} onOpenChange={handleOpenChange}>
        <div className="flex flex-wrap gap-3">
          <AlertDialogTrigger
            render={
              <Button
                className={cn(
                  triggerBase,
                  'focus:outline-3 focus:outline-offset-3 focus:outline-destructive-text'
                )}
                onClick={() => {
                  openedBy.current = 'focus';
                }}
              />
            }
          >
            {labels.focus}
          </AlertDialogTrigger>
          <AlertDialogTrigger
            render={
              <Button
                className={cn(
                  triggerBase,
                  'focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:outline-solid'
                )}
                onClick={() => {
                  openedBy.current = 'focusVisible';
                }}
              />
            }
          >
            {labels.focusVisible}
          </AlertDialogTrigger>
        </div>
        <AlertDialogContent
          onKeyDownCapture={() => {
            via.current = 'keyboard';
          }}
          onPointerDownCapture={() => {
            via.current = 'mouse';
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{text.dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{text.dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="focus-visible:border-transparent focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:outline-solid"
              onClick={() => handleOpenChange(false)}
            >
              {text.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p aria-live="polite" className="min-h-lh text-sm text-muted-foreground">
        {status.kind === 'initial'
          ? text.initial
          : status.kind === 'opened'
            ? text.opened
            : `${text.closedWith} ${text[status.method]}. ${text.focusReturned} `}
        {status.kind === 'closed' && (
          <>
            <strong className="text-foreground">{labels[status.trigger]}</strong> {text.andRing}{' '}
            {visible ? text.visible : text.hidden}.
          </>
        )}
      </p>
    </div>
  );
}
