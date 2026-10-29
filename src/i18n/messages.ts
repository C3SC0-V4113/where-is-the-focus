export type Locale = 'es' | 'en';

export const es = {
  title: 'Dónde está el foco',
  description:
    'Quien navega con teclado no tiene puntero. Lo que le dice dónde está es el indicador de foco, así que merece el mismo cuidado que cualquier otro estado de un componente.',
  ogImageAlt: 'Cuadrado azul de la marca y el título «Dónde está el foco».',
  skipLink: 'Saltar al contenido',
  languageLabel: 'Idioma',
  themeLabel: 'Tema',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
  footerName: 'Francisco Valle',
  footerRole: 'FrontEnd Web',
} as const;

type MessageShape = { [Key in keyof typeof es]: string };

export const en = {
  title: 'Where is the focus',
  description:
    'Keyboard users have no pointer. What tells them where they are is the focus indicator, so it deserves the same care as any other component state.',
  ogImageAlt: 'Blue brand square and the title “Where is the focus”.',
  skipLink: 'Skip to content',
  languageLabel: 'Language',
  themeLabel: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  footerName: 'Francisco Valle',
  footerRole: 'FrontEnd Web',
} satisfies MessageShape;
