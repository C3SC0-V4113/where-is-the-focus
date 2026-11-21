import { contrastRatio } from './contrast';

export type RingStyle = 'solid' | 'dashed' | 'dotted' | 'double';
export type RingBackground = 'light' | 'dark' | 'brand' | 'photo';
export type RingColor = 'blue' | 'ink' | 'white' | 'pastel';

export const ringColors: Record<RingColor, string> = {
  blue: '#1d2fd8',
  ink: '#141414',
  white: '#ffffff',
  pastel: '#9fb0ff',
};

const backgrounds: Record<RingBackground, readonly string[]> = {
  light: ['#eef0fb'],
  dark: ['#14172a'],
  brand: ['#1d2fd8'],
  photo: ['#1e2a7a', '#5b4ca0', '#e2a46a', '#f6ecd9'],
};

export type RingVerdictRow =
  | { kind: 'contrast'; state: 'ok' | 'warn' | 'bad'; minimum: number; maximum: number }
  | { kind: 'width'; state: 'ok' | 'warn'; value: number }
  | { kind: 'style'; state: 'ok' | 'warn'; style: 'dashed' | 'dotted' };

export interface RingVerdictInput {
  color: RingColor;
  background: RingBackground;
  style: RingStyle;
  width: number;
}

export function getRingVerdict(input: RingVerdictInput): RingVerdictRow[] {
  const ringHex = input.style === 'double' ? ['#ffffff', '#141414'] : [ringColors[input.color]];
  const ratios = backgrounds[input.background].map((background) =>
    Math.max(...ringHex.map((color) => contrastRatio(color, background)))
  );
  const minimum = Math.min(...ratios);
  const maximum = Math.max(...ratios);
  const rows: RingVerdictRow[] = [
    {
      kind: 'contrast',
      state: minimum >= 3 ? 'ok' : maximum >= 3 ? 'warn' : 'bad',
      minimum,
      maximum,
    },
    { kind: 'width', state: input.width >= 2 ? 'ok' : 'warn', value: input.width },
  ];
  if (input.style === 'dashed' || input.style === 'dotted') {
    rows.push({
      kind: 'style',
      state: input.background === 'photo' ? 'warn' : 'ok',
      style: input.style,
    });
  }
  return rows;
}
