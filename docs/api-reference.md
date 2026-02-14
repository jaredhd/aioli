# API Reference

## createAgentSystem(tokensDir)

Create and connect all 6 agents with the orchestrator.

```js
import { createAgentSystem } from 'aioli';

const agents = createAgentSystem('./tokens');
// Returns: { token, a11y, motion, component, codeReview, orchestrator }
```

**Parameters:**
- `tokensDir` (string) -- Path to the tokens directory

**Returns** an object with all agents connected:

| Property | Agent | Description |
|----------|-------|-------------|
| `token` | DesignTokenAgent | Token CRUD, validation, export |
| `a11y` | AccessibilityValidatorAgent | Contrast, HTML, ARIA checks |
| `motion` | MotionAgent | Duration, easing, validation |
| `component` | ComponentGeneratorAgent | Component generation |
| `codeReview` | CodeReviewAgent | Cross-domain code review |
| `orchestrator` | OrchestratorAgent | Request routing, fix cycles |

---

## DesignTokenAgent

### Constructor

```js
import { createDesignTokenAgent } from 'aioli';
const agent = createDesignTokenAgent('./tokens');
```

### Methods

#### getToken(path)

Get a single token by its dot-notation path.

```js
const token = agent.getToken('primitive.color.blue.500');
// Returns: { path, rawValue, resolvedValue, type, description, referenceChain }
```

#### getTokensByPrefix(prefix)

Get all tokens matching a path prefix.

```js
const tokens = agent.getTokensByPrefix('component.button');
```

#### getTokensByType(type)

Get all tokens of a specific DTCG type.

```js
const colors = agent.getTokensByType('color');
const dimensions = agent.getTokensByType('dimension');
```

#### getAllTokenPaths()

Get all token paths in the system.

```js
const paths = agent.getAllTokenPaths();
// Returns: ['primitive.color.blue.50', 'primitive.color.blue.100', ...]
```

#### validate()

Validate all token files for DTCG compliance.

```js
const result = agent.validate();
// Returns: { valid: boolean, issues: [{ path, error, severity }] }
```

#### setToken(path, value, type, description)

Create or update a token.

```js
agent.setToken('semantic.color.brand', '{primitive.color.blue.600}', 'color', 'Brand color');
```

#### deleteToken(path)

Remove a token.

```js
agent.deleteToken('semantic.color.brand');
```

#### toCSS()

Export all tokens as CSS custom properties.

```js
const css = agent.toCSS();
// Returns: ":root { --primitive-color-blue-500: #3b82f6; ... }"
```

#### toFlatJSON()

Export all tokens as a flat key-value object.

```js
const json = agent.toFlatJSON();
// Returns: { "primitive.color.blue.500": "#3b82f6", ... }
```

#### handleRequest(request)

Process a structured request (used by the orchestrator).

```js
const result = agent.handleRequest({
  action: 'getToken',
  path: 'primitive.color.blue.500',
});
```

---

## AccessibilityValidatorAgent

### Constructor

```js
import { createAccessibilityValidator } from 'aioli';
const agent = createAccessibilityValidator({
  tokenAgent,          // DesignTokenAgent instance
  targetLevel: 'AA',   // 'AA' or 'AAA'
});
```

### Methods

#### checkContrast(foreground, background, options?)

Check contrast ratio between two colors.

```js
const result = agent.checkContrast('#ffffff', '#3b82f6');
// Returns: { ratio, meetsAA, meetsAAA, foreground, background }
```

Options: `{ textSize: 'normal' | 'large', isUI: boolean }`

#### validateHTML(html)

Validate HTML for semantic structure and accessibility.

```js
const result = agent.validateHTML('<div onclick="fn()">Click</div>');
// Returns: { valid, issues: [{ rule, message, severity, suggestion }] }
```

#### validateTokenContrast()

Check contrast ratios across all semantic color token pairs.

```js
const result = agent.validateTokenContrast();
// Returns: { pairs: [{ fg, bg, ratio, pass, required }] }
```

#### suggestFixes(issues)

Get fix suggestions for accessibility issues.

```js
const fixes = agent.suggestFixes(issues);
```

### Utility Functions

```js
import { getContrastRatio, parseColor, WCAG_CONTRAST_RATIOS } from 'aioli';

getContrastRatio('#ffffff', '#000000'); // 21
parseColor('#3b82f6');                  // { r, g, b }
WCAG_CONTRAST_RATIOS.AA.normalText;    // 4.5
```

---

## MotionAgent

### Constructor

```js
import { createMotionAgent } from 'aioli';
const agent = createMotionAgent({ tokenAgent });
```

### Methods

#### getDuration(name)

Get a named duration value.

```js
const d = agent.getDuration('micro'); // 100ms
```

Names: `instant`, `micro`, `fast`, `normal`, `slow`, `slower`

#### getEasing(name)

Get a named easing curve.

```js
const e = agent.getEasing('enter'); // ease-out
```

Names: `default`, `enter`, `exit`, `linear`

#### generateTransition(properties, options?)

Generate a CSS transition string.

```js
const t = agent.generateTransition(['opacity', 'transform'], { duration: 'fast' });
```

#### generatePreset(type)

Get a predefined animation preset.

```js
const preset = agent.generatePreset('fadeIn');
```

#### validate(css)

Validate CSS animation/transition code.

```js
const result = agent.validate('transition: width 0.3s ease;');
// Returns: { valid, issues: [{ property, message, severity, suggestion }] }
```

### Constants

```js
import { DURATION, EASING, ANIMATION_TYPES, ALLOWED_PROPERTIES, PROHIBITED_PROPERTIES } from 'aioli';

DURATION.micro;          // '100ms'
EASING.enter;            // 'cubic-bezier(...)'
ALLOWED_PROPERTIES;      // ['transform', 'opacity']
PROHIBITED_PROPERTIES;   // ['width', 'height', 'margin', 'padding']
```

---

## ComponentGeneratorAgent

### Constructor

```js
import { createComponentGenerator } from 'aioli';
const agent = createComponentGenerator({ tokenAgent, motionAgent });
```

### Methods

#### generate(componentType, props?)

Generate a specific component type with props.

```js
const result = agent.generate('button', { variant: 'primary', size: 'lg' });
// Returns: { html, tokens, a11y }
```

#### generateFromDescription(description)

Generate a component from natural language.

```js
const result = agent.generateFromDescription('large danger button with icon');
// Returns: { html, tokens, a11y, parsed: { component, variant, size, ... } }
```

### Constants

```js
import { COMPONENT_TEMPLATES } from 'aioli';
// Templates for: button, input, card, modal, navigation, form-group, search-field, ...
```

---

## AIComponentGenerator

AI-powered generation using the Anthropic API. Requires `ANTHROPIC_API_KEY`.

```js
import { AIComponentGenerator } from 'aioli';

const gen = new AIComponentGenerator({
  apiKey: process.env.ANTHROPIC_API_KEY,
  tokenAgent,
  a11yAgent,
  motionAgent,
});

const result = await gen.generate('responsive pricing table with monthly/yearly toggle');
```

Falls back to template-based generation when no API key is set.

---

## OrchestratorAgent

### Constructor

```js
import { createOrchestrator } from 'aioli';
const orchestrator = createOrchestrator({
  'design-token': tokenAgent,
  'accessibility-validator': a11yAgent,
  'motion-animation': motionAgent,
  'component-generator': componentAgent,
  'code-review': codeReviewAgent,
});
```

### Methods

#### routeRequest(agentId, request)

Route a request to a specific agent.

```js
const result = orchestrator.routeRequest('design-token', {
  action: 'getToken',
  path: 'primitive.color.blue.500',
});
```

#### runFixCycle(code, type)

Run a full validation-fix-revalidation cycle.

```js
const result = orchestrator.runFixCycle(htmlCode, 'html');
```

---

## CodeReviewAgent

### Constructor

```js
import { createCodeReviewAgent } from 'aioli';
const agent = createCodeReviewAgent({
  tokenAgent, a11yAgent, motionAgent, componentAgent,
});
```

### Methods

Use via `handleRequest`:

```js
// Full review
const result = agent.handleRequest({ action: 'review', code, type: 'html' });
// Returns: { issues: [{ category, severity, message, suggestion }] }

// Quick check
const quick = agent.handleRequest({ action: 'quickCheck', code, type: 'css' });
```

### Constants

```js
import { REVIEW_CATEGORIES, SEVERITY } from 'aioli';
```
