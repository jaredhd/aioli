# Aioli Brand — Claude Code Integration Guide

> **Purpose:** Step-by-step instructions for integrating the Aioli brand assets into your GitHub repository and project using Claude Code.

---

## Quick Setup (Copy-Paste to Claude Code)

Paste this entire block into Claude Code to set up the brand in your project:

```
I need you to set up the Aioli brand assets in my project. Here's what to do:

1. Create the directory structure:
   - docs/brand/assets/svg/
   - docs/brand/assets/png/
   - docs/brand/

2. Copy all SVG files from the brand package into docs/brand/assets/svg/

3. Update the project README.md to use the Aioli banner and branding (see README template below)

4. Set up the GitHub repository settings:
   - Social preview image: use aioli-github-banner.svg (convert to PNG first at 1280x640)
   - Description: "Open source AI agent orchestration design system"
   - Topics: ai, agents, orchestration, design-system, open-source, claude-code

5. Add the CSS variables from the brand guidelines to any web-facing docs or pages

6. Set up the CLAUDE.md file with the brand context (see below)
```

---

## Step 1: Directory Structure

```bash
# Run in your project root
mkdir -p docs/brand/assets/svg
mkdir -p docs/brand/assets/png
mkdir -p .github
```

Target layout:
```
your-project/
├── .github/
│   └── FUNDING.yml          # Optional: sponsorship links
├── docs/
│   └── brand/
│       ├── BRAND-GUIDELINES.md
│       └── assets/
│           ├── svg/
│           │   ├── aioli-logo-dark.svg
│           │   ├── aioli-logo-light.svg
│           │   ├── aioli-icon-green.svg
│           │   ├── aioli-icon-mono-white.svg
│           │   └── aioli-github-banner.svg
│           └── png/
│               └── (generated rasters)
├── CLAUDE.md
├── README.md
└── ...
```

---

## Step 2: CLAUDE.md — Brand Context for Claude Code

Add this to your project's `CLAUDE.md` so Claude Code understands the brand when making changes:

```markdown
# CLAUDE.md

## Project: Aioli
Aioli is an open source AI agent orchestration design system. The name is a reference to the condiment aioli (garlic + oil emulsion) — we blend AI agents into cohesive workflows.

## Brand Identity
- **Logo:** The "Garlic Vortex" — five streams spiraling inward forming a garlic bulb silhouette
- **Primary color:** Emulsion Green (#5ae6a2)
- **Dark background:** Void (#0e0e12)
- **Light text:** Parchment (#e8e6e1)
- **Fonts:** Outfit (display/UI), JetBrains Mono (code/labels)
- **Wordmark rule:** "Ai" in green bold, "oli" in light weight — always "Aioli" (capital A, rest lowercase)

## Brand Files
- Logo SVGs: `docs/brand/assets/svg/`
- Full guidelines: `docs/brand/BRAND-GUIDELINES.md`
- CSS variables are defined in the brand guidelines

## Tone of Voice
- Technical but approachable
- Open source community spirit — "good AI should be free"
- Culinary metaphors welcome (blending, emulsifying, ingredients, recipes)
- Never corporate-speak

## Code Style
- When generating UI: use the Aioli color palette and Outfit/JetBrains Mono fonts
- When generating docs: follow the brand voice guidelines
- When referencing the project name: always "Aioli" (capital A)
- Emoji use in docs: sparing, garlic 🧄 is the project emoji

## Architecture Terminology
- Agents, not bots
- Orchestration, not management
- Workflows, not pipelines
- Streams, not chains
```

---

## Step 3: GitHub Repository Setup

### Social Preview
Convert the banner SVG to PNG for GitHub's social preview:

```bash
# If you have Inkscape installed:
inkscape docs/brand/assets/svg/aioli-github-banner.svg \
  --export-type=png \
  --export-filename=docs/brand/assets/png/aioli-github-banner.png \
  --export-width=1280 --export-height=640

# Or use rsvg-convert:
rsvg-convert -w 1280 -h 640 \
  docs/brand/assets/svg/aioli-github-banner.svg \
  > docs/brand/assets/png/aioli-github-banner.png
```

Then go to **GitHub repo → Settings → Social preview** and upload the PNG.

### Repository Settings

| Setting | Value |
|---------|-------|
| Description | Open source AI agent orchestration design system |
| Website | *(your docs URL if applicable)* |
| Topics | `ai` `agents` `orchestration` `design-system` `open-source` `claude-code` |

### GitHub Issue Labels

Create these branded labels using the Aioli palette:

```bash
# Claude Code prompt:
# "Create GitHub issue labels for the Aioli project using these colors:"

# Label name          | Color   | Description
# agent:writer        | 5ae6a2  | Related to the writer agent
# agent:editor        | 5ae6a2  | Related to the editor agent
# agent:reviewer      | 5ae6a2  | Related to the reviewer agent
# agent:orchestrator  | 5ae6a2  | Related to the orchestrator
# type:bug            | e84530  | Something isn't working
# type:feature        | 7b8fff  | New feature request
# type:docs           | f0c050  | Documentation updates
# type:brand          | d4a853  | Brand and design assets
# priority:high       | e84530  | High priority
# priority:low        | 555555  | Low priority
# good first issue    | 5ae6a2  | Good for newcomers
```

---

## Step 4: Generate Raster Assets

For contexts that need PNG (Slack, Discord, social media, etc.):

```bash
# Claude Code prompt:
# "Generate PNG versions of all Aioli logo SVGs at 1x, 2x, and 4x resolution.
#  Save them to docs/brand/assets/png/ with size suffixes like:
#  aioli-icon-green-64.png, aioli-icon-green-128.png, aioli-icon-green-256.png"
```

Recommended raster sizes:
| Asset | 1x | 2x | 4x |
|-------|----|----|-----|
| Icon | 64px | 128px | 256px |
| Full lockup | 460px | 920px | 1840px |
| Banner | 1280px | — | — |
| Favicon | 32px | 64px | — |

---

## Step 5: Documentation Site (Optional)

If setting up a docs site (Docusaurus, VitePress, etc.), use these CSS variables:

```css
/* Add to your docs theme */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap');

:root {
  --aioli-green: #5ae6a2;
  --aioli-green-deep: #0e8a56;
  --aioli-void: #0e0e12;
  --aioli-carbon: #1a1a1f;
  --aioli-parchment: #e8e6e1;
  --aioli-font-display: 'Outfit', sans-serif;
  --aioli-font-mono: 'JetBrains Mono', monospace;
}

/* Dark theme */
[data-theme='dark'] {
  --ifm-color-primary: var(--aioli-green);
  --ifm-background-color: var(--aioli-void);
  --ifm-font-family-base: var(--aioli-font-display);
  --ifm-font-family-monospace: var(--aioli-font-mono);
}
```

---

## Step 6: NPM Package Branding (If Publishing)

```json
{
  "name": "aioli",
  "description": "Open source AI agent orchestration design system",
  "keywords": ["ai", "agents", "orchestration", "design-system", "open-source"],
  "author": "Aioli Contributors",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/aioli"
  }
}
```

---

## Claude Code Quick Commands

Copy-paste these into Claude Code sessions as needed:

### "Set up the brand from scratch"
```
Read the brand guidelines at docs/brand/BRAND-GUIDELINES.md and ensure all brand assets 
are properly integrated. Check that the README uses the banner, CSS variables are defined, 
and the CLAUDE.md includes brand context.
```

### "Create a new branded document"
```
Create a new markdown document following the Aioli brand voice: technical but approachable, 
open source community spirit, culinary metaphors welcome. Use "Aioli" (capital A) 
consistently. Reference the brand guidelines at docs/brand/BRAND-GUIDELINES.md for colors 
and typography.
```

### "Review brand consistency"
```
Audit the project for brand consistency. Check:
1. All references use "Aioli" (not "aioli" or "AIOLI")  
2. Color values match the brand palette (#5ae6a2, #0e8a56, #0e0e12, #e8e6e1)
3. Font references use Outfit and JetBrains Mono
4. Terminology uses "agents" not "bots", "orchestration" not "management"
5. Logo files exist in docs/brand/assets/svg/
```

### "Generate a component in brand style"
```
Build this component using the Aioli design system:
- Colors: use --aioli-green (#5ae6a2) as primary, --aioli-void (#0e0e12) as background
- Fonts: Outfit for UI text, JetBrains Mono for code/labels
- Style: dark-first, minimal, technical but warm
- Badges/tags: use the 10% green background with 15% green border pattern
```

---

*This guide is part of the Aioli brand package. MIT licensed.*
