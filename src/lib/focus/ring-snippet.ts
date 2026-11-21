import { ringColors, type RingColor, type RingStyle } from '@/lib/focus/ring-verdict';

import type { CodeSnippet } from '@/lib/focus/snippets';

export interface RingSnippetInput {
  color: RingColor;
  style: RingStyle;
  width: number;
  offset: number;
}

export function getRingSnippet(input: RingSnippetInput): CodeSnippet {
  if (input.style === 'double') {
    return {
      css: `.btn:focus-visible {\n  outline: 2px solid transparent; /* alto contraste */\n  box-shadow: 0 0 0 ${input.offset}px #fff,\n              0 0 0 ${input.offset + input.width}px #141414;\n}`,
      tw: `<button class="focus-visible:outline-hidden\n  focus-visible:shadow-[0_0_0_${input.offset}px_#fff,0_0_0_${input.offset + input.width}px_#141414]">\n  Guardar cambios\n</button>`,
    };
  }
  const color = ringColors[input.color];
  return {
    css: `.btn:focus-visible {\n  outline: ${input.width}px ${input.style} ${color};\n  outline-offset: ${input.offset}px;\n}`,
    tw: `<button class="focus-visible:outline-${input.width}\n  ${input.style === 'solid' ? 'focus-visible:outline-solid' : `focus-visible:outline-${input.style}`}\n  focus-visible:outline-offset-${input.offset}\n  focus-visible:outline-[${color}]">\n  Guardar cambios\n</button>`,
  };
}
