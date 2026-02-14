# Aioli

[![CI](https://github.com/jaredhd/aioli/actions/workflows/ci.yml/badge.svg)](https://github.com/jaredhd/aioli/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/aioli-design.svg)](https://www.npmjs.com/package/aioli-design)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-native design system engine. Token management, accessibility validation, component generation, and motion standards — all enforced by a 6-agent orchestration system.

Aioli provides the backbone for building accessible, responsive websites and applications from prompts and requirements. Use it as a programmatic engine or through its CLI.

## Quick Start

```bash
# Install globally for CLI access
npm install -g aioli-design

# Initialize a new project
aioli init --template starter

# Build tokens to CSS and JSON
aioli build

# Validate token structure
aioli validate

# Generate a component
aioli generate "primary button with icon"

# Run accessibility audit
aioli audit
```

## Programmatic Usage

```js
import { createAgentSystem } from 'aioli-design';

const agents = createAgentSystem('./tokens');

// Generate a component from natural language
const result = agents.component.generateFromDescription('large danger button');
console.log(result.html);

// Check color contrast (WCAG AA)
const contrast = agents.a11y.checkContrast('#ffffff', '#3b82f6');
console.log(`Ratio: ${contrast.ratio}:1, AA: ${contrast.meetsAA}`);

// Validate all tokens
const validation = agents.token.validate();
console.log(`Valid: ${validation.valid}, Issues: ${validation.issues.length}`);

// Get motion duration
const duration = agents.motion.getDuration('micro');
console.log(duration); // { value: '100ms', ... }

// Run full code review
const review = agents.codeReview.handleRequest({
  action: 'review',
  code: '<div onclick="handler()">Click</div>',
  type: 'html',
});
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `aioli init` | Initialize a new project (interactive or `--template minimal\|starter\|full`) |
| `aioli build` | Build tokens into CSS and JSON via Style Dictionary |
| `aioli validate` | Validate DTCG token files for structural correctness |
| `aioli generate <desc>` | Generate a component from natural language |
| `aioli audit` | Run accessibility audit on design tokens |
| `aioli export` | Export tokens as CSS, JSON, or SCSS |

Run `aioli <command> --help` for detailed options.

## Architecture

Aioli uses a three-layer architecture:

```
Tokens (DTCG)          Agents                    Output
+-----------------+    +-------------------+     +--------+
| primitives/     |--->| design-token      |---->| CSS    |
| semantic/       |    | accessibility     |     | JSON   |
| components/     |    | motion            |     | SCSS   |
+-----------------+    | component-gen     |     | HTML   |
                       | code-review       |     +--------+
                       | orchestrator      |
                       +-------------------+
```

**Token Hierarchy** (3-tier, W3C DTCG format):
1. **Primitives** - Raw values (colors, spacing, typography scales)
2. **Semantic** - Intent-based tokens referencing primitives (primary, success, danger)
3. **Component** - Scoped to specific components (button sizes, card shadows)

**Agent System** (6 agents):
- **Design Token** - Read, write, validate, resolve token references
- **Accessibility Validator** - WCAG AA/AAA contrast, semantic HTML, ARIA
- **Motion** - Animation durations, easing, GPU-safe property enforcement
- **Component Generator** - Natural language to semantic HTML with tokens
- **Code Review** - Cross-domain code review with severity grouping
- **Orchestrator** - Routes requests, manages validation-fix cycles

## API Key (Optional)

Most functionality works without any API key. The AI-powered component generator (for complex, non-template components) optionally uses the Anthropic API:

```bash
export ANTHROPIC_API_KEY=your-key-here
aioli generate --ai "responsive pricing table with toggle"
```

Without the key, `generate` uses built-in templates.

## Token Format

All tokens follow the W3C DTCG specification:

```json
{
  "color": {
    "primary": {
      "$value": "{primitive.color.blue.500}",
      "$type": "color",
      "$description": "Primary brand color"
    }
  }
}
```

## Live Demo

- [Landing Page](https://jared.github.io/aioli/)
- [Interactive Documentation](https://jared.github.io/aioli/docs.html)
- [Component Gallery](https://jared.github.io/aioli/demo.html)

## Documentation

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [CLI Reference](docs/cli-reference.md)
- [Token Architecture](docs/token-architecture.md)
- [Agent System](docs/agent-system.md)
- [Animation & Motion Standards](docs/animation-motion-standards.md)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

## Requirements

- Node.js >= 18.0.0

## License

MIT
