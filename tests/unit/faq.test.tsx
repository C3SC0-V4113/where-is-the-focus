import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { FAQ } from '@/components/focus/faq';

const faqCopy = {
  es: {
    questions: [
      '«El anillo se ve feo»',
      '«Al cerrar el modal, el botón se queda marcado»',
      '«Casi nadie navega con teclado»',
      '«¿No basta con cambiar el color del botón?»',
      '«Usamos una librería de componentes»',
    ],
    answers: [
      'El anillo por defecto del navegador no está pensado para ninguna marca. Uno diseñado con los colores, el radio y la separación del sistema de diseño se integra igual que el hover. Si aun así no convence, las piezas del punto 05 ofrecen alternativas sin anillo.',
      'El foco tiene que volver al botón; si no, quien usa teclado acaba al principio de la página. Con :focus-visible ese regreso no se ve tras un clic y sí tras Esc. Lo puedes comprobar en el laboratorio 5.',
      'El teclado lo usan personas con movilidad reducida, usuarios de lectores de pantalla, de conmutadores y de control por voz, y también muchas personas que rellenan formularios rápido. Además, 2.4.7 es nivel AA, el que suelen exigir las leyes de accesibilidad.',
      'Solo si el cambio llega a 3:1 frente al estado anterior y no depende únicamente del tono. Un 10 % de tinte o una sombra suave no llegan. Súmale una forma: línea, grosor, marco o icono.',
      'Revisa qué selector usa. Muchas aplican el foco con :focus o con una clase propia, como .Mui-focusVisible. Ajusta sus tokens de tema en lugar de pisarlos con CSS global. En Tailwind, cambia focus: por focus-visible:.',
    ],
  },
  en: {
    questions: [
      '“The ring looks ugly”',
      '“After closing the modal, the button stays highlighted”',
      '“Hardly anyone uses the keyboard”',
      '“Isn’t changing the button color enough?”',
      '“We use a component library”',
    ],
    answers: [
      'The browser’s default ring isn’t made for any brand. One designed with your design system’s colors, radius and offset fits in just like hover. If that still doesn’t convince, the pieces in section 05 offer alternatives without a ring.',
      'Focus has to return to the button; otherwise keyboard users end up at the top of the page. With :focus-visible that return isn’t visible after a click and is visible after Esc. You can check it in lab 5.',
      'The keyboard is used by people with reduced mobility, by screen reader, switch and voice control users, and also by many people who fill in forms quickly. Also, 2.4.7 is level AA, the one accessibility laws usually require.',
      'Only if the change reaches 3:1 against the previous state and doesn’t rely on hue alone. A 10 % tint or a soft shadow won’t get there. Add a shape: a line, thickness, a frame or an icon.',
      'Check which selector it uses. Many apply focus with :focus or with their own class, like .Mui-focusVisible. Adjust their theme tokens instead of overriding them with global CSS. In Tailwind, replace focus: with focus-visible:.',
    ],
  },
} as const;

function renderFaq(locale: 'es' | 'en' = 'es') {
  return render(<FAQ locale={locale} />);
}

function getPanel(container: HTMLElement, question: string) {
  return within(container).getByRole('region', { name: question });
}

describe('FAQ', () => {
  it.each(['es', 'en'] as const)('renders the approved %s questions in order', (locale) => {
    const view = renderFaq(locale);
    const headings = within(view.container).getAllByRole('heading');

    expect(headings.map((heading) => heading.textContent)).toEqual(faqCopy[locale].questions);
    expect(headings).toHaveLength(5);
  });

  it.each(['es', 'en'] as const)(
    'starts all %s questions closed and opens independent panels',
    async (locale) => {
      const user = userEvent.setup();
      const view = renderFaq(locale);
      const triggers = within(view.container).getAllByRole('button');

      expect(triggers).toHaveLength(5);
      for (const trigger of triggers) {
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(trigger.getAttribute('data-open')).toBeNull();
      }
      expect(within(view.container).queryAllByRole('region')).toHaveLength(0);
      const hiddenPanels = within(view.container).queryAllByRole('region', { hidden: true });
      expect(hiddenPanels.every((panel) => panel.getAttribute('data-open') === null)).toBe(true);

      await user.click(triggers[0]!);
      await user.click(triggers[1]!);

      expect(triggers[0]!.getAttribute('aria-expanded')).toBe('true');
      expect(triggers[1]!.getAttribute('aria-expanded')).toBe('true');
      expect(within(view.container).queryAllByRole('region')).toHaveLength(2);

      await user.click(triggers[1]!);

      expect(triggers[0]!.getAttribute('aria-expanded')).toBe('true');
      expect(triggers[1]!.getAttribute('aria-expanded')).toBe('false');
      expect(getPanel(view.container, faqCopy[locale].questions[0])).toBeTruthy();
      expect(
        within(view.container).queryByRole('region', { name: faqCopy[locale].questions[1] })
      ).toBeNull();
    }
  );

  it.each(['es', 'en'] as const)(
    'shows each approved %s answer and its inline markup in its associated panel',
    async (locale) => {
      const user = userEvent.setup();
      const view = renderFaq(locale);
      const triggers = within(view.container).getAllByRole('button');

      for (const trigger of triggers) {
        await user.click(trigger);
      }

      const panels = faqCopy[locale].questions.map((question) =>
        getPanel(view.container, question)
      );
      for (const [index, panel] of panels.entries()) {
        expect(panel.textContent?.replace(/\s+/g, ' ').trim()).toContain(
          faqCopy[locale].answers[index]
        );
      }

      expect(within(panels[1]!).getByText(':focus-visible', { selector: 'code' })).toBeTruthy();
      expect(within(panels[1]!).getByText('Esc', { selector: 'kbd' })).toBeTruthy();

      const criterionLink = within(panels[2]!).getByRole('link', { name: '2.4.7' });
      expect(criterionLink.getAttribute('href')).toBe(
        'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html'
      );

      for (const selector of [':focus', '.Mui-focusVisible', 'focus:', 'focus-visible:']) {
        expect(within(panels[4]!).getByText(selector, { selector: 'code' })).toBeTruthy();
      }
    }
  );

  it.each(['es', 'en'] as const)(
    'puts each %s trigger inside its semantic question heading',
    (locale) => {
      const view = renderFaq(locale);

      for (const question of faqCopy[locale].questions) {
        const heading = within(view.container).getByRole('heading', { name: question });
        expect(within(heading).getByRole('button', { name: question })).toBeTruthy();
      }
    }
  );
});
