# Design Token Standards Guide

Reference document for the AI-Native Design System Platform. Use this guide to understand the design token ecosystem and inform architectural decisions for the Rules Engine.

---

## Overview

Design tokens are named entities that store visual design attributes (colors, spacing, typography, etc.) in a platform-agnostic format. They serve as the single source of truth between design tools and code.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DESIGN TOKEN ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────────┐    │
│   │   DESIGN    │      │   TOKEN     │      │    CODE         │    │
│   │   TOOLS     │ ───▶ │   FORMAT    │ ───▶ │    OUTPUT       │    │
│   │             │      │   (JSON)    │      │                 │    │
│   └─────────────┘      └─────────────┘      └─────────────────┘    │
│                                                                     │
│   • Figma            • DTCG Spec           • CSS Variables         │
│   • Penpot           • Style Dictionary    • Tailwind Config       │
│   • Sketch           • Tokens Studio       • iOS Swift             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Top 5 Design Token Standards

### 1. W3C Design Tokens Community Group (DTCG) Specification

**Status:** First stable release (v2025.10) — October 2025  
**Type:** Open specification / JSON format  
**Role:** The emerging industry standard

#### What It Is

The DTCG specification defines a vendor-agnostic JSON format for expressing design tokens. Managed by a W3C community group with contributors from Adobe, Figma, Google, Microsoft, Salesforce, and others.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Theming** | Multi-brand support, light/dark modes, accessibility variants |
| **Modern Color Spaces** | Full support for Display P3, Oklch, CSS Color Module 4 |
| **Token Relationships** | Inheritance, aliases, component-level references |
| **Extensibility** | Custom properties via `$extensions` |

#### Format Example

```json
{
  "color": {
    "brand": {
      "primary": {
        "$value": "#6366f1",
        "$type": "color",
        "$description": "Primary brand color"
      },
      "secondary": {
        "$value": "{color.brand.primary}",
        "$type": "color"
      }
    }
  },
  "spacing": {
    "sm": {
      "$value": "8px",
      "$type": "dimension"
    },
    "md": {
      "$value": "16px",
      "$type": "dimension"
    }
  }
}
```

#### Supported Token Types

- `color` — Any color value (hex, rgb, hsl, oklch, etc.)
- `dimension` — Size values with units (px, rem, em, %)
- `fontFamily` — Font stack strings
- `fontWeight` — Numeric or keyword weights
- `duration` — Time values for animations
- `cubicBezier` — Easing curves as coordinate arrays
- `number` — Unitless numbers
- `strokeStyle` — Border/stroke patterns
- `border` — Composite border tokens
- `transition` — Composite animation tokens
- `shadow` — Box/drop shadow definitions
- `gradient` — Linear/radial gradient definitions
- `typography` — Composite font tokens

#### Why It Matters for This Project

- **Open standard** — No vendor lock-in
- **Wide adoption** — Tools are converging on this format
- **AI-friendly** — Structured JSON is easy for agents to read/write/validate

#### Resources

- Specification: https://www.designtokens.org/
- GitHub: https://github.com/design-tokens/community-group
- W3C Community: https://www.w3.org/community/design-tokens/

---

### 2. Style Dictionary (by Amazon)

**Status:** Actively maintained (now by Tokens Studio team)  
**Type:** Build/transformation tool  
**Role:** Converts tokens to platform-specific code

#### What It Is

Style Dictionary is a build system that takes design tokens defined in JSON and transforms them into platform-specific outputs: CSS custom properties, Sass variables, iOS Swift constants, Android XML resources, and more.

#### How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                     STYLE DICTIONARY PIPELINE                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────┐    ┌────────────┐    ┌────────────┐    ┌────────┐ │
│   │ SOURCE  │    │            │    │            │    │ OUTPUT │ │
│   │  JSON   │───▶│ TRANSFORMS │───▶│  FORMATS   │───▶│ FILES  │ │
│   │ tokens  │    │            │    │            │    │        │ │
│   └─────────┘    └────────────┘    └────────────┘    └────────┘ │
│                                                                   │
│   tokens/          name/cti         css/variables     variables. │
│   ├─ color.json    color/hex        scss/variables      css      │
│   ├─ spacing.json  size/rem         ios-swift/class   _tokens.   │
│   └─ typography.   time/seconds     android/resources   scss     │
│        json                                            Colors.   │
│                                                          swift   │
└──────────────────────────────────────────────────────────────────┘
```

#### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-platform** | Single source → CSS, iOS, Android, JS, etc. |
| **Extensible** | Custom transforms, formats, and actions |
| **DTCG Compatible** | v4+ supports DTCG spec as input |
| **Deep Merge** | Organize tokens across multiple files |

#### Configuration Example

```javascript
// config.js
export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables'
      }]
    },
    tailwind: {
      transformGroup: 'js',
      buildPath: 'build/',
      files: [{
        destination: 'tailwind.config.js',
        format: 'tailwind/config'  // Custom format
      }]
    }
  }
};
```

#### Built-in Transform Groups

| Platform | Transform Group | Output Format |
|----------|-----------------|---------------|
| Web (CSS) | `css` | CSS custom properties |
| Web (Sass) | `scss` | Sass variables |
| Web (Less) | `less` | Less variables |
| iOS | `ios-swift` | Swift constants |
| Android | `android` | XML resources |
| JavaScript | `js` | ES6 modules |

#### Why It Matters for This Project

- **Solves the "multiple CSS frameworks" question** — One source, many outputs
- **Battle-tested** — Used by Amazon, REI, Salesforce, and many others
- **Scriptable** — Can be triggered by agents during code generation

#### Resources

- Documentation: https://styledictionary.com/
- GitHub: https://github.com/amzn/style-dictionary
- Playground: https://www.style-dictionary-play.dev/

---

### 3. Tokens Studio (formerly Figma Tokens)

**Status:** Actively developed  
**Type:** Design tool plugin + standalone platform  
**Role:** Bridges design tools and code repositories

#### What It Is

Tokens Studio started as a Figma plugin and has evolved into a full design system platform. It allows designers to define, manage, and sync design tokens directly within Figma, with Git-based version control.

#### Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    TOKENS STUDIO WORKFLOW                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐         ┌─────────────┐         ┌─────────────┐  │
│   │  FIGMA  │◀───────▶│   TOKENS    │◀───────▶│    GIT      │  │
│   │         │  plugin │   STUDIO    │   sync  │  REPOSITORY │  │
│   └─────────┘         └─────────────┘         └─────────────┘  │
│        │                     │                       │         │
│        │                     │                       │         │
│        ▼                     ▼                       ▼         │
│   Variables &          JSON tokens            CI/CD Pipeline   │
│   Styles updated       (DTCG format)          Style Dictionary │
│                                               → Code output    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

#### Key Features

| Feature | Description |
|---------|-------------|
| **Bi-directional Sync** | Figma ↔ Git repository |
| **Theming** | Theme groups, token sets, multi-brand support |
| **DTCG Compliant** | Exports in W3C standard format |
| **Token Types** | Supports types Figma doesn't natively (spacing, border-radius) |
| **Math & Modifiers** | `{spacing.base} * 2`, color modifications |

#### Supported Sync Providers

- GitHub
- GitLab
- Azure DevOps
- Bitbucket
- JSONBin
- Supernova
- Generic URL

#### Token Set Example

```json
{
  "global": {
    "colors": {
      "blue": {
        "100": { "$value": "#e0f2fe", "$type": "color" },
        "500": { "$value": "#0ea5e9", "$type": "color" },
        "900": { "$value": "#0c4a6e", "$type": "color" }
      }
    }
  },
  "semantic": {
    "color": {
      "primary": { "$value": "{global.colors.blue.500}", "$type": "color" },
      "background": { "$value": "#ffffff", "$type": "color" }
    }
  },
  "dark": {
    "color": {
      "background": { "$value": "#0f172a", "$type": "color" }
    }
  }
}
```

#### Why It Matters for This Project

- **Designer-friendly** — Non-technical users can manage tokens
- **Git-native** — Version control built in
- **Extensible** — Can be part of automated workflows

#### Resources

- Website: https://tokens.studio/
- Documentation: https://docs.tokens.studio/
- GitHub: https://github.com/tokens-studio/figma-plugin

---

### 4. Figma Variables (Native)

**Status:** Production feature (launched 2023, extended 2025)  
**Type:** Native design tool feature  
**Role:** Built-in token-like system within Figma

#### What It Is

Figma Variables is Figma's native implementation of design tokens. While not 1:1 with the DTCG spec, it provides similar functionality: reusable values, aliasing, theming via modes, and collections.

#### Concepts Mapping

| DTCG Concept | Figma Variables Equivalent |
|--------------|----------------------------|
| Token | Variable |
| Token Group | Collection |
| Theme | Mode |
| Alias | Variable reference |

#### Variable Types

| Type | Use Cases |
|------|-----------|
| **Color** | Brand colors, semantic colors, gradients |
| **Number** | Spacing, sizing, border-radius, opacity |
| **String** | Font families, content strings |
| **Boolean** | Visibility toggles, feature flags |

#### Collections & Modes Example

```
┌─────────────────────────────────────────────────────────────┐
│                    COLLECTION: Colors                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Variable Name        │ Light Mode    │ Dark Mode          │
│   ─────────────────────┼───────────────┼──────────────────  │
│   surface/default      │ #ffffff       │ #0f172a            │
│   surface/elevated     │ #f8fafc       │ #1e293b            │
│   text/primary         │ #0f172a       │ #f8fafc            │
│   text/secondary       │ #64748b       │ #94a3b8            │
│   border/default       │ #e2e8f0       │ #334155            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Extended Collections (Schema 2025)

Figma's November 2025 update introduced extended collections for enterprise users:

- Multi-brand support from a single library
- Inheritance between collections
- Better alignment with DTCG theming concepts

#### Why It Matters for This Project

- **Native performance** — No plugin overhead
- **Designer adoption** — Lowest barrier to entry
- **Figma ecosystem** — Works with Dev Mode handoff

#### Limitations

- No native export to DTCG format (requires Tokens Studio or similar)
- Missing some token types (typography as composite)
- Figma-specific, not platform-agnostic

#### Resources

- Help Center: https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
- Variables Deep Dive: https://www.youtube.com/watch?v=1ONxxlJnvdM

---

### 5. Theo (by Salesforce)

**Status:** Maintenance mode (legacy)  
**Type:** Build/transformation tool  
**Role:** The original design token tool

#### What It Is

Theo was created by Salesforce (where the term "design tokens" was coined in 2014). It transforms design tokens defined in JSON/YAML into platform-specific formats.

#### Historical Significance

```
┌─────────────────────────────────────────────────────────────┐
│                 DESIGN TOKEN TIMELINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   2014        2017           2019          2023       2025   │
│    │           │              │             │           │    │
│    ▼           ▼              ▼             ▼           ▼    │
│   Theo      Style         DTCG          Figma       DTCG    │
│   created   Dictionary    formed        Variables   v1.0    │
│   by        released                    launched    stable  │
│   Salesforce by Amazon                                       │
│                                                              │
│   "Design tokens" term coined ──────────────────────────▶   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Format Example (Theo)

```yaml
# tokens.yml
global:
  category: color
  type: brand
props:
  - name: COLOR_BRAND_PRIMARY
    value: "#0176d3"
    comment: "Primary brand color"
  - name: COLOR_BRAND_SECONDARY  
    value: "#032d60"
```

#### Why It Matters

- **Historical context** — Understanding where tokens came from
- **Concept origin** — Many DTCG concepts trace back to Theo
- **Salesforce ecosystem** — Still used in Lightning Design System

#### Current Recommendation

For new projects, use **Style Dictionary** instead. Theo is no longer actively developed and Style Dictionary covers the same use cases with more features and community support.

#### Resources

- GitHub: https://github.com/salesforce-ux/theo
- Lightning Design System: https://www.lightningdesignsystem.com/

---

## Recommended Architecture for This Project

Based on the research, here's the recommended token architecture for the AI-Native Design System Platform:

### Token Format: DTCG Specification

```
┌─────────────────────────────────────────────────────────────────┐
│                 RECOMMENDED TOKEN ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    RULES ENGINE                           │  │
│   │                                                           │  │
│   │   tokens/                                                 │  │
│   │   ├── primitives/                                         │  │
│   │   │   ├── colors.json      ← Raw color palette            │  │
│   │   │   ├── spacing.json     ← Spacing scale                │  │
│   │   │   ├── typography.json  ← Font stacks, sizes           │  │
│   │   │   └── motion.json      ← Durations, easings           │  │
│   │   │                                                       │  │
│   │   ├── semantic/                                           │  │
│   │   │   ├── colors.json      ← Intent-based (primary, etc.) │  │
│   │   │   ├── surfaces.json    ← Background, card, etc.       │  │
│   │   │   └── text.json        ← Text hierarchy               │  │
│   │   │                                                       │  │
│   │   └── components/                                         │  │
│   │       ├── button.json      ← Button-specific tokens       │  │
│   │       ├── input.json       ← Input-specific tokens        │  │
│   │       └── card.json        ← Card-specific tokens         │  │
│   │                                                           │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                   STYLE DICTIONARY                        │  │
│   │                                                           │  │
│   │   Transforms DTCG tokens into:                            │  │
│   │   • CSS custom properties                                 │  │
│   │   • Tailwind config                                       │  │
│   │   • Vanilla CSS                                           │  │
│   │   • (Future: iOS, Android)                                │  │
│   │                                                           │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                   AGENT LAYER                             │  │
│   │                                                           │  │
│   │   Design Token Agent:                                     │  │
│   │   • Reads/writes DTCG JSON                                │  │
│   │   • Validates token structure                             │  │
│   │   • Resolves aliases                                      │  │
│   │   • Triggers Style Dictionary builds                      │  │
│   │                                                           │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Token Hierarchy (3-Tier System)

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN HIERARCHY                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   TIER 1: PRIMITIVES (What exists)                          │
│   ─────────────────────────────────                         │
│   Raw values, never applied directly to designs             │
│                                                              │
│   color.blue.500        → #3b82f6                           │
│   spacing.4             → 16px                               │
│   font.size.base        → 16px                               │
│                                                              │
│                         │                                    │
│                         ▼                                    │
│                                                              │
│   TIER 2: SEMANTIC (How to use)                             │
│   ─────────────────────────────                             │
│   Intent-based, theme-aware                                  │
│                                                              │
│   color.primary         → {color.blue.500}                  │
│   color.surface.default → {color.neutral.50}                │
│   spacing.component.gap → {spacing.4}                       │
│                                                              │
│                         │                                    │
│                         ▼                                    │
│                                                              │
│   TIER 3: COMPONENT (Where to use)                          │
│   ────────────────────────────────                          │
│   Scoped to specific components                              │
│                                                              │
│   button.background     → {color.primary}                   │
│   button.padding.x      → {spacing.component.gap}           │
│   card.border.radius    → {radius.md}                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Sample DTCG Token File

```json
{
  "$type": "color",
  "primitives": {
    "blue": {
      "50":  { "$value": "#eff6ff" },
      "100": { "$value": "#dbeafe" },
      "200": { "$value": "#bfdbfe" },
      "300": { "$value": "#93c5fd" },
      "400": { "$value": "#60a5fa" },
      "500": { "$value": "#3b82f6" },
      "600": { "$value": "#2563eb" },
      "700": { "$value": "#1d4ed8" },
      "800": { "$value": "#1e40af" },
      "900": { "$value": "#1e3a8a" }
    },
    "neutral": {
      "50":  { "$value": "#f8fafc" },
      "900": { "$value": "#0f172a" }
    }
  },
  "semantic": {
    "color": {
      "primary": {
        "$value": "{primitives.blue.500}",
        "$description": "Primary brand color for buttons, links"
      },
      "surface": {
        "default": {
          "$value": "{primitives.neutral.50}",
          "$description": "Default page background"
        }
      }
    }
  }
}
```

---

## Integration Points

### Design Token Agent Responsibilities

| Task | Input | Output |
|------|-------|--------|
| **Read tokens** | Token path | Resolved value |
| **Write tokens** | Token name, value, type | Updated JSON |
| **Validate** | Token file | Validation report |
| **Resolve aliases** | Token with reference | Final value |
| **Build** | Source tokens | Platform-specific files |

### Style Dictionary Integration

```javascript
// Example: Custom Tailwind format for Style Dictionary
StyleDictionary.registerFormat({
  name: 'tailwind/config',
  format: function({ dictionary }) {
    const tokens = dictionary.allTokens;
    const colors = {};
    const spacing = {};
    
    tokens.forEach(token => {
      if (token.$type === 'color') {
        // Build nested color object for Tailwind
        // color.primary → colors: { primary: value }
      }
      if (token.$type === 'dimension') {
        // Build spacing object
      }
    });
    
    return `module.exports = {
      theme: {
        colors: ${JSON.stringify(colors, null, 2)},
        spacing: ${JSON.stringify(spacing, null, 2)}
      }
    }`;
  }
});
```

---

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token format | DTCG Specification | Open standard, wide adoption, AI-friendly JSON |
| Build tool | Style Dictionary | Multi-platform output, extensible, actively maintained |
| Storage format | JSON (not YAML) | Easier for agents to parse/generate, DTCG standard |
| Token hierarchy | 3-tier (primitive → semantic → component) | Industry best practice, clear separation of concerns |

---

## Open Questions

- [ ] Should the Rules Engine UI allow direct JSON editing, or only visual controls?
- [ ] How will token changes trigger rebuilds in connected projects?
- [ ] What validation rules should the Design Token Agent enforce?
- [ ] How to handle token versioning and breaking changes?

---

## Reference Links

### Specifications
- DTCG Spec: https://www.designtokens.org/
- DTCG GitHub: https://github.com/design-tokens/community-group

### Tools
- Style Dictionary: https://styledictionary.com/
- Tokens Studio: https://tokens.studio/
- Figma Variables: https://help.figma.com/

### Learning Resources
- Tokens Studio Docs: https://docs.tokens.studio/
- Style Dictionary Examples: https://styledictionary.com/getting-started/examples/
- Design Tokens Guide: https://thedesignsystem.guide/design-tokens

### Related Project Files
- Animation & Motion Standards: `/mnt/project/animation-motion-standards.md`
