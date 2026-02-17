# Launch Day Cross-Post Copy

> Copy-paste-ready posts for each platform. Swap [PLAYGROUND_URL] with your live link.

---

## Hacker News — Show HN

**Title:**
```
Show HN: Aioli – Free AI design system engine (React/Vue/Svelte, 43 components, WCAG AA)
```

**Body (text post):**
```
I built Aioli because the AI app builders I kept reaching for — v0, Bolt, Lovable — generate great-looking UIs but charge $20-50/month, lock you into their platform, and treat accessibility as an afterthought.

Aioli is a free, open-source design system engine. You describe what you want in natural language, and it generates production-quality, WCAG-compliant components in HTML, React, Vue, or Svelte. Under the hood: 1,543 W3C design tokens across 3 tiers, 6 specialized agents (token management, accessibility validation, motion standards, component generation, code review, orchestration), and 43 component templates following Atomic Design.

Key technical decisions:
- Rule-based agents, not LLM calls. Deterministic output, no API keys, no usage limits.
- HTML-first pipeline: 43 templates generate HTML, then framework adapters transform to React/Vue/Svelte. Single source of truth.
- 12-tool MCP server so Claude/Cursor/Copilot can call Aioli directly.
- 13-endpoint REST API + JS SDK for programmatic access.
- Community registry for custom component packages (publish/install/validate).
- All 6 theme presets pass 120/120 WCAG AA contrast pairs.

Try it: [PLAYGROUND_URL]
GitHub: https://github.com/jaredhd/aioli
npm: npm install aioli-design

Interested in what people think — and what you'd want next. TypeScript output? Figma plugin? VS Code extension?
```

---

## Dev.to Article

**Frontmatter:**
```
---
title: "I built a free, open-source alternative to v0 and Bolt"
published: true
tags: opensource, webdev, react, accessibility
cover_image: (use OG image URL)
---
```

**Body:**

```markdown
## The Problem

The best AI UI builders — v0, Bolt, Lovable — are impressive. But they share three problems:

1. **They cost $20-50/month.** Design intelligence is gated behind a paywall.
2. **They lock you in.** Their output doesn't compose into a real design system.
3. **Accessibility is optional.** Beautiful screenshots, questionable production quality.

## The Solution

I built Aioli: a free, open-source design system engine that generates production-quality UI from natural language.

**What makes it different:**

- **43 components** from atoms to full pages, all from a text prompt
- **4 output formats** — HTML, React (JSX), Vue 3 (SFC), Svelte
- **1,543 design tokens** in W3C DTCG format across 3 tiers
- **WCAG AA enforced** — 120/120 contrast pairs pass across 6 themes
- **No LLM calls** — rule-based agents, deterministic, no API keys

## How It Works

Aioli uses a 4-layer architecture:

1. **Tokens** — 1,543 W3C design tokens (primitives, semantic, component)
2. **Agents** — 6 specialized AI agents (not LLMs — rule-based logic)
3. **Interfaces** — MCP Server, REST API, JS SDK, CLI
4. **Output** — HTML, React, Vue, Svelte, CSS custom properties

## Quick Start

The fastest path — plug it into your AI assistant:

```bash
npm install aioli-design
```

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "aioli": {
      "command": "node",
      "args": ["node_modules/aioli-design/mcp-server/index.js"]
    }
  }
}
```

Then ask: "Use Aioli to generate a glassmorphic pricing page with 3 tiers."

Or use the SDK directly:

```js
import { createAioli } from 'aioli-design/sdk';

const aioli = await createAioli({ mode: 'direct', tokensPath: './tokens' });
const card = await aioli.generateComponent('pricing card', { format: 'react' });
```

## Try It

- **Playground:** [PLAYGROUND_URL]
- **GitHub:** https://github.com/jaredhd/aioli
- **npm:** `npm install aioli-design`

MIT licensed. Free forever. That's the point.
```

---

## Reddit Posts

### r/webdev

**Title:**
```
I built an open-source AI design system that generates React/Vue/Svelte components from natural language — free, WCAG AA, no API keys
```

**Body:**
```
Hey r/webdev — I've been working on Aioli, a free design system engine that takes natural language and outputs production-quality components.

The pitch: the same design intelligence that v0/Bolt/Lovable charge $20-50/month for, completely free and open-source.

What it does:
- 43 components (atoms → pages) from text descriptions
- Output in HTML, React, Vue, or Svelte
- 1,543 W3C design tokens, 6 theme presets
- 120/120 WCAG AA contrast pairs pass
- MCP server (works with Claude/Cursor), REST API, JS SDK
- Community registry for custom components

It's rule-based agents, not LLM calls — so deterministic output, no API keys, no usage limits.

Playground: [PLAYGROUND_URL]
GitHub: https://github.com/jaredhd/aioli

Would love feedback. What would make this useful for your workflow?
```

### r/reactjs

**Title:**
```
Aioli: Generate accessible React components from natural language — free, open-source, 43 templates
```

**Body:**
```
Built an open-source tool that generates React (JSX) components from natural language descriptions. It's not an LLM wrapper — it uses rule-based agents with 1,543 design tokens and 43 component templates.

Example:
const aioli = await createAioli({ mode: 'direct', tokensPath: './tokens' });
const card = await aioli.generateComponent('glassmorphic pricing card', { format: 'react' });
// Returns ready-to-use JSX with proper className, useState for stateful components

It also does Vue and Svelte from the same templates. WCAG AA enforced (120/120 contrast pairs pass), 6 theme presets, and an MCP server so Claude/Cursor can call it directly.

GitHub: https://github.com/jaredhd/aioli
npm install aioli-design
```

### r/vuejs

**Title:**
```
Aioli: Generate Vue 3 SFCs from natural language — free, open-source design system engine
```

**Body:**
```
Sharing a project I've been working on — Aioli generates Vue 3 Single File Components from natural language descriptions.

It outputs proper <script setup> with defineProps/defineEmits, computed properties for stateful components (tabs, accordion, modal), and uses 1,543 W3C design tokens.

Example:
const aioli = await createAioli({ mode: 'direct', tokensPath: './tokens' });
const card = await aioli.generateComponent('neumorphic card', { format: 'vue' });
// Returns a .vue SFC with <template>, <script setup>, proper Vue 3 idioms

43 component templates, 6 WCAG AA themes, MCP server for AI assistants, REST API, and JS SDK. All free and open-source.

GitHub: https://github.com/jaredhd/aioli
```

### r/sveltejs

**Title:**
```
Aioli: Generate Svelte components from natural language — 43 templates, WCAG AA, free
```

**Body:**
```
Built a design system engine that generates Svelte components from text descriptions. It outputs proper Svelte idioms — export let for props, $: reactive declarations, on:click handlers, class: directives.

Example:
const card = await aioli.generateComponent('glassmorphic card', { format: 'svelte' });
// Returns Svelte with export let, reactive statements, event handlers

Under the hood: 1,543 design tokens, 43 templates, 6 WCAG AA verified themes. Also generates HTML, React, and Vue from the same templates. Has an MCP server so Claude/Cursor can use it directly.

Free, open-source, MIT licensed.
GitHub: https://github.com/jaredhd/aioli
```

---

## Twitter/X Thread

```
1/ I built a free alternative to v0, Bolt, and Lovable.

Aioli is an open-source AI design system that generates production UI from natural language.

React. Vue. Svelte. WCAG AA. No API keys. No subscription.

Here's what it does:

2/ Describe what you want in plain English:

"glassmorphic pricing card with 3 tiers"

Aioli generates production-ready code in your framework of choice — HTML, React (JSX), Vue 3 (SFC), or Svelte.

Same prompt. Same tokens. Different output.

3/ Under the hood:

- 1,543 W3C design tokens (3 tiers)
- 43 component templates (atoms to full pages)
- 6 theme presets (all 120/120 WCAG AA)
- 6 rule-based agents (not LLM calls)
- Community component registry

4/ Four ways to use it:

- MCP Server (12 tools) — plug into Claude, Cursor, Copilot
- REST API (13 endpoints) — self-host, no auth wall
- JS SDK (12 methods) — npm install and go
- CLI — generate from the terminal

5/ Why free?

Because design intelligence shouldn't be paywalled. The same capabilities premium tools charge $20-50/month for should be available to everyone.

MIT licensed. Free forever. That's the point.

6/ Try it now:

Playground: [PLAYGROUND_URL]
GitHub: https://github.com/jaredhd/aioli
npm: npm install aioli-design

Would love to hear what you'd want next — TypeScript output? Figma plugin? VS Code extension?
```

---

## Launch Day Checklist

- [ ] Verify GitHub Pages is live at https://jaredhd.github.io/aioli/
- [ ] Verify npm publish succeeded (`npm view aioli-design version` shows 0.5.0)
- [ ] Post on Product Hunt (use copy from `docs/product-hunt-listing.md`)
- [ ] Post Show HN on Hacker News
- [ ] Post on r/webdev
- [ ] Post on r/reactjs
- [ ] Post on r/vuejs (optional, same day or next)
- [ ] Post on r/sveltejs (optional, same day or next)
- [ ] Post Twitter/X thread
- [ ] Publish Dev.to article
- [ ] Engage with all comments throughout the day
