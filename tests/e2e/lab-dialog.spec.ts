import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const locales = [
  {
    path: '/',
    title: 'Laboratorio 5',
    task: 'Abre el diálogo y ciérralo con el ratón. Repite con',
    triggers: ['Eliminar proyecto (:focus)', 'Eliminar proyecto (:focus-visible)'],
    initial: 'Aún no has abierto el diálogo.',
    opened: 'Diálogo abierto. El foco está en «Cancelar».',
    closedWith: 'Cerrado con',
    mouse: 'el ratón',
    keyboard: 'el teclado',
    focusReturned: 'El foco volvió al botón',
    andRing: 'y el anillo',
    visible: 'se ve',
    hidden: 'no se ve',
    dialogTitle: '¿Eliminar el proyecto «Rediseño web»?',
    cancel: 'Cancelar',
    confirm: 'Eliminar',
  },
  {
    path: '/en/',
    title: 'Lab 5',
    task: 'Open the dialog and close it with the mouse. Repeat with',
    triggers: ['Delete project (:focus)', 'Delete project (:focus-visible)'],
    initial: 'You haven’t opened the dialog yet.',
    opened: 'Dialog open. Focus is on “Cancel”.',
    closedWith: 'Closed with',
    mouse: 'the mouse',
    keyboard: 'the keyboard',
    focusReturned: 'Focus returned to the button',
    andRing: 'and the ring',
    visible: 'is visible',
    hidden: 'is hidden',
    dialogTitle: 'Delete the “Website redesign” project?',
    cancel: 'Cancel',
    confirm: 'Delete',
  },
] as const;

type Theme = 'light' | 'dark';

async function loadLab(page: Page, path: string, theme: Theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
  await page.goto(path);
  await expect
    .poll(() => page.locator('html').evaluate((element) => element.classList.contains('dark')))
    .toBe(theme === 'dark');

  const section = page.locator('#movimiento');
  const lab = section.locator('#lab-modal');
  await lab.scrollIntoViewIfNeeded();
  const copy = locales.find((locale) => locale.path === path)!;
  await expect(lab).toBeVisible();
  await expect(lab.locator('.lab-title')).toHaveText(copy.title);
  const task = lab.locator('.lab-task');
  await expect(task).toContainText(copy.task);
  await expect(task.locator('kbd')).toHaveText(['Enter', 'Esc']);
  const buttons = copy.triggers.map((name) => lab.getByRole('button', { name, exact: true }));
  for (const button of buttons) await expect(button).toHaveCount(1);
  const island = buttons[0]!.locator('xpath=ancestor::astro-island[1]');
  await expect(island).toHaveCount(1);
  await expect(island).not.toHaveAttribute('ssr');
  const status = lab.locator('[aria-live="polite"]');
  await expect(status).toHaveText(copy.initial);
  return { lab, buttons, status, copy };
}

async function tabToButton(page: Page, button: Locator) {
  const maxTabs = await page
    .locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]'
    )
    .count();

  for (let index = 0; index <= maxTabs; index += 1) {
    await page.keyboard.press('Tab');
    if (await button.evaluate((element) => document.activeElement === element)) {
      await expect(button).toBeFocused();
      await expect
        .poll(() => button.evaluate((element) => element.matches(':focus-visible')))
        .toBe(true);
      return;
    }
  }

  throw new Error('Tab did not reach the Lab 5 trigger.');
}

async function expectOutlineColorMatches(button: Locator, token: 'ring' | 'destructive-text') {
  await expect
    .poll(() =>
      button.evaluate((element, variable) => {
        const probe = document.createElement('span');
        probe.style.outlineColor = `var(--${variable})`;
        document.body.append(probe);
        const expected = getComputedStyle(probe).outlineColor;
        const actual = getComputedStyle(element).outlineColor;
        probe.remove();
        return expected !== '' && actual === expected;
      }, token)
    )
    .toBe(true);
}

async function expectNoVisibleShadow(locator: Locator) {
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        const boxShadow = getComputedStyle(element).boxShadow;
        if (boxShadow === 'none') return true;

        const layers: string[] = [];
        let depth = 0;
        let start = 0;
        for (let index = 0; index < boxShadow.length; index += 1) {
          if (boxShadow[index] === '(') depth += 1;
          if (boxShadow[index] === ')') depth -= 1;
          if (boxShadow[index] === ',' && depth === 0) {
            layers.push(boxShadow.slice(start, index).trim());
            start = index + 1;
          }
        }
        layers.push(boxShadow.slice(start).trim());

        return layers.every((layer) => layer === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px');
      })
    )
    .toBe(true);
}

async function closeDialogWithCancel(trigger: Locator, dialog: Locator, cancelName: string) {
  await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: cancelName, exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
}

function closedStatus(
  copy: (typeof locales)[number],
  method: 'mouse' | 'keyboard',
  trigger: 0 | 1,
  visible: boolean
) {
  return `${copy.closedWith} ${copy[method]}. ${copy.focusReturned} ${copy.triggers[trigger]} ${copy.andRing} ${visible ? copy.visible : copy.hidden}.`;
}

for (const locale of locales) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${locale.path} Lab 5 has the localized structure and hydrated island in ${theme}`, async ({
      page,
    }) => {
      const { lab } = await loadLab(page, locale.path, theme);
      await expect(lab.locator('.lab-body [data-slot="code-block"]')).toHaveCount(1);
    });

    test(`${locale.path} Lab 5 characterizes trigger focus styles in ${theme}`, async ({
      page,
    }) => {
      const { buttons, copy } = await loadLab(page, locale.path, theme);
      const tokens = ['destructive-text', 'ring'] as const;

      await tabToButton(page, buttons[0]!);
      await expect(buttons[0]!).toHaveCSS('outline-style', 'solid');
      await expect(buttons[0]!).toHaveCSS('outline-width', '3px');
      await expect(buttons[0]!).toHaveCSS('outline-offset', '3px');
      await expectNoVisibleShadow(buttons[0]!);
      await expectOutlineColorMatches(buttons[0]!, tokens[0]);

      await page.keyboard.press('Tab');
      await expect(buttons[1]!).toBeFocused();
      await expect(buttons[1]!).toHaveCSS('outline-style', 'solid');
      await expect(buttons[1]!).toHaveCSS('outline-width', '3px');
      await expect(buttons[1]!).toHaveCSS('outline-offset', '3px');
      await expectNoVisibleShadow(buttons[1]!);
      await expectOutlineColorMatches(buttons[1]!, tokens[1]);

      const dialog = page.getByRole('alertdialog', { name: copy.dialogTitle, exact: true });

      await closeDialogWithCancel(buttons[0]!, dialog, copy.cancel);
      await expect(buttons[0]!).toHaveCSS('outline-style', 'solid');
      await expect(buttons[0]!).toHaveCSS('outline-width', '3px');
      await expect(buttons[0]!).toHaveCSS('outline-offset', '3px');
      await expectNoVisibleShadow(buttons[0]!);
      await expectOutlineColorMatches(buttons[0]!, tokens[0]);

      await closeDialogWithCancel(buttons[1]!, dialog, copy.cancel);
      await expect(buttons[1]!).toHaveCSS('outline-style', 'none');
      await expectNoVisibleShadow(buttons[1]!);
    });

    test(`${locale.path} Lab 5 keyboard dialog traps focus, restores it and passes axe in ${theme}`, async ({
      page,
    }) => {
      const { buttons, status, copy } = await loadLab(page, locale.path, theme);
      await tabToButton(page, buttons[1]!);
      await page.keyboard.press('Enter');

      const dialog = page.getByRole('alertdialog', { name: copy.dialogTitle, exact: true });
      await expect(dialog).toBeVisible();
      const cancel = dialog.getByRole('button', { name: copy.cancel, exact: true });
      const confirm = dialog.getByRole('button', { name: copy.confirm, exact: true });
      await expect(cancel).toBeFocused();
      await expect(status).toHaveText(copy.opened);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);

      await page.keyboard.press('Tab');
      await expect(confirm).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(cancel).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(confirm).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(cancel).toBeFocused();
      await page.keyboard.press('Escape');

      await expect(dialog).toBeHidden();
      await expect(buttons[1]!).toBeFocused();
      await expect(buttons[1]!).toHaveCSS('outline-style', 'solid');
      await expect(buttons[1]!).toHaveCSS('outline-width', '3px');
      await expect(status).toHaveText(closedStatus(copy, 'keyboard', 1, true));
    });

    test(`${locale.path} Lab 5 keyboard confirmation closes and restores focus in ${theme}`, async ({
      page,
    }) => {
      const { buttons, status, copy } = await loadLab(page, locale.path, theme);
      await tabToButton(page, buttons[1]!);
      await page.keyboard.press('Enter');

      const dialog = page.getByRole('alertdialog', { name: copy.dialogTitle, exact: true });
      const cancel = dialog.getByRole('button', { name: copy.cancel, exact: true });
      const confirm = dialog.getByRole('button', { name: copy.confirm, exact: true });
      await expect(cancel).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(confirm).toBeFocused();
      await page.keyboard.press('Enter');

      await expect(dialog).toBeHidden();
      await expect(buttons[1]!).toBeFocused();
      await expect(buttons[1]!).toHaveCSS('outline-style', 'solid');
      await expect(buttons[1]!).toHaveCSS('outline-width', '3px');
      await expect(status).toHaveText(closedStatus(copy, 'keyboard', 1, true));
    });

    for (const triggerIndex of [0, 1] as const) {
      test(`${locale.path} Lab 5 pointer close restores trigger ${triggerIndex + 1} in ${theme}`, async ({
        page,
      }) => {
        const { buttons, status, copy } = await loadLab(page, locale.path, theme);
        const trigger = buttons[triggerIndex]!;
        await trigger.click();

        const dialog = page.getByRole('alertdialog', { name: copy.dialogTitle, exact: true });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('button', { name: copy.cancel, exact: true })).toBeFocused();
        await expect(status).toHaveText(copy.opened);
        await dialog.getByRole('button', { name: copy.cancel, exact: true }).click();

        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveCSS('outline-style', triggerIndex === 0 ? 'solid' : 'none');
        await expect(status).toHaveText(
          closedStatus(copy, 'mouse', triggerIndex, triggerIndex === 0)
        );
      });

      test(`${locale.path} Lab 5 pointer confirmation restores trigger ${triggerIndex + 1} in ${theme}`, async ({
        page,
      }) => {
        const { buttons, status, copy } = await loadLab(page, locale.path, theme);
        const trigger = buttons[triggerIndex]!;
        await trigger.click();

        const dialog = page.getByRole('alertdialog', { name: copy.dialogTitle, exact: true });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: copy.confirm, exact: true }).click();

        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveCSS('outline-style', triggerIndex === 0 ? 'solid' : 'none');
        await expect(status).toHaveText(
          closedStatus(copy, 'mouse', triggerIndex, triggerIndex === 0)
        );
      });
    }

    test(`${locale.path} Lab 5 code example contains CSS and translated Tailwind in ${theme}`, async ({
      page,
    }) => {
      const { lab } = await loadLab(page, locale.path, theme);
      const code = (language: 'CSS' | 'Tailwind') =>
        lab.getByRole('tabpanel', { name: language }).getByTestId('code-example-content');

      await lab.getByRole('tab', { name: 'CSS', exact: true }).click();
      await expect(code('CSS')).toContainText('<dialog');
      await expect(code('CSS')).toContainText('showModal()');
      await lab.getByRole('tab', { name: 'Tailwind', exact: true }).click();
      await expect(code('Tailwind')).toContainText('<AlertDialog>');
      await expect(code('Tailwind')).toContainText(
        locale.path === '/en/' ? 'Delete project' : 'Eliminar proyecto'
      );
    });
  }
}
