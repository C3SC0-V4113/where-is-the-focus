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
  campo: {
    css: `.field { position: relative; }
.field .bar {
  position: absolute; inset: auto 0 0;
  height: 3px; background: var(--focus-color);
  transform: scaleX(0); transition: transform .25s;
}
.field:focus-within .bar { transform: scaleX(1); }
.field:focus-within label { color: var(--focus-color); }
/* para el modo de alto contraste */
.field input:focus { outline: 2px solid transparent; }`,
    tw: `<div class="group relative grid gap-1">
  <label class="text-sm text-stone-600 group-focus-within:text-blue-700">
    Correo electrónico
  </label>
  <input class="peer border-b-[1.5px] border-stone-500 bg-transparent py-2 focus:outline-hidden">
  <span class="absolute inset-x-0 bottom-0 h-[3px] scale-x-0 bg-blue-700 transition-transform peer-focus:scale-x-100"></span>
</div>`,
  },
  invertir: {
    css: `.btn-outline {
  border: 2px solid currentColor;
  background: transparent;
}
.btn-outline:hover { background: rgb(0 0 0 / .08); }
.btn-outline:focus-visible {
  outline: 2px solid transparent;
  background: var(--text);
  color: var(--bg);
}`,
    tw: `<button class="rounded-full border-2 border-current px-5 py-3 hover:bg-black/5 focus-visible:bg-stone-900 focus-visible:text-white focus-visible:outline-hidden">
  Descargar informe
</button>`,
  },
  nav: {
    css: `nav a { position: relative; }
nav a::after {
  content: ""; position: absolute; inset: auto 0 0;
  height: 3px; background: var(--focus-color);
  transform: scaleX(0); transform-origin: left;
  transition: transform .2s;
}
nav a:hover::after { transform: scaleX(.35); }
nav a:focus-visible {
  color: var(--focus-color);
  outline: 2px solid transparent;
}
nav a:focus-visible::after { transform: scaleX(1); }`,
    tw: `<a class="relative py-1.5 after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:bg-blue-700 after:transition-transform hover:after:scale-x-35 focus-visible:text-blue-700 focus-visible:outline-hidden focus-visible:after:scale-x-100">
  Productos
</a>`,
  },
  subrayador: {
    css: `a {
  background: linear-gradient(var(--focus-color) 0 0)
              no-repeat 0 100% / 0% 100%;
  transition: background-size .25s, color .25s;
}
a:focus-visible {
  outline: 2px solid transparent;
  background-size: 100% 100%;
  color: #fff;
}`,
    tw: `<a class="bg-linear-to-r from-blue-700 to-blue-700 bg-no-repeat bg-size-[0%_100%] bg-left-bottom underline decoration-blue-700 transition-[background-size,color] focus-visible:bg-size-[100%_100%] focus-visible:text-white focus-visible:outline-hidden">
  términos de envío
</a>`,
  },
  visor: {
    css: `.card { position: relative; }
.card::before {
  content: ""; position: absolute; inset: -8px;
  --c: var(--focus-color);
  background:
    linear-gradient(var(--c) 0 0) top left / 18px 3px,
    linear-gradient(var(--c) 0 0) top left / 3px 18px,
    /* …repetir para las otras tres esquinas */;
  background-repeat: no-repeat;
  opacity: 0; transform: scale(1.08);
  transition: opacity .18s, transform .22s;
}
.card:focus-visible { outline: 2px solid transparent; }
.card:focus-visible::before { opacity: 1; transform: none; }`,
    tw: `/* Con tantos fondos, conviene una utilidad propia.
   En tu CSS de entrada (Tailwind v4): */
@utility focus-visor {
  &::before { /* el mismo bloque que en CSS */ }
  &:focus-visible { outline: 2px solid transparent; }
  &:focus-visible::before { opacity: 1; transform: none; }
}

<!-- y en el marcado -->
<a class="relative rounded-lg border p-4 focus-visor">
  Plan Equipo
</a>`,
  },
  capa: {
    css: `.thumb { position: relative; display: block; }
.thumb .veil {
  position: absolute; inset: 0;
  background: rgb(19 28 120 / .88);
  opacity: 0; transition: opacity .2s;
}
.thumb:is(:hover, :focus-visible) .veil { opacity: 1; }
.thumb:focus-visible { outline: 2px solid transparent; }
.thumb:focus-visible .veil { box-shadow: inset 0 0 0 3px #fff; }`,
    tw: `<a class="group relative block overflow-hidden rounded-lg focus-visible:outline-hidden">
  <img src="ruta.jpg" alt="">
  <span class="absolute inset-0 grid place-items-center bg-blue-950/90 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-visible:inset-ring-3 group-focus-visible:inset-ring-white">
    Ver ruta →
  </span>
</a>`,
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
  ['para el modo de alto contraste', 'for high-contrast mode'],
  ['Correo electrónico', 'Email'],
  ['Descargar informe', 'Download report'],
  ['Productos', 'Products'],
  ['términos de envío', 'shipping terms'],
  ['repetir para las otras tres esquinas', 'repeat for the other three corners'],
  [
    'Con tantos fondos, conviene una utilidad propia.',
    'With several backgrounds, define a utility.',
  ],
  ['En tu CSS de entrada (Tailwind v4):', 'In your Tailwind v4 stylesheet:'],
  ['el mismo bloque que en CSS', 'same block as CSS'],
  ['y en el marcado', 'and in the markup'],
  ['Plan Equipo', 'Team plan'],
  ['ruta.jpg', 'path/to/image.jpg'],
  ['Ver ruta →', 'View route →'],
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
