# Design Standard

This file is the UI/UX source of truth for this app.

## Principles

- Build the actual product surface first; avoid marketing-only landing pages.
- Prefer dense, calm, scannable layouts for operational tools.
- Use semantic tokens from `src/styles/global.css`.
- Keep loading, empty, error, and partial-data states explicit.
- Make controls accessible, keyboard reachable, and clearly labeled.

## Components

- Use shadcn primitives before custom markup.
- Use lucide icons for icon buttons and provide accessible labels.
- Use tables for detailed records, cards for repeated metrics, and charts only when they answer a clear comparison question.
- Do not nest cards inside cards.

## Lint Enforcement

The `lint` script enforces these rules with `@shadcn/lint`, and each error points back to this file:

- `shadcn/no-restyle`: do not restyle a component through `className`. Layout classes such as `mt-4` and `w-full` are allowed; use a variant or size for anything else.
- `shadcn/no-raw-colors`: use semantic tokens instead of raw palette colors such as `bg-pink-500`.
- `shadcn/no-arbitrary-values`: stay on the theme scale instead of arbitrary values such as `p-[13px]`; arbitrary layout values are allowed.
- `shadcn/no-inline-styles`: do not use inline styles or `<style>` elements in components.
- `shadcn/require-static-classes`: keep component classes readable by the linter; do not interpolate them, as in `bg-${color}`.
- `shadcn/no-unknown-classes`: only use classes Tailwind can generate.

Fix a violation with a token, variant, or size from the design system, and add one to the component only when the design calls for it. Do not disable the rules.

## Motion

- Use subtle transitions only when they clarify state.
- Respect reduced-motion preferences for non-trivial animation.
