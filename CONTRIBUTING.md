# Contributing to Aioli

Thanks for your interest in contributing to Aioli! This guide will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/jaredhd/aioli.git
cd aioli

# Install dependencies
npm install

# Build design tokens
npm run build

# Start the dev server
npm run dev
```

## Project Structure

```
aioli/
├── agents/            # 6 AI agents (token, a11y, motion, component-gen, code-review, orchestrator)
├── bin/               # CLI entry point
├── cli/               # CLI command implementations
├── css/               # Component CSS (BEM, tokens only)
│   ├── base.css       # CSS reset + dark mode
│   ├── aioli.css      # Single-import entry point
│   └── components/    # 43 individual component stylesheets
├── adapters/          # Framework adapters (React, Vue, Svelte)
├── api-server/        # REST API server (Express 5, 13 endpoints)
├── sdk/               # JavaScript SDK (HTTP + direct modes)
├── registry/          # Community component registry
├── mcp-server/        # MCP server (12 tools for AI assistants)
├── dist/              # Built token output (CSS, JSON, SCSS)
├── docs/              # Documentation markdown
├── lib/               # Public API (index.js, kit.js, theme.js)
├── scripts/           # Dev scripts (contrast audit, validation)
├── src/               # Vite app (landing page, demo gallery, docs)
├── tokens/            # W3C DTCG token source files
│   ├── primitives/    # Raw values (colors, spacing, typography)
│   ├── semantic/      # Intent-based tokens
│   └── components/    # Component-scoped tokens
├── test/              # Test suite (vitest)
└── types/             # TypeScript definitions
```

## Coding Standards

### Design Tokens

- Follow [W3C DTCG](https://design-tokens.github.io/community-group/format/) format
- Use `$value`, `$type`, and `$description` fields
- Reference existing tokens where possible: `"{color.blue.500}"`
- Three-tier hierarchy: primitives -> semantic -> component

### CSS

- All values via CSS custom properties (zero hardcoded colors, sizes, spacing)
- BEM naming convention: `.block__element--modifier`
- Component files are individually importable
- Include all states: `:hover`, `:focus-visible`, `:active`, `:disabled`

### Components

- Follow Atomic Design methodology (atoms, molecules, organisms)
- Use semantic tokens, never primitives directly
- Support `prefers-reduced-motion`
- Ensure WCAG 2.1 AA contrast ratios
- Include proper ARIA attributes and keyboard navigation

### Accessibility

- WCAG 2.1 AA minimum (AAA where feasible)
- Semantic HTML first, ARIA only when necessary
- All interactive elements must be keyboard accessible
- Test with `npm run validate` and the a11y agent

## Workflow

1. Fork the repo and create a feature branch from `main`
2. Make your changes
3. Run the quality checks:

```bash
npm run build       # Build tokens
npm run validate    # Validate token structure
npm test            # Run test suite
```

4. Commit with a descriptive message
5. Open a pull request against `main`

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add tooltip component tokens`
- `fix: correct danger color contrast ratio`
- `docs: update CLI reference for export command`
- `refactor: simplify token resolution in design-token agent`
- `test: add coverage for motion agent presets`

## Adding New Components

1. Create token file in `tokens/components/<name>.json`
2. Create CSS file in `css/components/<name>.css`
3. Add template to `agents/component-generator-agent.js`
4. Add to `css/components/index.css` imports
5. Add tests in `test/`
6. Run `npm run build && npm test`
7. Framework adapters automatically support the new component (HTML-first pipeline)

## Adding New Tokens

1. Determine the tier (primitive, semantic, or component)
2. Add to the appropriate file in `tokens/`
3. Use DTCG format with `$value`, `$type`, `$description`
4. Run `npm run build` to regenerate outputs
5. Verify accessibility implications with `npm run validate`

## Questions?

Open an issue or start a discussion on GitHub. We're happy to help!
