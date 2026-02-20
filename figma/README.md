# Aioli Figma Plugin

Generates a complete Figma component library from Aioli's design tokens — 1,309 Variables, 21 Styles, and 43 Components with proper variant properties and 6 theme modes.

## Quick Start (Development)

### 1. Load the plugin in Figma

1. Open Figma Desktop
2. Go to **Plugins > Development > Import plugin from manifest...**
3. Select `figma/plugin/manifest.json`

### 2. Generate tokens (dev mode)

```bash
npm run figma:tokens
```

### 3. Run the plugin

1. Open a new Figma file
2. Run: **Plugins > Development > Aioli Design System**
3. Expand "Use custom tokens" and paste `figma/figma-tokens.json` contents
4. Click **Generate Library**

## Publishing to Figma Community

To make the plugin discoverable by anyone on the Figma Community:

### 1. Get a real plugin ID

1. In Figma Desktop: **Plugins > Development > New Plugin...**
2. Choose "Figma design" and give it a name
3. Figma assigns a numeric ID
4. Copy the ID from the generated manifest
5. Replace `"aioli-design-system-generator"` in `figma/plugin/manifest.json` with the real ID

### 2. Bundle tokens into the plugin

```bash
npm run figma:build
```

This runs the token transformer and embeds all 1,309 variables directly into `code.js`. The plugin becomes self-contained — users click "Generate" and it works, no JSON pasting needed.

### 3. Test the bundled plugin

1. Import the manifest in Figma
2. Run the plugin — it should show the preview stats and a one-click "Generate Library" button
3. Click Generate and verify everything creates correctly

### 4. Submit for review

1. In Figma: right-click the plugin in Plugins panel > **Publish**
2. Fill in the listing:
   - **Name**: Aioli Design System
   - **Tagline**: Free, open-source design system — 1,300+ variables, 6 themes, 43 components
   - **Description**: Full description of what gets created
   - **Tags**: design-system, design-tokens, variables, components, themes, accessibility, wcag, open-source, free
   - **Icon**: 128x128 PNG
   - **Cover image**: 1920x960 PNG (component showcase)
3. Submit — Figma reviews within 5-10 business days

### 5. Restore dev mode

After bundling, `code.js` contains the full token payload. To restore the dev version:

```bash
git checkout figma/plugin/code.js
```

## What Gets Created

### Variables (3 Collections, 1,309 total)

| Collection | Variables | Modes | Contents |
|-----------|-----------|-------|----------|
| **Primitives** | 243 | 1 (Value) | Colors (14 families x 11 shades), spacing, radius, font sizes |
| **Semantic** | 159 | 6 themes | Color intents, surfaces, text, borders, focus |
| **Component** | 907 | 6 themes | Button, Card, Input, and all component-scoped tokens |

### Text Styles (13)

Display, Heading, Body, Caption, Label, and Code styles using Inter.

### Effect Styles (8)

Shadow XS through 2XL, Inner Shadow, and Focus Ring.

### Components (43)

All Aioli components organized by Atomic Design category:
- **Atoms** (14): Button, Input, Badge, Avatar, Spinner, Link, Chip, Divider, Skeleton, Progress, Checkbox, Radio, Rating, Toggle
- **Molecules** (14): Tooltip, Select, Textarea, Alert, Tabs, Accordion, Dropdown, Toast, Breadcrumb, Pagination, Stepper, Popover, Form Group, Search Autocomplete
- **Organisms** (12): Card, Modal, Table, Navigation, Card Product, Card Profile, Card Stats, Hero, Feature Grid, Pricing Table, Data Table, Form Wizard
- **Templates** (3): Layout Dashboard, Layout Marketing, Layout Blog

Components are created as Component Sets with variant properties (size, variant, state) and fills/borders/radii bound to Figma Variables.

## Theme Modes

Switch between 6 themes by changing the Variable mode on any frame:

1. **Default** — Clean, professional
2. **Glass** — Frosted glass, backdrop blur
3. **Neumorphic** — Soft shadows, extruded
4. **Brutalist** — Thick borders, hard shadows
5. **Gradient** — Rich gradient backgrounds
6. **Dark Luxury** — Deep blacks, gold accents

## Architecture

```
figma/
├── transform-tokens.js      # Node.js: reads DTCG tokens → figma-tokens.json
├── build-plugin.js           # Bundles tokens into code.js for publishing
├── figma-tokens.json         # Generated (gitignored)
├── plugin/
│   ├── manifest.json         # Figma plugin manifest
│   ├── code.js               # Plugin: Variables, Styles, Components
│   └── ui.html               # Plugin UI: one-click generate + custom paste
└── README.md                 # This file
```

The two-part architecture exists because Figma's plugin sandbox has no filesystem access. The Node.js transformer reads DTCG token files and produces a JSON payload. The build script then embeds that payload into the plugin code for zero-setup use.

## Publishing as a Figma Library

After generating components in a file, publish it as a Figma Library:

1. File > Publish styles and variables
2. Team members can then enable the library in their files
3. All variables, styles, and components become available
