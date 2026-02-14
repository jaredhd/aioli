# Agent System

## Overview

Aioli uses 6 specialized agents that communicate through a shared protocol. Each agent has a focused domain of expertise. The orchestrator coordinates requests between agents and manages validation-fix cycles.

```
                     ┌─────────────┐
                     │ Orchestrator │
                     └──────┬──────┘
        ┌───────┬───────┬───┴───┬──────────┬────────────┐
        │       │       │       │          │            │
   ┌────┴───┐ ┌─┴──┐ ┌─┴──┐ ┌──┴──┐ ┌────┴────┐ ┌────┴────┐
   │ Token  │ │A11y│ │Motion│ │Comp │ │CodeRev  │ │ AI Gen  │
   │ Agent  │ │    │ │     │ │ Gen │ │         │ │(optional)│
   └────────┘ └────┘ └─────┘ └─────┘ └─────────┘ └─────────┘
```

## Agents

### Design Token Agent

**Responsibility:** Token CRUD operations, reference resolution, validation, and export.

**Key capabilities:**
- Read single tokens or by prefix/type
- Write and delete tokens
- Resolve reference chains (`{primitive.color.blue.500}` -> `#3b82f6`)
- Validate DTCG structure
- Export to CSS custom properties and flat JSON
- Detect broken and circular references

**Used by:** All other agents (for reading token values)

### Accessibility Validator Agent

**Responsibility:** WCAG compliance checking across colors, HTML, and motion.

**Key capabilities:**
- Color contrast checking (AA and AAA levels)
- Semantic HTML validation
- ARIA attribute auditing
- Token contrast pair validation
- Fix suggestions routed to appropriate agents

**WCAG thresholds:**
| Level | Normal Text | Large Text | UI Components |
|-------|------------|------------|---------------|
| AA | 4.5:1 | 3:1 | 3:1 |
| AAA | 7:1 | 4.5:1 | 4.5:1 |

### Motion Agent

**Responsibility:** Animation and transition standards enforcement.

**Key capabilities:**
- Named duration lookup (micro: 100ms, fast: 150ms, normal: 250ms, etc.)
- Easing curve provision (enter, exit, default, linear)
- CSS transition/animation validation
- GPU-safe property enforcement (only `transform` and `opacity`)
- `prefers-reduced-motion` compliance checking
- Animation preset generation

**Rules enforced:**
- Never animate `width`, `height`, `margin`, `padding`
- Maximum duration: 600ms
- Minimum meaningful duration: 100ms
- Must support `prefers-reduced-motion: reduce`

### Component Generator Agent

**Responsibility:** Natural language to semantic HTML with token application.

**Key capabilities:**
- Parse natural language descriptions into component specs
- Generate semantic HTML from templates
- Apply appropriate design tokens
- Include ARIA attributes and keyboard navigation info
- Support 23+ component types

**Parsing examples:**
- "large primary button" -> `{ component: 'button', variant: 'primary', size: 'lg' }`
- "search field with label" -> `{ component: 'search-field', label: true }`

### Code Review Agent

**Responsibility:** Cross-domain code review spanning all agent domains.

**Key capabilities:**
- HTML review (semantics, accessibility, structure)
- CSS review (token usage, motion rules, performance)
- Cross-domain issue grouping
- Severity classification (critical, error, warning, info)
- Fix routing to appropriate agents

### Orchestrator Agent

**Responsibility:** Agent coordination, request routing, and fix cycle management.

**Key capabilities:**
- Register and manage agents
- Route requests to appropriate agents
- Run validation -> fix -> re-validation cycles
- Handle multi-agent conflict resolution
- Track fix history

## Agent Protocol

All agents implement a `handleRequest(request)` method that accepts a structured request object:

```js
const request = {
  action: 'actionName',   // What to do
  // ... action-specific parameters
};

const result = agent.handleRequest(request);
// Returns: { success: boolean, data: any, error?: string }
```

### Request Routing

The orchestrator maps agent IDs to instances:

```js
const result = orchestrator.routeRequest('design-token', {
  action: 'getToken',
  path: 'primitive.color.blue.500',
});
```

Agent IDs: `design-token`, `accessibility-validator`, `motion-animation`, `component-generator`, `code-review`

## Fix Cycles

The orchestrator manages automated fix cycles:

1. **Review** -- Code review agent identifies issues across all domains
2. **Group** -- Issues grouped by responsible agent
3. **Route** -- Fix requests sent to appropriate agents
4. **Apply** -- Each agent applies fixes within its domain
5. **Re-validate** -- Re-run review to verify fixes
6. **Report** -- Return final state with any remaining issues

```js
const result = orchestrator.runFixCycle(code, 'html');
// Returns: { fixed, remaining, fixHistory }
```

## Programmatic Usage

### Full system

```js
import { createAgentSystem } from 'aioli-design';

const { token, a11y, motion, component, codeReview, orchestrator } =
  createAgentSystem('./tokens');
```

### Individual agents

```js
import { createDesignTokenAgent, createAccessibilityValidator } from 'aioli-design';

const tokenAgent = createDesignTokenAgent('./tokens');
const a11yAgent = createAccessibilityValidator({
  tokenAgent,
  targetLevel: 'AA'
});
```

### With AI generation

```js
import { AIComponentGenerator, createDesignTokenAgent } from 'aioli-design';

const tokenAgent = createDesignTokenAgent('./tokens');
const aiGen = new AIComponentGenerator({
  apiKey: process.env.ANTHROPIC_API_KEY,
  tokenAgent,
});

const result = await aiGen.generate('responsive hero section with CTA');
```

## Agent Communication Flow

```
User Request
     │
     ▼
Orchestrator
     │
     ├── Route to Token Agent (read tokens)
     │        │
     │        ▼
     ├── Route to Component Gen (generate HTML)
     │        │
     │        ▼
     ├── Route to A11y Agent (validate)
     │        │
     │        ▼
     ├── Route to Motion Agent (validate animations)
     │        │
     │        ▼
     └── Route to Code Review (final check)
              │
              ▼
         Fix Cycle (if issues found)
              │
              ▼
         Final Output
```
