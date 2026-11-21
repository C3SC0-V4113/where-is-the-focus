function channels(hex: string): [number, number, number] {
  const value = hex.replace(/^#/, '');
  const expanded = value.length === 3 ? [...value].map((part) => part + part).join('') : value;
  if (!/^[\da-f]{6}$/i.test(expanded)) throw new TypeError(`Invalid hex color: ${hex}`);
  return [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

function linearize(value: number) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = channels(hex).map(linearize);
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
