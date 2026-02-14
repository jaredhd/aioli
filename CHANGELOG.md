# Changelog

All notable changes to the Aioli Design System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-02-14

### Added
- Landing page with hero section, feature highlights, live component previews, architecture diagram, and quick start code snippets
- GitHub Actions CI workflow (Node 18/20/22 matrix) for automated testing on push/PR
- GitHub Actions npm publish workflow triggered on GitHub Release creation
- GitHub Actions GitHub Pages deployment workflow for the static site
- CONTRIBUTING.md with development setup, project structure, and coding standards
- CODE_OF_CONDUCT.md (Contributor Covenant v2.1)
- Issue templates for bug reports and feature requests
- Pull request template with quality checklist
- .gitignore for standard Node.js project hygiene

### Changed
- `index.html` now serves the landing page instead of StudioWired IDE
- Vite build output separated to `dist-site/` for GitHub Pages deployment (tokens stay in `dist/`)
- README.md updated with CI/npm/license badges, live demo links, and contributing section
- `.npmignore` updated to exclude GitHub files, community docs, and site build output

## [0.1.0] - 2025-02-12

### Added

#### Design Tokens
- 1,258 design tokens in W3C DTCG format across three tiers:
  - **Primitives**: colors (14 families), spacing (0-96 scale), typography, radius, motion
  - **Semantic**: intent-based colors, surfaces, borders, text, shadows, focus, z-index, opacity
  - **Component**: 31 component-scoped token sets
- Dark mode token set with WCAG AA-compliant color mappings
- Token build pipeline via Style Dictionary v4 outputting CSS, JSON, and SCSS

#### CSS Component Library
- `css/aioli.css` single-import entry point for the full design system
- `css/base.css` with modern CSS reset, dark mode (`[data-theme="dark"]`), focus styles, `.visually-hidden` utility, and `prefers-reduced-motion` support
- 31 component CSS files in `css/components/`, individually importable:
  - **Atoms** (15): button, input, badge, avatar, spinner, link, chip, divider, skeleton, progress, tooltip, checkbox, radio, rating, toggle
  - **Molecules** (10): alert, tabs, accordion, dropdown, toast, breadcrumb, pagination, stepper, popover, form-group
  - **Organisms** (4): card, modal, table, navigation
  - **Form elements** (2): select, textarea
- All component styles use CSS custom properties exclusively (zero hardcoded values)
- BEM class naming convention matching generated HTML templates
- Full state coverage: `:hover`, `:focus-visible`, `:active`, `:disabled`, `[aria-disabled]`
- GPU-friendly animations (transform, opacity only) with reduced-motion fallbacks

#### Agent System
- 6 specialized AI agents with standardized `handleRequest()` protocol:
  - **Design Token Agent**: CRUD operations, resolution, validation, CSS/JSON export
  - **Accessibility Validator Agent**: WCAG contrast checks, HTML validation, ARIA audit, fix suggestions
  - **Motion Agent**: duration/easing generation, presets, stagger delays, CSS variable output
  - **Component Generator Agent**: 31 templates with natural language parsing
  - **Code Review Agent**: multi-category quality gate with scoring
  - **Orchestrator Agent**: agent coordination, fix routing, validation cycles
- `createAgentSystem()` factory for one-call agent initialization
- Agent communication protocol with fix routing and auto-fix support

#### Design Tool Integration
- `lib/kit.js` (`aioli/kit`) — high-level facade with `render()`, `catalog()`, `resolve()`, `validate()` methods
- `lib/theme.js` (`aioli/theme`) — runtime theming with `createTheme()`, `serializeTheme()`, `applyTheme()`, `createDarkTheme()`
- Token path to CSS variable conversion utilities

#### CLI
- `aioli init` — scaffold new projects (minimal/starter/full templates)
- `aioli build` — build tokens to CSS, JSON, SCSS
- `aioli validate` — validate all tokens
- `aioli generate <description>` — generate components from natural language
- `aioli audit` — accessibility audit
- `aioli export` — export tokens in various formats

#### Package & Types
- ES module package with granular exports (`./css`, `./css/components/*`, `./kit`, `./theme`, `./tokens`)
- TypeScript definitions for the full public API (`types/index.d.ts`)
- `style` field in package.json for CSS-aware bundlers

#### Quality
- WCAG 2.1 AA compliant semantic colors (89% AA text, 100% AA UI, 100% dark mode)
- Automated test suite with vitest (tokens, components, CSS validation)
- `scripts/contrast-audit.js` for WCAG contrast verification

### Accessibility
- All semantic intent colors pass WCAG AA contrast on their respective backgrounds
- Dark mode uses 400-weight shades on neutral.900, all passing AA
- Focus ring system using `--semantic-focus-ring-*` tokens
- `prefers-reduced-motion` globally disables animations
- All component templates include proper ARIA attributes and keyboard navigation
