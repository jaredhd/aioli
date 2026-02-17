# Product Hunt Listing — Aioli Design System

> Reference copy for the Product Hunt launch. Not part of the npm package.

---

## Tagline (60 chars max)

```
Free AI design system: 43 components, any framework, WCAG AA
```

---

## Description (260 chars max)

```
Free, open-source AI design system engine. Natural language to production UI in HTML, React, Vue, or Svelte. 1,543 design tokens, 43 components, 6 WCAG AA themes. No API keys. No subscription. Plugs into Claude, Cursor, and any AI assistant via MCP.
```

---

## Maker's First Comment

```
Hey Product Hunt!

I built Aioli because the best AI app builders — v0, Bolt, Lovable — generate
beautiful UIs but charge $20-50/month, lock you into their ecosystem, and treat
accessibility as an afterthought.

That didn't sit right with me. Design intelligence shouldn't be gated behind a
paywall.

So I built the open-source answer:

- 43 components from natural language (atoms → pages)
- 4 output formats: HTML, React, Vue, Svelte — one prompt, any framework
- 1,543 W3C design tokens across 3 tiers
- 6 theme presets, all WCAG AA verified (120/120 contrast pairs pass)
- 12-tool MCP server — plug into Claude, Cursor, Copilot
- 13-endpoint REST API + JavaScript SDK
- Community registry for custom component packages

No API keys. No subscription. MIT licensed. Free forever.

Try the playground: [LINK]
GitHub: https://github.com/jaredhd/aioli

I'd love to hear what you think, and what you'd want to see next —
TypeScript output? Figma plugin? VS Code extension? Let me know!
```

---

## Categories

1. **Developer Tools** (primary)
2. **Design Tools**
3. **Open Source**
4. **Artificial Intelligence**

---

## Topics/Tags

- Design Systems
- Open Source
- AI
- React
- Vue
- Svelte
- Accessibility
- MCP
- Developer Tools
- CSS

---

## Gallery Media Checklist

1. **Hero image** — Use `public/og-image.svg` (updated with latest stats)
2. **Screenshot: Playground** — AI playground generating a component from NL
3. **Screenshot: Theme Builder** — Switching between 6 theme presets
4. **Screenshot: Component Gallery** — Grid of all 43 components
5. **GIF: Framework Output** — Tabbing through HTML → React → Vue → Svelte
6. **Screenshot: Terminal** — CLI generating a component + audit output

---

## Suggested Launch Day Schedule

- **Morning**: Post goes live, share on Twitter/X with playground link
- **Afternoon**: Engage with every comment, answer questions
- **Evening**: Share on relevant Discord/Slack communities (React, Vue, Svelte, a11y)
- **Cross-post**: Dev.to article, Hacker News Show HN, Reddit r/webdev + r/reactjs

---

## Key Talking Points for Comments

- **"How is this different from v0/Bolt?"** — Aioli is free, open-source, and accessibility-first. Premium tools generate pretty screenshots; Aioli generates production-quality, WCAG-compliant code with proper token architecture.

- **"Why not just use Tailwind/shadcn?"** — Aioli is a design system *engine*, not a component library. It generates components in any framework from natural language, enforces accessibility at generation time, and uses W3C standard design tokens.

- **"Does it use AI/LLMs internally?"** — No. Aioli uses a rule-based agent system — deterministic, no API keys, no usage limits. The "AI" is in the architecture (specialized agents), not in calling external models.

- **"What's the MCP server?"** — Model Context Protocol lets AI assistants (Claude, Cursor, Copilot) use Aioli's 12 tools directly. Ask your AI to "generate a glassmorphic pricing page" and it calls Aioli under the hood.
