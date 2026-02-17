# Aioli

[![CI](https://github.com/jaredhd/aioli/actions/workflows/ci.yml/badge.svg)](https://github.com/jaredhd/aioli/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/aioli-design.svg)](https://www.npmjs.com/package/aioli-design)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The free, open-source design system engine that gives every developer the same AI-powered design tools that premium platforms charge $20-50/month for.**

---

## 30-Second Quick Start

### Option A: Plug into Your AI Assistant (MCP)

```bash
npm install aioli-design
```

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "aioli": {
      "command": "node",
      "args": ["/path/to/node_modules/aioli-design/mcp-server/index.js"]
    }
  }
}
```

Then ask: *"Use Aioli to generate a glassmorphic pricing page with 3 tiers"*

### Option B: Use the SDK

```js
import { createAioli } from 'aioli-design/sdk';

const aioli = await createAioli({ mode: 'direct', tokensPath: './tokens' });

// Generate a React component from natural language
const card = await aioli.generateComponent('glassmorphic card with title', { format: 'react' });
console.log(card.code); // Ready-to-use React JSX
```

### Option C: Use the CLI

```bash
npx aioli-design generate "primary button with icon"
```

---

## What You Get

| Capability | Details |
|---|---|
| **43 Components** | Atoms, Molecules, Organisms, Templates, Pages -- all from natural language |
| **4 Output Formats** | HTML, React (JSX), Vue (SFC), Svelte -- one prompt, any framework |
| **1,543 Design Tokens** | W3C DTCG format, 3-tier hierarchy (primitives, semantic, component) |
| **6 Theme Presets** | Default, Glass, Neumorphic, Brutalist, Gradient, Dark Luxury |
| **120/120 WCAG AA** | Every contrast pair passes across every theme |
| **12 MCP Tools** | Plug into Claude, Cursor, Copilot, or any AI assistant |
| **13 REST Endpoints** | Full HTTP API, self-hostable, no API keys |
| **12 SDK Methods** | JavaScript SDK with HTTP or direct (no-server) mode |
| **Community Registry** | Install, publish, and share custom component packages |
| **Brand Palette** | One hex color -> full accessible palette with WCAG verification |
| **435 Tests** | Comprehensive test coverage, zero validation errors |

---

## Why Aioli Exists

The best AI app builders -- v0, Bolt, Lovable -- generate beautiful UIs. But they charge a premium, lock you into their ecosystem, and treat accessibility as an afterthought.

Aioli is the open-source answer: the same design intelligence, completely free. WCAG accessibility enforced from the first line. Real design system principles, not just pretty screenshots. No API keys. No subscription. No vendor lock-in.

---

## Framework Output

Generate components in your framework of choice:

```bash
# CLI
aioli generate "glassmorphic card" --format react

# SDK
const result = await aioli.generateComponent('pricing table', { format: 'vue' });

# REST API
curl -X POST localhost:3456/api/v1/generate/component \
  -H "Content-Type: application/json" \
  -d '{"description": "button with icon", "format": "svelte"}'
```

Supported formats: `html` (default), `react`, `vue`, `svelte`

---

## MCP Server -- 12 Tools for AI Assistants

Aioli exposes its full design intelligence via [Model Context Protocol](https://modelcontextprotocol.io/), so any compatible AI assistant can generate accessible, themed, production-quality UI.

| Tool | Description |
|---|---|
| `generate_component` | Natural language -> accessible component (HTML/React/Vue/Svelte) |
| `generate_page` | Full multi-section page from a description |
| `list_components` | Discover all 43+ available component templates |
| `list_style_modifiers` | 8 visual modifiers + 4 page composition types |
| `list_themes` | 6 theme presets with descriptions |
| `get_theme_css` | CSS custom properties for any theme preset |
| `derive_palette` | Brand color -> full accessible palette (WCAG verified) |
| `get_tokens` | Query tokens by path, prefix, or export format |
| `resolve_token` | Trace a token reference to its final value |
| `check_contrast` | WCAG contrast ratio between any two colors |
| `validate_accessibility` | Full accessibility audit on HTML |
| `review_code` | Code quality score, grade, and detailed feedback |

Run with: `npm run mcp` or `node mcp-server/index.js`

---

## REST API

Self-hostable HTTP API -- no API keys, no auth wall. Start with `npm run api`.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/generate/component` | NL -> component (with `format` option) |
| POST | `/api/v1/generate/page` | NL -> full page layout |
| GET | `/api/v1/components` | List all available templates |
| GET | `/api/v1/modifiers` | Style modifiers + page compositions |
| GET | `/api/v1/themes` | List 6 theme presets |
| GET | `/api/v1/themes/:name/css` | CSS custom properties for a theme |
| POST | `/api/v1/palette` | Derive palette from brand color |
| GET | `/api/v1/tokens` | Query design tokens |
| POST | `/api/v1/tokens/resolve` | Resolve token reference |
| POST | `/api/v1/validate/contrast` | WCAG contrast check |
| POST | `/api/v1/validate/accessibility` | Full a11y audit |
| POST | `/api/v1/validate/code` | Code quality review |

Default: `http://localhost:3456`

---

## JavaScript SDK

```js
import { createAioli } from 'aioli-design/sdk';

// HTTP mode (connects to REST API)
const aioli = await createAioli({ baseUrl: 'http://localhost:3456' });

// Direct mode (no server needed)
const aioli = await createAioli({ mode: 'direct', tokensPath: './tokens' });

// Generate
const button = await aioli.generateComponent('large primary button', { format: 'react' });
const page = await aioli.generatePage('marketing landing page', { format: 'vue' });

// Query
const components = await aioli.listComponents();
const themes = await aioli.listThemes();
const tokens = await aioli.getTokens({ prefix: 'semantic.color' });

// Validate
const contrast = await aioli.checkContrast('#000000', '#ffffff');
const review = await aioli.reviewCode('<button class="btn">Click</button>');
```

---

## Community Registry

Create, share, and install custom component packages:

```bash
# Scaffold a new component package
aioli registry init my-widget

# Publish/install from a local path
aioli registry publish ./my-widget/
aioli registry install ./path/to/package

# Manage installed packages
aioli registry list
aioli registry search "timeline"
aioli registry info my-widget
aioli registry remove my-widget
```

Community components work with NL generation, all framework adapters, and all entry points (API, SDK, MCP, CLI).

---

## Architecture

```
Tokens (W3C DTCG)     Agents (6)           Interfaces          Output
+----------------+    +-----------------+  +--------------+    +----------+
| primitives/    |--->| design-token    |->| MCP (12)     |--->| HTML     |
| semantic/      |    | accessibility   |  | REST API (13)|    | React    |
| components/    |    | motion          |  | JS SDK (12)  |    | Vue      |
+----------------+    | component (43)  |  | CLI (7)      |    | Svelte   |
                      | code-review     |  +--------------+    | CSS vars |
                      | orchestrator    |                      | JSON     |
                      +-----------------+                      +----------+
```

**Token Hierarchy** -- 3 tiers, never skip:
1. **Primitives** -- Raw values: `color.blue.600` = `#2563eb`
2. **Semantic** -- Intent: `semantic.color.primary.default` -> `{color.blue.600}`
3. **Component** -- Scoped: `component.button.primary.bg` -> `{semantic.color.primary.default}`

**Agent System** -- 6 specialized agents:
- **Design Token** -- CRUD, resolution, validation across 1,543 tokens
- **Accessibility Validator** -- WCAG AA/AAA contrast, semantic HTML, ARIA, theme validation
- **Motion** -- Duration/easing presets, GPU-safe property enforcement, `prefers-reduced-motion`
- **Component Generator** -- 43 templates, 8 style modifiers, 4 page compositions, NL parsing
- **Code Review** -- Quality scoring across 6 categories
- **Orchestrator** -- Multi-agent coordination, validation-fix cycles

---

## Theme Presets

Six built-in themes, all WCAG AA verified (120/120 contrast pairs pass):

| Theme | Style |
|---|---|
| **default** | Clean, professional -- the foundation |
| **glass** | Glassmorphism with frosted surfaces and backdrop blur |
| **neumorphic** | Soft shadows, inset/outset depth |
| **brutalist** | Thick borders, raw typography, bold contrast |
| **gradient** | Vibrant gradient surfaces and buttons |
| **darkLuxury** | Dark backgrounds with warm gold accents |

Generate a custom palette from any brand color:

```js
import { derivePalette } from 'aioli-design/theme';

// One color -> full accessible palette
const palette = derivePalette('#8b5cf6');
// Returns: primary, hover, active, subtle, muted, dark mode, gradients, shadows
// All WCAG AA verified automatically
```

---

## CLI Commands

| Command | Description |
|---|---|
| `aioli init` | Initialize a project (`--template minimal\|starter\|full`) |
| `aioli build` | Build tokens -> CSS + JSON via Style Dictionary |
| `aioli validate` | Validate DTCG token structure |
| `aioli generate <desc>` | Generate component from natural language |
| `aioli audit` | Run accessibility audit on tokens |
| `aioli export` | Export tokens as CSS, JSON, or SCSS |
| `aioli registry <cmd>` | Community packages (publish, install, remove, list, search, info, init) |

---

## Standards We Enforce

Every piece of output follows these rules -- no exceptions:

- **WCAG 2.1 AA minimum** -- 4.5:1 contrast for text, 3:1 for UI, verified at generation time
- **Semantic HTML** -- proper heading hierarchy, landmark regions, form labels
- **ARIA when needed** -- roles, states, live regions, but never as a substitute for semantic elements
- **Keyboard navigation** -- all interactive elements focusable and operable
- **`prefers-reduced-motion`** -- every animation has a reduced-motion fallback
- **GPU-safe animations** -- only `transform` and `opacity`, never `width`/`height`/`margin`
- **Token discipline** -- components use semantic tokens, never raw primitives

---

## Roadmap

- [x] **Design System Engine** -- 1,543 tokens, 43 components, 6 agents
- [x] **Visual Enhancements** -- Glassmorphism, gradients, neumorphism, animations, themes
- [x] **MCP Server** -- 12 tools for AI assistant integration
- [x] **REST API + JS SDK** -- 13 HTTP endpoints, 12 SDK methods
- [x] **Framework Adapters** -- React, Vue, Svelte output (HTML-first pipeline)
- [x] **Community Registry** -- Custom component packages with CLI management
- [ ] **TypeScript Adapter** -- `.tsx` output with full type annotations
- [ ] **Figma Plugin** -- Bi-directional sync with Figma
- [ ] **VS Code Extension** -- In-editor component generation
- [ ] **Remote Registry** -- npm-like package publishing and discovery

---

## Contributing

Contributions are welcome! Whether it's new component templates, theme presets, accessibility improvements, or framework adapters -- we'd love your help making design accessible to everyone.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and workflow.

## Requirements

- Node.js >= 18.0.0

## License

MIT -- free forever. That's the point.
