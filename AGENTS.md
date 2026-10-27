## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

<!-- BEGIN:purrfold-managed -->

## Quality Gates

Run these before claiming implementation complete:

1. `pnpm run lint`
2. `pnpm run typecheck`
3. `pnpm run format:check`
4. `pnpm run test`

- Run `pnpm run test:e2e` when E2E behavior changed.
- `pnpm run doctor`
- `pnpm run check`

`pnpm run lint` runs `@shadcn/lint`. Fix its design system errors with the tokens, variants, and sizes described in `DESIGN.md`; do not disable its rules.

## References

- Architecture and scripts: `README.md`
- Design rules: `DESIGN.md`
- Astro reference docs: current Astro documentation
- Astro agent rules: generated `AGENTS.md` / `CLAUDE.md`
- If any agent skill is missing, rerun `sh skills.sh`.
- Component placement rules: `.agents/skills/shadcn-component-boundaries/SKILL.md`
- Minimum evaluation: `.agents/skills/project-min-evaluation/SKILL.md`
- Vitest guidance: `.agents/skills/vitest/SKILL.md`
- Playwright guidance: `.agents/skills/playwright-best-practices/SKILL.md`
- Commit messages are checked with commitlint.

## shadcn MCP

shadcn MCP setup was requested during scaffold.

```bash
pnpm dlx shadcn@latest mcp init --client claude
pnpm dlx shadcn@latest mcp init --client codex
pnpm dlx shadcn@latest mcp init --client opencode
```

For Codex, verify `~/.codex/config.toml` if MCP is not available:

```toml
[mcp_servers.shadcn]
command = "pnpm"
args = ["dlx", "shadcn@latest", "mcp"]
```

shadcn presets are supported through `--shadcn-args --preset <id>`.

## Claude Code

`CLAUDE.md` points to this file. `.claude/skills` should link to `.agents/skills`.
<!-- END:purrfold-managed -->
