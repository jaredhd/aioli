# 🧄 Aioli Design System

## Project Overview

Aioli is an AI-native design system platform that enables rapid website design creation during project discovery phases. The system enforces industry best practices, accessibility standards, and animation guidelines while allowing customization within defined rules.

## Architecture

Three-layer system:
1. **Rules Engine** - Design tokens, component patterns, accessibility rules, animation standards
2. **Agent Orchestration** - Specialized AI agents that read rules and generate compliant output
3. **Interface Layer** - Visual editor, natural language input, live preview, export

## Key Principles

### Atomic Design
Components follow Atomic Design methodology (43 components):
- **Atoms** → Button, Input, Badge, Avatar, Spinner, Link, Chip, Divider, Skeleton, Progress, Checkbox, Radio, Rating, Toggle
- **Molecules** → Tooltip, Select, Textarea, Alert, Tabs, Accordion, Dropdown, Toast, Breadcrumb, Pagination, Stepper, Popover, Form-Group, Search-Autocomplete
- **Organisms** → Card, Modal, Table, Navigation, Card-Product, Card-Profile, Card-Stats, Hero, Feature-Grid, Pricing-Table, Data-Table, Form-Wizard
- **Templates** → Layout-Dashboard, Layout-Marketing, Layout-Blog
- **Pages** → Generated via PAGE_COMPOSITIONS (marketing, dashboard, blog, pricing)

### Token Hierarchy (3-Tier)
1. **Primitives** (`tokens/primitives/`) - Raw values, never used directly
2. **Semantic** (`tokens/semantic/`) - Intent-based, references primitives
3. **Component** (`tokens/components/`) - Scoped to specific components

## File Structure

```
tokens/
├── primitives/          # Raw values (6 files)
│   ├── colors.json      # Color palette scales (14 families)
│   ├── spacing.json     # Spacing scale (0-96)
│   ├── typography.json  # Font families, sizes, weights
│   ├── radius.json      # Border radius scale
│   ├── shadows.json     # Shadow primitives
│   └── motion.json      # Durations, easing curves
├── semantic/            # Intent-based tokens (8 files)
│   ├── colors.json      # primary, success, danger, etc.
│   ├── surfaces.json    # Backgrounds, borders, shadows
│   ├── text.json        # Typography hierarchy
│   ├── gradients.json   # Gradient presets (Tier 1)
│   ├── glass.json       # Glassmorphism surfaces (Tier 1)
│   ├── colored-shadows.json  # Colored shadow tokens (Tier 1)
│   ├── motion.json      # Motion presets, keyframes (Tier 2)
│   └── focus.json       # Focus ring styles
└── components/          # Component-scoped tokens (40 files)
    ├── button.json      # Button sizes, variants, states
    ├── card.json        # Card variants, sizing
    ├── ...              # 31 original + 9 enhanced (Tier 4)
    └── form-wizard.json # Multi-step form wizard

agents/
├── index.js                      # Agent barrel export
├── component-generator-agent.js  # 43 templates, 8 style modifiers, 4 page compositions
├── design-token-agent.js         # Token CRUD, resolution, validation
├── accessibility-validator-agent.js  # WCAG AA/AAA checks
├── motion-agent.js               # Animation validation & presets
├── code-review-agent.js          # Code quality review
├── orchestrator-agent.js         # Multi-agent coordination
└── agent-protocol.js             # Shared agent protocol

css/
├── aioli.css                     # Entry point (imports tokens, base, components)
├── base.css                      # Reset, dark mode, typography
├── tokens.css                    # Generated from Style Dictionary
└── components/
    ├── index.css                 # 43 component @imports
    └── *.css                     # Individual component stylesheets (BEM)

src/
├── playground/                   # AI playground (NL → component)
├── demo/                         # Component gallery
├── docs/                         # Interactive documentation
└── theme-builder/                # Theme customization UI
```

## Token Format

All tokens follow the W3C DTCG (Design Tokens Community Group) specification:

```json
{
  "tokenName": {
    "$value": "value or {reference.to.other.token}",
    "$type": "color|dimension|fontFamily|etc",
    "$description": "Optional description"
  }
}
```

## Commands

```bash
npm install          # Install dependencies
npm run build        # Build tokens → CSS, JS, JSON (1,543 tokens)
npm run build:watch  # Watch mode
npm run validate     # Validate all token references (0 errors)
npm run test         # Run vitest suite (225 tests)
npm run clean        # Clear dist folder
npm run dev          # Vite dev server (playground, demo, docs)
```

## Standards to Enforce

### Accessibility
- WCAG 2.1 AA minimum (AAA where feasible)
- Semantic HTML
- ARIA when necessary
- Keyboard navigation
- `prefers-reduced-motion` support

### Animation/Motion (see animation-motion-standards.md)
- Durations: micro (100ms) → slower (600ms)
- Easing: enter (ease-out), exit (ease-in), default (ease-in-out)
- Only animate: transform, opacity (GPU accelerated)
- Never animate: width, height, margin, padding

### Code Quality
- Valid, semantic HTML
- CSS custom properties for all tokens
- Component encapsulation
- Responsive by default

## When Adding New Tokens

1. Determine the tier (primitive → semantic → component)
2. Use DTCG format with `$value`, `$type`, `$description`
3. Reference existing tokens where possible: `"{color.blue.500}"`
4. Run `npm run build` to regenerate outputs
5. Validate accessibility implications

## When Creating Components

1. Start at Atom level unless combining existing atoms
2. Use semantic tokens, not primitives directly
3. Include all interactive states (hover, focus, active, disabled)
4. Support `prefers-reduced-motion`
5. Ensure WCAG AA contrast ratios

## Visual Enhancements (Tiers 1-5)

### Tier 1: Visual Foundation
- Colored shadows (`semantic-shadow-colored-*`), gradients (`semantic-gradient-*`)
- Glassmorphism surfaces (`semantic-glass-*`), backdrop blur tokens
- Button depth/3D styles, neumorphic effects

### Tier 2: Motion System
- Entrance animations (fade-in, slide-up, scale-in, blur-in)
- Hover micro-interactions (lift, glow, scale, wiggle)
- Page transitions (fade, slide, zoom)
- `prefers-reduced-motion` always respected

### Tier 3: Theme Presets
- 6 built-in themes: minimal, vibrant, corporate, warm, cool, high-contrast
- Smart palette auto-derivation from a single base color
- HSL manipulation for generating full color scales

### Tier 4: Component Sophistication
- 12 enhanced templates: card-product, card-profile, card-stats, hero, feature-grid, pricing-table, layout-dashboard, layout-marketing, layout-blog, search-autocomplete, data-table, form-wizard
- 43 total component templates (up from 31)
- 40 component token files, 1,543 total tokens

### Tier 5: Smarter NL Parsing
- 8 style modifiers: glass, gradient, neumorphic, brutalist, elevated, dark-luxury, colored-shadow, animated
- 4 page compositions: marketing-page, dashboard-page, blog-page, pricing-page
- Modifiers applied via NL (e.g., "glassmorphic card with title")
- Full page generation from single prompt (e.g., "marketing landing page")
- New handleRequest actions: `generatePageComposition`, `listPageCompositions`, `listStyleModifiers`

## Exported Constants

```js
import {
  COMPONENT_TEMPLATES,  // 43 component template definitions
  STYLE_MODIFIERS,      // 8 visual style modifiers
  PAGE_COMPOSITIONS,    // 4 page composition templates
  createComponentGenerator,
  createAgentSystem,
} from './agents/index.js';
```
