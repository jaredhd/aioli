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
Components follow Atomic Design methodology:
- **Atoms** → Button, Input, Label, Icon, Badge
- **Molecules** → SearchField, FormGroup, NavLink
- **Organisms** → Header, Footer, ProductCard
- **Templates** → BlogLayout, Dashboard
- **Pages** → Specific instances with real content

### Token Hierarchy (3-Tier)
1. **Primitives** (`tokens/primitives/`) - Raw values, never used directly
2. **Semantic** (`tokens/semantic/`) - Intent-based, references primitives
3. **Component** (`tokens/components/`) - Scoped to specific components

## File Structure

```
tokens/
├── primitives/          # Raw values
│   ├── colors.json      # Color palette scales
│   ├── spacing.json     # Spacing scale (0-96)
│   ├── typography.json  # Font families, sizes, weights
│   ├── radius.json      # Border radius scale
│   └── motion.json      # Durations, easing curves
├── semantic/            # Intent-based tokens
│   ├── colors.json      # primary, success, danger, etc.
│   ├── surfaces.json    # Backgrounds, borders, shadows
│   └── text.json        # Typography hierarchy
└── components/          # Component-scoped tokens
    └── button.json      # Button sizes, variants, states
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
npm run build        # Build tokens → CSS, JS, JSON
npm run build:watch  # Watch mode
npm run clean        # Clear dist folder
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
