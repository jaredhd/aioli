# Getting Started with Aioli

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

```bash
# Global install (for CLI)
npm install -g aioli-design

# Local install (for programmatic use)
npm install aioli-design
```

## Initialize a Project

### Template mode (quick start)

```bash
# Starter: primitives + semantic + common components (recommended)
aioli init --template starter

# Minimal: just primitive and semantic tokens
aioli init --template minimal

# Full: all 23 component token files
aioli init --template full
```

### Interactive mode

```bash
aioli init
```

Walk through prompts to choose:
1. Project name
2. Preset or custom configuration
3. Dark mode inclusion
4. Component token selection

### What gets created

```
your-project/
  tokens/
    primitives/     # Color, spacing, typography, radius, motion scales
    semantic/       # Intent-based tokens (primary, success, danger)
    components/     # Component-scoped tokens (button, card, input, etc.)
  config.js         # Style Dictionary build configuration
  .env.example      # API key placeholder
  dist/             # Build output directory
```

## Build Tokens

```bash
aioli build
```

This runs Style Dictionary to transform your DTCG tokens into:
- `dist/css/tokens.css` -- CSS custom properties
- `dist/tokens.json` -- Nested JSON for programmatic access

## Validate Tokens

```bash
aioli validate
```

Checks all token files for:
- Valid DTCG structure (`$value`, `$type` fields)
- Correct reference format (`{primitive.color.blue.500}`)
- Broken or circular references
- Unknown `$type` values

## Generate a Component

```bash
# Template-based (no API key needed)
aioli generate "large primary button with icon"

# AI-powered (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=your-key
aioli generate --ai "responsive pricing table"
```

## Run Accessibility Audit

```bash
# WCAG AA audit
aioli audit

# WCAG AAA audit
aioli audit --level AAA

# Save report to file
aioli audit --report reports/a11y.json
```

## Export Tokens

```bash
# CSS custom properties (default)
aioli export --format css -o dist/tokens.css

# JSON
aioli export --format json -o dist/tokens.json

# SCSS variables
aioli export --format scss -o dist/_tokens.scss

# Pipe to stdout
aioli export --format css
```

## Programmatic Usage

```js
import { createAgentSystem } from 'aioli-design';

const agents = createAgentSystem('./tokens');

// Access individual agents
agents.token      // Design Token Agent
agents.a11y       // Accessibility Validator
agents.motion     // Motion Agent
agents.component  // Component Generator
agents.codeReview // Code Review Agent
agents.orchestrator // Orchestrator
```

## Next Steps

- [API Reference](api-reference.md) -- All functions and methods
- [CLI Reference](cli-reference.md) -- Detailed command documentation
- [Token Architecture](token-architecture.md) -- How the 3-tier token system works
- [Agent System](agent-system.md) -- How agents orchestrate validation and generation
