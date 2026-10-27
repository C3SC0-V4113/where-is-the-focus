#!/usr/bin/env bash
set -euo pipefail

npx --yes skills@latest add wshobson/agents --skill architecture-decision-records --skill typescript-advanced-types --agent codex --copy --yes
npx --yes skills@latest add shadcn/ui --skill shadcn --agent codex --copy --yes
npx --yes skills@latest add obra/superpowers --skill systematic-debugging --skill verification-before-completion --agent codex --copy --yes
npx --yes skills@latest add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns --skill vercel-react-best-practices --agent codex --copy --yes
npx --yes skills@latest add https://github.com/astrolicious/agent-skills --skill astro --agent codex --copy --yes
npx --yes skills@latest add C3SC0-V4113/Scaffold --skill project-architecture --skill shadcn-component-boundaries --skill project-min-evaluation --skill decision-doc-sync --agent codex --copy --yes
npx --yes skills@latest add millionco/react-doctor --skill react-doctor --agent codex --copy --yes
npx --yes skills@latest add pproenca/dot-skills --skill vitest --agent codex --copy --yes
npx --yes skills@latest add currents-dev/playwright-best-practices-skill --skill playwright-best-practices --agent codex --copy --yes
npx --yes skills@latest add microsoft/playwright-cli --skill playwright-cli --agent codex --copy --yes
