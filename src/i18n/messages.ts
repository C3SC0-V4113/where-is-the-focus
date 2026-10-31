export type Locale = 'es' | 'en';

export const es = {
  title: 'Dónde está el foco',
  description:
    'Quien navega con teclado no tiene puntero. Lo que le dice dónde está es el indicador de foco, así que merece el mismo cuidado que cualquier otro estado de un componente.',
  heroEyebrow: 'Foco visible · WCAG 2.2 · CSS y Tailwind',
  heroTabHint: 'Esta página se recorre con [[Tab]]. Pruébalo.',
  heroMeta: '8 argumentos · 6 laboratorios · ejemplos en CSS y Tailwind v4',
  heroTitleBefore: 'El ',
  heroTitleRinged: 'foco',
  heroTitleAfter: ' también es diseño',
  tocLabel: 'Contenido',
  tocEntry01: 'El planteamiento',
  tocEntry02: 'Qué piden las reglas',
  tocEntry03: 'Teclado sí, clic no',
  tocEntry04: 'Diseñar el indicador',
  tocEntry05: 'Más allá del anillo',
  tocEntry06: 'Que nada lo tape',
  tocEntry07: 'A dónde va el foco',
  tocEntry08: 'Preguntas frecuentes',
  ogImageAlt: 'Cuadrado azul de la marca y el título «Dónde está el foco».',
  skipLink: 'Saltar al contenido',
  languageLabel: 'Idioma',
  themeLabel: 'Tema',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
  footerName: 'Francisco Valle',
  footerRole: 'FrontEnd Web',
  sections: {
    premise: {
      number: '01 · El planteamiento',
      title: 'El problema no es el foco.',
      soft: 'Es el anillo que nadie diseñó.',
      intro:
        'Casi todas las quejas sobre el foco tienen el mismo origen: el contorno por defecto del navegador aparece después de cada clic y no combina con nada. La reacción habitual es quitarlo con una línea de CSS. Eso resuelve la queja visual, pero deja sin orientación a quien usa teclado, lector de pantalla o un dispositivo de acceso.',
      lead: 'Hay una salida mejor, y casi siempre cuesta menos que la discusión: mostrar el foco solo cuando hace falta y diseñarlo como un estado más.',
      failTitle: 'Lo que suele salir mal',
      failures:
        'Se elimina el contorno con `outline: none` y no se pone nada en su lugar.|El indicador es solo un cambio de color suave, por debajo del contraste 3:1.|Una cabecera fija o un banner tapa el elemento enfocado.|Al cerrar un modal o borrar un elemento, el foco se pierde en el inicio de la página.',
      goodTitle: 'Lo que funciona',
      good: '`:focus-visible` muestra el indicador con teclado y no después de un clic.|Un doble anillo, claro y oscuro, mantiene el contraste sobre cualquier fondo.|`scroll-padding` reserva el espacio de lo que está fijo.|El foco se mueve a propósito: al título nuevo, al siguiente elemento o al botón de origen.',
    },
    rules: {
      number: '02 · Qué piden las reglas',
      title: 'Visible, sin tapar y con contraste',
      intro:
        'Ningún criterio de WCAG obliga a usar un recuadro azul. Piden tres cosas: que el foco se vea, que nada lo cubra y que se distinga de lo que lo rodea. La forma es una decisión de diseño.',
      criterionTitles: 'Foco visible|Foco no oculto|Contraste no textual|Apariencia del foco',
      criterionText:
        'Todo lo que se opera con teclado tiene un indicador visible. Quitar el contorno sin sustituto es un fallo directo.|Nuevo en 2.2. El elemento enfocado no puede quedar tapado por completo por cabeceras fijas, banners o chats.|El indicador necesita 3:1 frente a los colores que tiene al lado.|Opcional, pero es buena referencia: un área de al menos 2 px de perímetro y 3:1 entre el estado con foco y sin foco.',
      legend: 'Cómo leer los resultados de los laboratorios',
      stateLabels: 'Cumple|Parcial|No cumple',
      stateText:
        'cumple el criterio|cumple AA pero no AAA, o solo en parte de la superficie|falla un criterio AA',
      more: 'Las páginas «Understanding» del W3C explican cada criterio con ejemplos y técnicas. Están enlazadas en el título de cada tarjeta.',
    },
    focusVisible: {
      number: '03 · Teclado sí, clic no',
      title: 'Mostrarlo solo cuando hace falta',
      paragraphs: [
        '`:focus` se activa cada vez que un elemento recibe el foco, también con un clic. `:focus-visible` se activa solo cuando el navegador entiende que la persona necesita verlo: al usar el teclado, o cuando un script mueve el foco después de usarlo. Funciona en todos los navegadores actuales desde 2022.',
        'Este cambio de selector resuelve la mayoría de las quejas: quien usa el ratón deja de ver anillos tras cada clic, y quien usa teclado los sigue teniendo.',
      ],
      more: {
        label: 'Más: ',
        separator: ' · ',
        links: [
          {
            text: ':focus-visible en MDN',
          },
          {
            text: 'Vercel, «Clear focus» en las Web Interface Guidelines',
          },
        ],
      },
    },
    ring: {
      number: '04 · Diseñar el indicador',
      title: 'Un anillo pensado para el fondo donde vive',
      paragraphs: [
        'Un anillo de un solo color funciona sobre un fondo y desaparece sobre otro. Sobre el color de marca su contraste puede bajar a 1:1. El doble anillo lleva un aro claro y uno oscuro, así que siempre hay uno que contrasta.',
        'El estilo discontinuo o punteado también es válido sobre colores planos. Sobre una foto, sus huecos dejan pasar la imagen y el contorno se fragmenta. Prueba las combinaciones y copia el resultado.',
      ],
      more: {
        label: 'Más: ',
        links: [
          {
            text: 'Sara Soueidan, «A guide to designing accessible, WCAG-conformant focus indicators»',
          },
        ],
        after: ', con el indicador blanco y negro probado sobre varios fondos.',
      },
      pull: 'Si usas shadcn/ui, revisa el token `--ring`.',
      pullParagraph:
        'Los componentes de shadcn dibujan el foco con `--ring`, y en el tema neutral es un gris claro (`oklch(0.708 0 0)`) que sobre blanco da unos 2,6:1. Por debajo del 3:1 de 1.4.11. Además, varios componentes lo aplican con transparencia (`ring-ring/50`), lo que baja aún más el contraste. Basta con cambiar el token y añadir los estados que usa esta página.',
      pullMore: {
        label: 'Más: ',
        links: [{ text: 'tokens y temas en shadcn/ui' }],
      },
    },
    beyondRing: {
      number: '05 · Más allá del anillo',
      title: 'Cualquier cambio claro sirve',
      paragraphs: [
        'WCAG pide que se vea dónde está el foco, no que haya un anillo. Una línea, un relleno o un marco valen si cumplen cuatro condiciones: 3:1 de contraste entre estados, algo más que un cambio de tono, un aspecto distinto del hover y nada que lo recorte.',
        'Recorre las seis piezas con [[Tab]] y compáralas con el ratón. Todas dejan un contorno transparente debajo para el modo de alto contraste.',
      ],
      more: {
        label: 'Más: ',
        links: [{ text: 'cómo medir el área y el contraste en 2.4.13' }],
      },
    },
  },
} as const;

type Localized<T> = T extends readonly unknown[]
  ? { [Key in keyof T]: Localized<T[Key]> }
  : T extends object
    ? { [Key in keyof T]: Localized<T[Key]> }
    : string;
type MessageShape = Localized<typeof es>;

export const en = {
  title: 'Where is the focus',
  description:
    'Keyboard users have no pointer. What tells them where they are is the focus indicator, so it deserves the same care as any other component state.',
  heroEyebrow: 'Visible focus · WCAG 2.2 · CSS and Tailwind',
  heroTabHint: 'This page can be navigated with [[Tab]]. Try it.',
  heroMeta: '8 arguments · 6 labs · examples in CSS and Tailwind v4',
  heroTitleBefore: '',
  heroTitleRinged: 'Focus',
  heroTitleAfter: ' is design too',
  tocLabel: 'Contents',
  tocEntry01: 'The premise',
  tocEntry02: 'What the rules ask for',
  tocEntry03: 'Keyboard yes, click no',
  tocEntry04: 'Designing the indicator',
  tocEntry05: 'Beyond the ring',
  tocEntry06: 'Nothing should cover it',
  tocEntry07: 'Where focus goes',
  tocEntry08: 'Frequent questions',
  ogImageAlt: 'Blue brand square and the title “Where is the focus”.',
  skipLink: 'Skip to content',
  languageLabel: 'Language',
  themeLabel: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  footerName: 'Francisco Valle',
  footerRole: 'FrontEnd Web',
  sections: {
    premise: {
      number: '01 · The premise',
      title: 'The problem isn’t focus.',
      soft: 'It’s the ring nobody designed.',
      intro:
        'Almost every complaint about focus has the same origin: the browser’s default outline appears after every click and matches nothing. The usual reaction is to remove it with one line of CSS. That solves the visual complaint, but leaves people who use a keyboard, a screen reader or an assistive device without orientation.',
      lead: 'There is a better way out, and it usually costs less than the argument: show focus only when it’s needed and design it as one more state.',
      failTitle: 'What usually goes wrong',
      failures:
        'The outline is removed with `outline: none` and nothing replaces it.|The indicator is only a subtle color change, below 3:1 contrast.|A sticky header or a banner covers the focused element.|When a modal closes or an item is deleted, focus is lost at the top of the page.',
      goodTitle: 'What works',
      good: '`:focus-visible` shows the indicator for keyboard users, not after a click.|A double ring, light and dark, keeps contrast on any background.|`scroll-padding` reserves the space taken by fixed elements.|Focus moves on purpose: to the new heading, the next item or the button that opened something.',
    },
    rules: {
      number: '02 · What the rules ask for',
      title: 'Visible, uncovered and with contrast',
      intro:
        'No WCAG criterion requires a blue box. They ask for three things: that focus can be seen, that nothing covers it and that it stands out from what surrounds it. The shape is a design decision.',
      criterionTitles: 'Focus visible|Focus not obscured|Non-text contrast|Focus appearance',
      criterionText:
        'Everything operable by keyboard has a visible indicator. Removing the outline with no replacement is a direct failure.|New in 2.2. The focused element can’t be fully hidden by sticky headers, banners or chat widgets.|The indicator needs 3:1 against the colors next to it.|Optional, but a good benchmark: an area of at least a 2 px perimeter and 3:1 between the focused and unfocused states.',
      legend: 'How to read the lab results',
      stateLabels: 'Pass|Partial|Fail',
      stateText:
        'meets the criterion|meets AA but not AAA, or only on part of the surface|fails an AA criterion',
      more: 'The W3C “Understanding” pages explain each criterion with examples and techniques. They’re linked from each card’s title.',
    },
    focusVisible: {
      number: '03 · Keyboard yes, click no',
      title: 'Show it only when it’s needed',
      paragraphs: [
        '`:focus` matches whenever an element receives focus, including on click. `:focus-visible` matches only when the browser decides the person needs to see it: when using the keyboard, or when a script moves focus after keyboard use. It works in every current browser since 2022.',
        'This selector change solves most complaints: mouse users stop seeing rings after every click, and keyboard users keep them.',
      ],
      more: {
        label: 'More: ',
        separator: ' · ',
        links: [
          {
            text: ':focus-visible on MDN',
          },
          {
            text: 'Vercel, “Clear focus” in the Web Interface Guidelines',
          },
        ],
      },
    },
    ring: {
      number: '04 · Designing the indicator',
      title: 'A ring designed for the background it lives on',
      paragraphs: [
        'A single-color ring works on one background and disappears on another. On the brand color its contrast can drop to 1:1. The double ring has a light band and a dark band, so one of them always contrasts.',
        'Dashed or dotted styles are also valid on flat colors. On a photo, their gaps let the image through and the outline breaks up. Try the combinations and copy the result.',
      ],
      more: {
        label: 'More: ',
        links: [
          {
            text: 'Sara Soueidan, “A guide to designing accessible, WCAG-conformant focus indicators”',
          },
        ],
        after: ', with the black-and-white indicator tested on several backgrounds.',
      },
      pull: 'If you use shadcn/ui, check the `--ring` token.',
      pullParagraph:
        'shadcn components draw focus with `--ring`, and in the neutral theme it’s a light gray (`oklch(0.708 0 0)`) that gives about 2.6:1 on white. That’s below the 3:1 required by 1.4.11. Several components also apply it with transparency (`ring-ring/50`), which lowers contrast further. Changing the token and adding the states this page uses is enough.',
      pullMore: {
        label: 'More: ',
        links: [{ text: 'tokens and theming in shadcn/ui' }],
      },
    },
    beyondRing: {
      number: '05 · Beyond the ring',
      title: 'Any clear change works',
      paragraphs: [
        'WCAG asks that you can see where focus is, not that there’s a ring. A line, a fill or a frame are fine if they meet four conditions: 3:1 contrast between states, more than a change of hue, a look different from hover, and nothing clipping it.',
        'Move through the six pieces with [[Tab]] and compare them with the mouse. All of them keep a transparent outline underneath for high contrast mode.',
      ],
      more: {
        label: 'More: ',
        links: [{ text: 'how to measure area and contrast in 2.4.13' }],
      },
    },
  },
} satisfies MessageShape;
