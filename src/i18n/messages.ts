export type Locale = 'es' | 'en';

export const es = {
  title: 'Dónde está el foco',
  skipLink: 'Saltar al contenido',
  languageLabel: 'Idioma',
  languageSpanish: 'Español',
  languageEnglish: 'English',
  footerName: 'Francisco Valle',
  footerRole: 'FrontEnd Web',
} as const;

type MessageShape = { [Key in keyof typeof es]: string };

export const en = {
  title: 'Where is the focus',
  skipLink: 'Skip to content',
  languageLabel: 'Language',
  languageSpanish: 'Español',
  languageEnglish: 'English',
  footerName: 'Francisco Valle',
  footerRole: 'FrontEnd Web',
} satisfies MessageShape;
