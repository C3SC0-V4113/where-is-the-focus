import { en, es, type Locale } from '@/i18n/messages';

import { RovingTabsManual } from './roving-tabs-manual';
import { RovingTabsShadcn } from './roving-tabs-shadcn';

export function LabRovingTabs({ locale }: { locale: Locale }) {
  const text = (locale === 'en' ? en : es).sections.movement.lab6;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="grid min-w-0 content-start gap-2">
        <h3 className="m-0 font-mono text-xs font-semibold tracking-wider uppercase">
          {text.manual}
        </h3>
        <RovingTabsManual locale={locale} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <h3 className="m-0 font-mono text-xs font-semibold tracking-wider uppercase">
          {text.shadcn}
        </h3>
        <RovingTabsShadcn locale={locale} />
      </div>
    </div>
  );
}
