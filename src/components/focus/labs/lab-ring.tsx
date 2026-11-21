'use client';

import { memo, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { CodeExample } from '@/components/common/code-example';
import { ComplianceBadge } from '@/components/common/compliance-badge';
import { RichText } from '@/components/common/rich-text';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { en, es, type Locale } from '@/i18n/messages';
import { getRingSnippet } from '@/lib/focus/ring-snippet';
import {
  getRingVerdict,
  type RingBackground,
  type RingColor,
  type RingStyle,
} from '@/lib/focus/ring-verdict';
import { getSnippetCode } from '@/lib/focus/snippets';

type RingLabCopy = typeof es.sections.ring.lab2 | typeof en.sections.ring.lab2;

const styleValues: RingStyle[] = ['solid', 'dashed', 'dotted', 'double'];
const colorValues: RingColor[] = ['blue', 'ink', 'white', 'pastel'];
const backgroundValues: RingBackground[] = ['light', 'dark', 'brand', 'photo'];

function ChoiceGroup({
  title,
  values,
  labels,
  value,
  disabled = false,
  onChange,
}: {
  title: string;
  values: readonly string[];
  labels: readonly string[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <fieldset className="grid min-w-0 gap-2 border-0 p-0">
      <legend
        className="font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase"
        id={`${id}-legend`}
      >
        {title}
      </legend>
      <RadioGroup
        aria-labelledby={`${id}-legend`}
        className="flex flex-wrap gap-2"
        defaultValue={value}
        disabled={disabled}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        {values.map((option, index) => {
          const optionId = `${id}-${option}`;
          return (
            <div className="flex items-center gap-1.5" key={option}>
              <RadioGroupItem aria-labelledby={`${optionId}-label`} id={optionId} value={option} />
              <Label className="cursor-pointer text-sm" htmlFor={optionId} id={`${optionId}-label`}>
                {labels[index]}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}

const RingStage = memo(function RingStage({
  save,
  preview,
  background,
  ringStyle,
  color,
  width,
  offset,
}: {
  save: string;
  preview: string;
  background: RingBackground;
  ringStyle: RingStyle;
  color: RingColor;
  width: number;
  offset: number;
}) {
  const stageRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty('--lab-ring-width', `${width}px`);
    stage.style.setProperty('--lab-ring-offset', `${offset}px`);
  }, [offset, width]);
  return (
    <div
      className="grid min-h-64 place-items-center gap-4 p-8"
      data-bg={background}
      data-lab-ring-stage
    >
      <Button
        className="h-auto rounded-lg border-0 px-6 py-3.5 text-base font-semibold"
        data-lab-ring-specimen
        data-ring-style={ringStyle}
        data-ring-color={color}
        ref={stageRef}
        type="button"
      >
        {save}
      </Button>
      <span className="rounded-sm px-2 py-1 font-mono text-xs" data-lab-ring-note>
        {preview}
      </span>
    </div>
  );
});

function rowText(row: ReturnType<typeof getRingVerdict>[number], text: RingLabCopy) {
  if (row.kind === 'contrast') {
    const value =
      row.state === 'warn'
        ? `${text.contrast}: ${text.between} ${row.minimum.toFixed(1)}:1 ${text.and} ${row.maximum.toFixed(1)}:1`
        : `${text.contrast}: ${row.minimum.toFixed(1)}:1`;
    const description =
      row.state === 'ok'
        ? text.contrastOk
        : row.state === 'warn'
          ? text.contrastWarn
          : text.contrastBad;
    return `${value}. ${description[0]!.toUpperCase()}${description.slice(1)}.`;
  }
  if (row.kind === 'width') {
    const description = row.state === 'ok' ? text.widthOk : text.widthWarn;
    return `${text.width}: ${row.value}px. ${description[0]!.toUpperCase()}${description.slice(1)}.`;
  }
  const name = row.style === 'dashed' ? text.dashed : text.dotted;
  const description = row.state === 'warn' ? text.photoStyle : text.flatStyle;
  return `${name}. ${description[0]!.toUpperCase()}${description.slice(1)}.`;
}

const RingVerdict = memo(function RingVerdict({
  rows,
  locale,
}: {
  rows: ReturnType<typeof getRingVerdict>;
  locale: Locale;
}) {
  const text = (locale === 'en' ? en : es).sections.ring.lab2;
  const states = ['ok', 'warn', 'bad'] as const;
  return (
    <div
      aria-live="polite"
      className="grid gap-2 border-t border-dashed border-border pt-4"
      data-lab-verdict
    >
      {rows.map((row) => (
        <div className="flex flex-wrap items-baseline gap-2 text-sm leading-relaxed" key={row.kind}>
          <ComplianceBadge state={row.state}>
            {text.state[states.indexOf(row.state)]}
          </ComplianceBadge>
          <span>{rowText(row, text)}</span>
        </div>
      ))}
    </div>
  );
});

export function LabRing({ locale }: { locale: Locale }) {
  const text = (locale === 'en' ? en : es).sections.ring.lab2;
  const [style, setStyle] = useState<RingStyle>('solid');
  const [color, setColor] = useState<RingColor>('blue');
  const [background, setBackground] = useState<RingBackground>('light');
  const [width, setWidth] = useState(3);
  const [offset, setOffset] = useState(3);
  const rows = useMemo(
    () => getRingVerdict({ style, color, background, width }),
    [background, color, style, width]
  );
  const snippet = useMemo(
    () => getRingSnippet({ color, style, width, offset }),
    [color, offset, style, width]
  );
  const labels = (locale === 'en' ? en : es).codeExample;
  const code = (language: 'css' | 'tw') => getSnippetCode(snippet, language, locale);
  return (
    <div className="grid gap-5">
      <div className="grid overflow-hidden rounded-sm border border-border bg-background md:grid-cols-2">
        <RingStage
          background={background}
          color={color}
          offset={offset}
          preview={text.preview}
          save={text.save}
          ringStyle={style}
          width={width}
        />
        <div className="grid content-start gap-4 p-5">
          <ChoiceGroup
            labels={text.styles}
            onChange={(value) => setStyle(value as RingStyle)}
            title={text.style}
            value="solid"
            values={styleValues}
          />
          <ChoiceGroup
            disabled={style === 'double'}
            labels={text.colors}
            onChange={(value) => setColor(value as RingColor)}
            title={text.color}
            value="blue"
            values={colorValues}
          />
          <ChoiceGroup
            labels={text.backgrounds}
            onChange={(value) => setBackground(value as RingBackground)}
            title={text.background}
            value="light"
            values={backgroundValues}
          />
          <div className="grid items-center gap-3 text-sm" data-lab-ring-range>
            <Label id="lab-ring-width-label">{text.width}</Label>
            <Slider
              aria-labelledby="lab-ring-width-label"
              defaultValue={[3]}
              max={6}
              min={1}
              onValueChange={(value) =>
                setWidth(typeof value === 'number' ? value : (value[0] ?? 3))
              }
              step={1}
            />
            <output className="text-right font-mono text-xs">{width}px</output>
          </div>
          <div className="grid items-center gap-3 text-sm" data-lab-ring-range>
            <Label id="lab-ring-offset-label">{text.offset}</Label>
            <Slider
              aria-labelledby="lab-ring-offset-label"
              defaultValue={[3]}
              max={8}
              min={0}
              onValueChange={(value) =>
                setOffset(typeof value === 'number' ? value : (value[0] ?? 3))
              }
              step={1}
            />
            <output className="text-right font-mono text-xs">{offset}px</output>
          </div>
          <RingVerdict locale={locale} rows={rows} />
        </div>
      </div>
      <CodeExample css={code('css')} labels={labels} tailwind={code('tw')} />
      <p className="m-0 text-sm leading-relaxed text-muted-foreground">
        <RichText text={text.note} />
      </p>
    </div>
  );
}
