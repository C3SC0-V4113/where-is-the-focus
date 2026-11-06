export interface CodeSnippet {
  css: string;
  tw: string;
}

export const snippets = {
  fv: {
    css: `/* 1. Nada para el ratón */
:focus:not(:focus-visible) {
  outline: none;
}

/* 2. Indicador claro para el teclado */
:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 3px;
}`,
    tw: `<!-- Antes: también aparece tras cada clic -->
<button class="focus:outline-3 focus:outline-red-700">
  Guardar cambios
</button>

<!-- Después: solo con teclado -->
<button class="focus-visible:outline-3
               focus-visible:outline-offset-3
               focus-visible:outline-blue-700">
  Guardar cambios
</button>`,
  },
  shadcn: {
    css: `/* globals.css: ajusta --ring y añade estados */
:root {
  --ring: oklch(0.47 0.25 266);          /* 6,5:1 sobre blanco */
  --success: oklch(0.43 0.11 155);
  --success-muted: oklch(0.95 0.04 155);
  --warning: oklch(0.48 0.11 65);
  --warning-muted: oklch(0.96 0.05 85);
  --destructive-muted: oklch(0.95 0.03 25);
}
.dark {
  --ring: oklch(0.78 0.11 272);
  --success: oklch(0.82 0.12 155);
  --success-muted: oklch(0.27 0.05 155);
  --warning: oklch(0.86 0.12 85);
  --warning-muted: oklch(0.29 0.05 75);
  --destructive-muted: oklch(0.27 0.06 25);
}
@theme inline {
  --color-success: var(--success);
  --color-success-muted: var(--success-muted);
  --color-warning: var(--warning);
  --color-warning-muted: var(--warning-muted);
  --color-destructive-muted: var(--destructive-muted);
}`,
    tw: `<!-- Foco de los componentes: anillo opaco y doble -->
<Button className="focus-visible:ring-ring
                   focus-visible:ring-3
                   focus-visible:ring-offset-2
                   focus-visible:ring-offset-background
                   focus-visible:outline-hidden">
  Guardar cambios
</Button>

<!-- Estados de cumplimiento con los tokens nuevos -->
<Badge className="bg-success-muted text-success">Cumple</Badge>
<Badge className="bg-warning-muted text-warning">Parcial</Badge>
<Badge className="bg-destructive-muted text-destructive">
  No cumple
</Badge>`,
  },
} satisfies Record<string, CodeSnippet>;

const translations: ReadonlyArray<readonly [string, string]> = [
  ['Nada para el ratón', 'Nothing for the mouse'],
  ['Indicador claro para el teclado', 'Clear indicator for the keyboard'],
  ['Antes: también aparece tras cada clic', 'Before: also shows after every click'],
  ['Después: solo con teclado', 'After: keyboard only'],
  ['Guardar cambios', 'Save changes'],
  ['globals.css: ajusta --ring y añade estados', 'globals.css: adjust --ring and add states'],
  ['6,5:1 sobre blanco', '6.5:1 on white'],
  ['Foco de los componentes: anillo opaco y doble', 'Component focus: opaque double ring'],
  ['Estados de cumplimiento con los tokens nuevos', 'Compliance states with the new tokens'],
  ['Cumple', 'Pass'],
  ['Parcial', 'Partial'],
  ['No cumple', 'Fail'],
];

export function getSnippetCode(snippet: CodeSnippet, language: 'css' | 'tw', locale: 'es' | 'en') {
  const code = snippet[language];
  return locale === 'en'
    ? translations.reduce(
        (translated, [spanish, english]) => translated.split(spanish).join(english),
        code
      )
    : code;
}
