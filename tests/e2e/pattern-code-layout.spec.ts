import { expect, test, type Locator } from '@playwright/test';

const triggerName = 'Ver código';

async function readyTrigger(card: Locator) {
  await card.scrollIntoViewIfNeeded();
  const island = card.locator('astro-island:not([ssr])');
  await expect(island).toHaveCount(1);
  const trigger = card.getByRole('button', { name: triggerName });
  await expect(trigger).toBeVisible();
  return trigger;
}

async function triggerTop(trigger: Locator) {
  return trigger.evaluate((element) => element.getBoundingClientRect().top);
}

async function chipsToTriggerGap(trigger: Locator) {
  return trigger.evaluate((element) => {
    const chips = element.closest('.pat')?.querySelector('.chips');
    if (!chips) throw new Error('Pattern card is missing its chips');
    return element.getBoundingClientRect().top - chips.getBoundingClientRect().bottom;
  });
}

for (const width of [1280, 760]) {
  test(`aligns two-column pattern controls at ${width}px when disclosures open independently`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto('/');
    const cards = page.locator('.gallery article.pat');
    await expect(cards).toHaveCount(6);
    const first = await readyTrigger(cards.nth(0));
    const second = await readyTrigger(cards.nth(1));

    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThanOrEqual(1);

    const closedGap = await chipsToTriggerGap(second);
    expect(Math.abs((await triggerTop(first)) - (await triggerTop(second)))).toBeLessThanOrEqual(1);

    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(cards.nth(0).getByRole('tabpanel', { name: 'CSS' })).toBeVisible();
    await expect(second).toHaveAttribute('aria-expanded', 'false');
    expect(Math.abs((await triggerTop(first)) - (await triggerTop(second)))).toBeLessThanOrEqual(1);
    expect(await chipsToTriggerGap(second)).toBeLessThanOrEqual(closedGap + 1);

    await second.click();
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await expect(cards.nth(1).getByRole('tabpanel', { name: 'CSS' })).toBeVisible();
    await expect(cards.nth(0).getByRole('tabpanel', { name: 'CSS' })).toBeVisible();
    expect(Math.abs((await triggerTop(first)) - (await triggerTop(second)))).toBeLessThanOrEqual(1);

    await second.click();
    await expect(second).toHaveAttribute('aria-expanded', 'false');
    await expect(first).toHaveAttribute('aria-expanded', 'true');
  });
}

test('keeps the control close to its chips in the one-column mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const card = page.locator('.gallery article.pat').first();
  const trigger = await readyTrigger(card);
  const boxes = await Promise.all([
    card.boundingBox(),
    page.locator('.gallery article.pat').nth(1).boundingBox(),
  ]);
  expect(boxes[0]).not.toBeNull();
  expect(boxes[1]).not.toBeNull();
  expect(boxes[1]!.y).toBeGreaterThan(boxes[0]!.y);
  const gap = await chipsToTriggerGap(trigger);
  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThanOrEqual(24);
});

test('provides a separate 40px or 44px pseudo-element target without covering nearby controls', async ({
  page,
}) => {
  await page.goto('/');
  const card = page.locator('.gallery article.pat').first();
  const trigger = await readyTrigger(card);
  await trigger.click();
  const panel = card.getByRole('tabpanel', { name: 'CSS' });
  await expect(panel).toBeVisible();
  await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));

  const target = await trigger.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const before = getComputedStyle(element, '::before');
    const inset = (value: string) => (value === 'auto' ? 0 : Number.parseFloat(value));
    const top = rect.top + inset(before.top);
    const right = rect.right - inset(before.right);
    const bottom = rect.bottom - inset(before.bottom);
    const left = rect.left + inset(before.left);
    const area = { top, right, bottom, left, width: right - left, height: bottom - top };
    const points = [
      [left + 1, top + 1],
      [right - 1, top + 1],
      [left + 1, bottom - 1],
      [right - 1, bottom - 1],
    ];
    const viewportPoints = points.map(
      ([x, y]) => x! >= 0 && y! >= 0 && x! < innerWidth && y! < innerHeight
    );
    const hitTests = points.map(([x, y]) => {
      const hit = document.elementFromPoint(x!, y!);
      return Boolean(hit && (hit === element || element.contains(hit)));
    });
    const rectFor = (node: Element) => {
      const box = node.getBoundingClientRect();
      return { top: box.top, right: box.right, bottom: box.bottom, left: box.left };
    };
    const intersects = (other: ReturnType<typeof rectFor>) =>
      left < other.right && right > other.left && top < other.bottom && bottom > other.top;
    const pattern = element.closest('.pat');
    const chips = pattern?.querySelectorAll('.chips a') ?? [];
    const tabs = pattern?.querySelectorAll('[role="tab"]') ?? [];
    const copyButtons = Array.from(
      pattern?.querySelectorAll('[data-slot="code-block-actions"] button') ?? []
    ).filter((button) => ['Copiar', 'Copy'].includes(button.textContent?.trim() ?? ''));
    const excluded = [...Array.from(chips), ...Array.from(tabs), ...copyButtons];

    return {
      visible: { width: rect.width, height: rect.height },
      pseudoContent: before.content,
      area,
      viewportPoints,
      hitTests,
      panelControls: { tabs: tabs.length, copyButtons: copyButtons.length },
      overlaps: excluded.map((node) => intersects(rectFor(node))),
      coarse: matchMedia('(pointer: coarse)').matches,
    };
  });

  expect(target.visible.width).toBeGreaterThan(0);
  expect(target.visible.height).toBeGreaterThan(0);
  expect(target.pseudoContent).not.toBe('none');
  expect(target.area.width).toBeGreaterThanOrEqual(target.coarse ? 44 : 40);
  expect(target.area.height).toBeGreaterThanOrEqual(target.coarse ? 44 : 40);
  expect(target.viewportPoints).toEqual([true, true, true, true]);
  expect(target.hitTests).toEqual([true, true, true, true]);
  expect(target.panelControls.tabs).toBeGreaterThan(0);
  expect(target.panelControls.copyButtons).toBeGreaterThan(0);
  expect(target.overlaps.every((overlap) => !overlap)).toBe(true);
});

test('reaches the trigger by Tab, shows its focus ring, and toggles with Enter', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
  await page.goto('/');
  const card = page.locator('.gallery article.pat').first();
  const trigger = await readyTrigger(card);
  await card.getByRole('textbox').focus();
  for (const chip of await card.locator('.chips a').all()) {
    await page.keyboard.press('Tab');
    await expect(chip).toBeFocused();
  }
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
  await expect
    .poll(() => trigger.evaluate((element) => element.matches(':focus-visible')))
    .toBe(true);
  await expect
    .poll(() =>
      trigger.evaluate((element) => {
        const style = getComputedStyle(element);
        return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
      })
    )
    .toBe(true);

  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(card.getByRole('tabpanel', { name: 'CSS' })).toBeVisible();
  await expect(trigger).toBeFocused();
});
