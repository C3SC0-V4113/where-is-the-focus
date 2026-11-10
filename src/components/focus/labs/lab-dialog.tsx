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

type Status =
  | { kind: 'initial' }
  | { kind: 'opened' }
  | { kind: 'closed'; trigger: 0 | 1; method: 'mouse' | 'keyboard'; visible: boolean };

export function LabDialog({ locale }: { locale: Locale }) {
  const text = (locale === 'en' ? en : es).sections.movement.lab5;
  const via = useRef<'ptr' | 'key'>('key');
  const openedTrigger = useRef<0 | 1>(0);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'initial' });
  const triggers = [text.triggerFocus, text.triggerFocusVisible];

  return (
    <div className="grid gap-4">
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) {
            setStatus({ kind: 'opened' });
          } else {
            const trigger = openedTrigger.current;
            const visible = trigger === 0 || via.current !== 'ptr';
            setStatus({
              kind: 'closed',
              trigger,
              method: via.current === 'ptr' ? 'mouse' : 'keyboard',
              visible,
            });
          }
        }}
      >
        <div className="flex flex-wrap gap-3">
          {triggers.map((label, index) => (
            <AlertDialogTrigger
              key={label}
              render={
                <Button
                  className={
                    index === 0
                      ? 'h-auto rounded-md border-0 bg-foreground px-5 py-3 text-base font-semibold text-background transition-none focus:shadow-none focus:outline-3 focus:outline-offset-3 focus:outline-destructive-text focus-visible:border-transparent'
                      : 'h-auto rounded-md border-0 bg-foreground px-5 py-3 text-base font-semibold text-background transition-none focus:shadow-none focus:outline-none focus-visible:border-transparent focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:outline-solid'
                  }
                  onClick={() => {
                    openedTrigger.current = index as 0 | 1;
                  }}
                />
              }
            >
              {label}
            </AlertDialogTrigger>
          ))}
        </div>
        <AlertDialogContent
          onKeyDownCapture={() => {
            via.current = 'key';
          }}
          onPointerDownCapture={() => {
            via.current = 'ptr';
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{text.dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{text.dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
            <AlertDialogAction className="focus-visible:border-transparent focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:outline-solid">
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
            <strong className="text-foreground">{triggers[status.trigger]}</strong> {text.andRing}{' '}
            {status.visible ? text.visible : text.hidden}.
          </>
        )}
      </p>
    </div>
  );
}
