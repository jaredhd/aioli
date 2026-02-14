# Token Architecture

## Overview

Aioli uses a three-tier token hierarchy following the W3C Design Tokens Community Group (DTCG) specification. Tokens flow from raw values (primitives) through intent-based mappings (semantic) to component-specific scoping.

```
Primitives  →  Semantic  →  Component
(raw values)   (intent)     (scoped)
```

## DTCG Format

Every token uses the standard DTCG format with `$`-prefixed properties:

```json
{
  "tokenName": {
    "$value": "#3b82f6",
    "$type": "color",
    "$description": "Blue 500 from the primary palette"
  }
}
```

**Required:** `$value`
**Optional:** `$type`, `$description`

### Supported Types

| Type | Example |
|------|---------|
| `color` | `#3b82f6`, `rgb(59, 130, 246)` |
| `dimension` | `16px`, `1rem` |
| `fontFamily` | `'Inter', sans-serif` |
| `fontWeight` | `400`, `600` |
| `duration` | `100ms`, `0.25s` |
| `cubicBezier` | `[0.4, 0, 0.2, 1]` |
| `number` | `1.5`, `4.5` |
| `shadow` | `0 1px 3px rgba(0,0,0,0.1)` |
| `typography` | Composite font properties |

### References

Tokens can reference other tokens using curly brace syntax:

```json
{
  "primary": {
    "$value": "{primitive.color.blue.500}",
    "$type": "color"
  }
}
```

References are resolved at build time by Style Dictionary. The Design Token Agent also resolves them at runtime.

## Tier 1: Primitives

**Location:** `tokens/primitives/`

Raw values with no semantic meaning. Never used directly in components.

### colors.json

Full color palette with 6 families, each with 11-12 shades:

```
primitive.color.neutral.0     → #ffffff
primitive.color.neutral.50    → #f8fafc
primitive.color.neutral.100   → #f1f5f9
...
primitive.color.neutral.950   → #020617

primitive.color.blue.50       → #eff6ff
primitive.color.blue.500      → #3b82f6
primitive.color.blue.950      → #172554
```

Families: `neutral`, `blue`, `emerald`, `amber`, `red`, `purple`

### spacing.json

Spacing scale from 0 to 96:

```
primitive.spacing.0    → 0px
primitive.spacing.1    → 4px
primitive.spacing.2    → 8px
primitive.spacing.4    → 16px
primitive.spacing.8    → 32px
primitive.spacing.16   → 64px
```

### typography.json

Font definitions:

```
primitive.font.family.sans   → 'Inter', system-ui, sans-serif
primitive.font.family.serif  → 'Merriweather', Georgia, serif
primitive.font.family.mono   → 'JetBrains Mono', monospace

primitive.font.size.xs       → 0.75rem
primitive.font.size.base     → 1rem
primitive.font.size.4xl      → 2.25rem
```

### radius.json / motion.json

Border radius scale and animation duration/easing definitions.

## Tier 2: Semantic

**Location:** `tokens/semantic/`

Intent-based tokens that reference primitives. These carry meaning.

### colors.json

```json
{
  "semantic": {
    "color": {
      "primary": { "$value": "{primitive.color.blue.600}", "$type": "color" },
      "success": {
        "default": { "$value": "{primitive.color.emerald.600}", "$type": "color" },
        "hover": { "$value": "{primitive.color.emerald.700}", "$type": "color" }
      },
      "danger": {
        "default": { "$value": "{primitive.color.red.600}", "$type": "color" }
      }
    }
  }
}
```

### surfaces.json

Background, border, and text colors:

```
semantic.surface.page.default  → {primitive.color.neutral.0}
semantic.surface.card.default  → {primitive.color.neutral.0}
semantic.border.default        → {primitive.color.neutral.200}
semantic.text.default          → {primitive.color.neutral.900}
semantic.text.muted            → {primitive.color.neutral.500}
```

### dark.json

Dark mode overrides. Same token paths with dark-appropriate values:

```
semantic.surface.dark.page.default  → {primitive.color.neutral.900}
semantic.text.dark.default          → {primitive.color.neutral.50}
```

## Tier 3: Component

**Location:** `tokens/components/`

Scoped to individual components. Reference semantic tokens.

### Example: button.json

```json
{
  "component": {
    "button": {
      "radius": { "$value": "{primitive.radius.md}", "$type": "dimension" },
      "size": {
        "sm": {
          "height": { "$value": "32px", "$type": "dimension" },
          "paddingX": { "$value": "{primitive.spacing.3}", "$type": "dimension" },
          "fontSize": { "$value": "{primitive.font.size.sm}", "$type": "dimension" }
        },
        "md": { ... },
        "lg": { ... }
      },
      "primary": {
        "bg": { "$value": "{semantic.color.primary.default}", "$type": "color" },
        "bgHover": { "$value": "{semantic.color.primary.hover}", "$type": "color" },
        "text": { "$value": "{primitive.color.neutral.0}", "$type": "color" }
      }
    }
  }
}
```

### Available Components (23)

accordion, alert, avatar, badge, button, card, checkbox, divider, dropdown, form-field, input, modal, navigation, radio, select, skeleton, spinner, table, tabs, textarea, toast, toggle, tooltip

## File Organization

```
tokens/
  primitives/
    colors.json        # 6 color families, 11-12 shades each
    spacing.json       # 0-96 scale
    typography.json    # Fonts, sizes, weights, line heights
    radius.json        # Border radius scale
    motion.json        # Durations and easing curves
  semantic/
    colors.json        # primary, success, warning, danger
    surfaces.json      # Backgrounds, borders, text
    dark.json          # Dark mode overrides
  components/
    button.json        # Button sizes, variants, states
    input.json         # Input states, borders, focus
    card.json          # Card shadow, padding, media
    ...                # 20 more component files
```

## Naming Conventions

- **Primitives**: `primitive.{category}.{name}.{shade/scale}`
- **Semantic**: `semantic.{category}.{intent}.{variant}`
- **Component**: `component.{name}.{property}.{state/variant}`

Examples:
```
primitive.color.blue.500
semantic.color.primary.default
component.button.primary.bg
component.button.size.md.height
```

## Adding New Tokens

1. Determine the tier (primitive, semantic, or component)
2. Create or edit the appropriate JSON file
3. Use DTCG format with `$value`, `$type`, `$description`
4. Reference existing tokens where possible
5. Run `aioli validate` to check structure
6. Run `aioli build` to regenerate outputs
7. Run `aioli audit` to verify accessibility
