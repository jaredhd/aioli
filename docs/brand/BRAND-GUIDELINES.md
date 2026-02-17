# Aioli Brand Guidelines

> **Version:** 1.0  
> **Last updated:** February 2026  
> **Status:** Active

---

## The Mark

The Aioli logo is called the **Garlic Vortex**. Five agent streams spiral inward, tracing the silhouette of a garlic bulb — the culinary origin of the word "aioli." The streams represent AI agents converging into a unified output, and the hidden garlic form creates the kind of double-take that makes the mark memorable.

### Anatomy

- **Outer streams (2):** The two primary curves that form the left and right sides of the garlic bulb silhouette. These are the heaviest strokes.
- **Inner clove lines (2):** Thinner streams suggesting the separation between garlic cloves. They spiral into the same center point.
- **Stem (1):** A subtle vertical line from the top — the garlic stem — also representing the initial input/prompt that starts the agent workflow.
- **Convergence node:** The solid center circle where all streams meet — the blended output.
- **Origin nodes:** Small dots at the starting point of each stream — representing individual agents before orchestration.

---

## Logo Versions

### Primary (Dark)
**File:** `aioli-logo-dark.svg`  
**Use on:** Dark backgrounds (#0e0e12 or darker)  
**Colors:** Emulsion Green (#5ae6a2) mark + Parchment (#e8e6e1) text

### Primary (Light)
**File:** `aioli-logo-light.svg`  
**Use on:** Light backgrounds (#f4f1eb or lighter)  
**Colors:** Deep Green (#0e8a56) mark + Near Black (#1a1a1f) text

### Icon Only
**File:** `aioli-icon-green.svg`  
**Use for:** Favicons, app icons, small contexts, social avatars

### Monochrome
**File:** `aioli-icon-mono-white.svg`  
**Use for:** Single-color printing, watermarks, embossing

### GitHub Banner
**File:** `aioli-github-banner.svg`  
**Dimensions:** 1280×640 (GitHub social preview standard)  
**Use for:** Repository social image, Open Graph meta

---

## Color Palette

| Name | Hex | RGB | Use |
|------|-----|-----|-----|
| **Emulsion Green** | `#5ae6a2` | 90, 230, 162 | Primary brand color, logo mark on dark |
| **Deep Green** | `#0e8a56` | 14, 138, 86 | Logo mark on light backgrounds |
| **Void** | `#0e0e12` | 14, 14, 18 | Primary dark background |
| **Carbon** | `#1a1a1f` | 26, 26, 31 | Secondary dark, card backgrounds |
| **Parchment** | `#e8e6e1` | 232, 230, 225 | Primary light text, light backgrounds |

### Extended palette

| Name | Hex | Use |
|------|-----|-----|
| Emulsion Green 10% | `rgba(90,230,162,0.1)` | Badges, subtle backgrounds |
| Emulsion Green 15% border | `rgba(90,230,162,0.15)` | Tag borders, dividers |
| Muted | `#555555` | Secondary text, descriptions |
| Ghost | `#444444` | Tertiary text, labels |

---

## Typography

### Primary: Outfit
- **Weights used:** 200 (ExtraLight), 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Use for:** Wordmark, headings, body text, UI
- **Source:** [Google Fonts](https://fonts.google.com/specimen/Outfit)

### Monospace: JetBrains Mono
- **Weights used:** 300 (Light), 400 (Regular), 500 (Medium)
- **Use for:** Code, labels, badges, technical UI, taglines
- **Source:** [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono)

### Wordmark Rules
- "Ai" is always set in **Outfit Medium (500)** in Emulsion Green
- "oli" is always set in **Outfit Light (300)** in the appropriate text color
- The "A" is uppercase, everything else lowercase: **Aioli** (never AIOLI, never aioli in the wordmark)
- Letter-spacing: -1px at display sizes

---

## Spacing & Clear Space

The minimum clear space around the logo is equal to the height of the convergence node (the center circle). No other elements, text, or edges should intrude into this space.

For the icon-only mark, the clear space is 25% of the icon's total width on all sides.

---

## Minimum Sizes

| Format | Minimum |
|--------|---------|
| Full lockup (mark + wordmark) | 200px wide |
| Icon only | 24px × 24px |
| Favicon | 16px × 16px (simplified to convergence node + dominant stream only) |

At sizes below 32px, drop the inner clove lines and stem — only the two outer streams and convergence node should remain.

---

## Don'ts

- ❌ Don't rotate the mark
- ❌ Don't stretch or distort proportions
- ❌ Don't recolor streams individually (all streams must be the same hue)
- ❌ Don't add drop shadows or outer glows
- ❌ Don't place on busy photo backgrounds without a backing shape
- ❌ Don't recreate the wordmark in a different font
- ❌ Don't remove the convergence node (center dot)
- ❌ Don't use the mark at less than 24px without simplifying

---

## File Inventory

```
assets/
├── svg/
│   ├── aioli-logo-dark.svg          # Primary lockup, dark bg
│   ├── aioli-logo-light.svg         # Primary lockup, light bg
│   ├── aioli-icon-green.svg         # Icon-only, green on transparent
│   ├── aioli-icon-mono-white.svg    # Icon-only, white on transparent
│   └── aioli-github-banner.svg      # 1280×640 social preview
└── png/                              # Rasterized versions (generate from SVG)
    └── (generate at 1x, 2x, 4x as needed)
```

---

## CSS Variables

For use in the Aioli codebase and documentation:

```css
:root {
  /* Brand colors */
  --aioli-green: #5ae6a2;
  --aioli-green-deep: #0e8a56;
  --aioli-green-10: rgba(90, 230, 162, 0.1);
  --aioli-green-15: rgba(90, 230, 162, 0.15);
  
  /* Backgrounds */
  --aioli-void: #0e0e12;
  --aioli-carbon: #1a1a1f;
  --aioli-parchment: #e8e6e1;
  
  /* Text */
  --aioli-text-primary: #e8e6e1;
  --aioli-text-muted: #555555;
  --aioli-text-ghost: #444444;
  
  /* Typography */
  --aioli-font-display: 'Outfit', sans-serif;
  --aioli-font-mono: 'JetBrains Mono', monospace;
}
```

---

## Badge / Shield Styles

For README badges, use these colors:

```markdown
![MIT License](https://img.shields.io/badge/license-MIT-5ae6a2?style=flat-square&labelColor=0e0e12)
![Built with Claude Code](https://img.shields.io/badge/built_with-Claude_Code-5ae6a2?style=flat-square&labelColor=0e0e12)
![Status: Alpha](https://img.shields.io/badge/status-alpha-f0c050?style=flat-square&labelColor=0e0e12)
```

---

*The Aioli brand is open source under the same license as the project. Use it freely.*
