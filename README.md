# 🧄 Aioli

[![CI](https://github.com/jaredhd/aioli/actions/workflows/ci.yml/badge.svg)](https://github.com/jaredhd/aioli/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/aioli-design.svg)](https://www.npmjs.com/package/aioli-design)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The free, open-source design system engine that gives every developer the same AI-powered design tools that premium platforms charge $20-50/month for.**

---

## Why Aioli Exists

The best AI app builders — v0, Bolt, Lovable — generate beautiful UIs. But they charge a premium, lock you into their ecosystem, and treat accessibility as an afterthought. Their output looks great as a one-off, but doesn't compose into a real design system.

**We think that's wrong.**

Great design shouldn't be paywalled. Accessibility shouldn't be optional. And AI-generated UI should follow real design system principles — not just look pretty in a screenshot.

Aioli is the open-source answer. A complete design system engine — 1,543 tokens, 43 components, 6 theme presets, 6 specialized AI agents — that enforces WCAG accessibility, semantic HTML, and proper token architecture from the very first line of output. No API keys. No subscription. No vendor lock-in.

**This is accessible AI for all.**

---

## What You Get

| Capability | What It Does |
|---|---|
| **43 Components** | Atoms → Molecules → Organisms → Templates → Pages, all from natural language |
| **1,543 Design Tokens** | 3-tier hierarchy (primitives → semantic → component) in W3C DTCG format |
| **6 Theme Presets** | Default, Glass, Neumorphic, Brutalist, Gradient, Dark Luxury — all WCAG AA verified |
| **8 Style Modifiers** | Glass, gradient, neumorphic, brutalist, elevated, dark-luxury, colored-shadow, animated |
| **Full Page Generation** | "Marketing landing page" → complete multi-section HTML with hero, features, pricing, CTA |
| **WCAG AA Accessibility** | 120/120 contrast pairs pass across all themes. Semantic HTML. ARIA. Keyboard nav. |
| **6 AI Agents** | Token management, accessibility validation, motion standards, component generation, code review, orchestration |
| **MCP Server** | Plug into Claude, Cursor, Copilot, or any AI coding tool via Model Context Protocol |
| **Brand Palette Derivation** | One hex color → full accessible palette with hover, active, subtle, muted, dark mode, gradients |

---

## Quick Start

### Use with Any AI Assistant (MCP)

The fastest way to use Aioli — connect it to your AI coding tool and start generating:

```bash
npm install aioli-design
```

**Claude Desktop** — add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

Then ask Claude: *"Use Aioli to generate a glassmorphic pricing page with 3 tiers"* — and it will call the right tools automatically.

### Use the CLI

```bash
# Install globally
npm install -g aioli-design

# Initialize a new project
aioli init --template starter

# Generate a component from natural language
aioli generate "primary button with icon"

# Generate with style modifiers
aioli generate "neumorphic card with title and image"

# Build tokens to CSS/JSON
aioli build

# Run accessibility audit
aioli audit
```

### Use Programmatically

```js
import { createAgentSystem } from 'aioli-design';

const agents = createAgentSystem('./tokens');

// Generate a component from natural language
const result = agents.component.handleRequest({
  action: 'generateFromDescription',
  description: 'glassmorphic card with title and image',
});
console.log(result.data.html);

// Generate a full page
const page = agents.component.handleRequest({
  action: 'generatePageComposition',
  description: 'marketing landing page',
});
console.log(page.data.html);

// Check WCAG contrast
const contrast = agents.a11y.handleRequest({
  action: 'checkContrast',
  foreground: '#ffffff',
  background: '#2563eb',
});
console.log(contrast.data); // { ratio: 5.17, passesAA: true, ... }

// Review code quality
const review = agents.codeReview.handleRequest({
  action: 'review',
  code: { html: '<button class="btn">Click</button>', css: '' },
});
console.log(review.data); // { score: 85, grade: 'B+', issues: [...] }
```

---

## MCP Server — 12 Tools for AI Assistants

Aioli exposes its full design intelligence via [Model Context Protocol](https://modelcontextprotocol.io/), so any compatible AI assistant can generate accessible, themed, production-quality UI.

| Tool | Description |
|---|---|
| `generate_component` | Natural language → accessible HTML + CSS tokens |
| `generate_page` | Full multi-section page from a description |
| `list_components` | Discover all 43 available component templates |
| `list_style_modifiers` | 8 visual modifiers + 4 page composition types |
| `list_themes` | 6 theme presets with descriptions |
| `get_theme_css` | CSS custom properties for any theme preset |
| `derive_palette` | Brand color → full accessible palette (WCAG verified) |
| `get_tokens` | Query tokens by path, prefix, or export format |
| `resolve_token` | Trace a token reference to its final value |
| `check_contrast` | WCAG contrast ratio between any two colors |
| `validate_accessibility` | Full accessibility audit on HTML |
| `review_code` | Code quality score, grade, and detailed feedback |

Run with: `npm run mcp` or `node mcp-server/index.js`

---

## Architecture

```
Tokens (W3C DTCG)         Agents                     Output
+-----------------+       +--------------------+      +----------+
| primitives/     |------>| design-token       |----->| HTML     |
|   colors        |       | accessibility      |      | CSS vars |
|   spacing       |       | motion             |      | JSON     |
|   typography    |       | component-gen (43) |      | Pages    |
| semantic/       |       | code-review        |      +----------+
|   colors        |       | orchestrator       |
|   surfaces      |       +--------------------+
|   motion        |              |
| components/     |              v
|   button (40)   |       +--------------------+
+-----------------+       | MCP Server (12)    |----> Any AI tool
                          | REST API (planned) |
                          | JS SDK (planned)   |
                          +--------------------+
```

**Token Hierarchy** — 3 tiers, never skip:
1. **Primitives** — Raw values: `color.blue.600` = `#2563eb`
2. **Semantic** — Intent: `semantic.color.primary.default` → `{color.blue.600}`
3. **Component** — Scoped: `component.button.primary.bg` → `{semantic.color.primary.default}`

**Agent System** — 6 specialized agents:
- **Design Token** — CRUD, resolution, validation across 1,543 tokens
- **Accessibility Validator** — WCAG AA/AAA contrast, semantic HTML, ARIA, theme validation
- **Motion** — Duration/easing presets, GPU-safe property enforcement, `prefers-reduced-motion`
- **Component Generator** — 43 templates, 8 style modifiers, 4 page compositions, NL parsing
- **Code Review** — Quality scoring across 6 categories (tokens, a11y, motion, structure, patterns, performance)
- **Orchestrator** — Multi-agent coordination, validation-fix cycles

---

## Theme Presets

Six built-in themes, all WCAG AA verified (120/120 contrast pairs pass):

| Theme | Style |
|---|---|
| **default** | Clean, professional — the foundation |
| **glass** | Glassmorphism with frosted surfaces and backdrop blur |
| **neumorphic** | Soft shadows, inset/outset depth |
| **brutalist** | Thick borders, raw typography, bold contrast |
| **gradient** | Vibrant gradient surfaces and buttons |
| **darkLuxury** | Dark backgrounds with warm gold accents |

Generate a custom palette from any brand color:

```js
import { derivePalette } from 'aioli-design/theme';

// One color → full accessible palette
const palette = derivePalette('#8b5cf6');
// Returns: primary, hover, active, subtle, muted, dark mode, gradients, shadows
// All WCAG AA verified automatically
```

---

## CLI Commands

| Command | Description |
|---|---|
| `aioli init` | Initialize a project (`--template minimal\|starter\|full`) |
| `aioli build` | Build tokens → CSS + JSON via Style Dictionary |
| `aioli validate` | Validate DTCG token structure |
| `aioli generate <desc>` | Generate component from natural language |
| `aioli audit` | Run accessibility audit on tokens |
| `aioli export` | Export tokens as CSS, JSON, or SCSS |

---

## Standards We Enforce

Every piece of output follows these rules — no exceptions:

- **WCAG 2.1 AA minimum** — 4.5:1 contrast for text, 3:1 for UI, verified at generation time
- **Semantic HTML** — proper heading hierarchy, landmark regions, form labels
- **ARIA when needed** — roles, states, live regions, but never as a substitute for semantic elements
- **Keyboard navigation** — all interactive elements focusable and operable
- **`prefers-reduced-motion`** — every animation has a reduced-motion fallback
- **GPU-safe animations** — only `transform` and `opacity`, never `width`/`height`/`margin`
- **Token discipline** — components use semantic tokens, never raw primitives

---

## Roadmap

- [x] **Design System Engine** — 1,543 tokens, 43 components, 6 agents
- [x] **Visual Enhancements** — Glassmorphism, gradients, neumorphism, animations, themes
- [x] **MCP Server** — 12 tools for AI assistant integration
- [ ] **REST API + JS SDK** — HTTP API and embeddable SDK for any app
- [ ] **Framework Adapters** — React, Vue, Svelte component output (not just HTML strings)
- [ ] **Community Registry** — Shared themes, token packs, custom components

---

## Contributing

Contributions are welcome! Whether it's new component templates, theme presets, accessibility improvements, or framework adapters — we'd love your help making design accessible to everyone.

## Requirements

- Node.js >= 18.0.0

## License

MIT — free forever. That's the point.
