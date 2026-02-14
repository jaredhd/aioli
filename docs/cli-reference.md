# CLI Reference

## Global Options

```
aioli --version    Show version number
aioli --help       Show help
aioli <cmd> --help Show command-specific help
```

---

## aioli init

Initialize a new Aioli project.

```
aioli init [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-t, --template <name>` | Use a template: `minimal`, `starter`, `full` | (interactive) |
| `-d, --dir <path>` | Target directory | `.` |
| `--no-install` | Skip npm install after scaffolding | |

**Templates:**

| Template | Description |
|----------|-------------|
| `minimal` | Primitives + semantic tokens only |
| `starter` | Primitives + semantic + dark mode + button, input, card, form-field, badge, modal |
| `full` | All tokens including all 23 component files |

**Examples:**

```bash
aioli init --template starter
aioli init --template full --dir ./my-design-system
aioli init  # interactive mode
```

---

## aioli build

Build tokens into CSS and JSON output using Style Dictionary.

```
aioli build [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-c, --config <path>` | Path to Style Dictionary config | `config.js` |
| `-w, --watch` | Watch for changes | |

**Examples:**

```bash
aioli build
aioli build --config custom-config.js
```

**Exit codes:** 0 on success, 1 on build failure.

---

## aioli validate

Validate DTCG token files for structural correctness.

```
aioli validate [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--tokens-dir <path>` | Path to tokens directory | `./tokens` |

**What it checks:**
- Every token has a `$value` field
- `$type` values are valid DTCG types
- References use correct `{path.to.token}` format
- Referenced tokens exist (no broken references)
- No circular reference chains

**Examples:**

```bash
aioli validate
aioli validate --tokens-dir ./design-tokens
```

**Exit codes:** 0 if all tokens valid, 1 if errors found.

---

## aioli generate

Generate a component from a natural language description.

```
aioli generate <description> [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--tokens-dir <path>` | Path to tokens directory | `./tokens` |
| `--format <format>` | Output format: `html`, `json` | `html` |
| `-o, --output <path>` | Write output to file | (stdout) |
| `--ai` | Use AI-powered generation | |
| `--api-key <key>` | Anthropic API key | `$ANTHROPIC_API_KEY` |

**Supported components (template-based):**
button, input, card, modal, navigation, form group, search field, badge, alert, table, accordion, tabs, dropdown, toast, tooltip, avatar, checkbox, radio, select, textarea, toggle, spinner, skeleton, divider

**Examples:**

```bash
aioli generate "primary button"
aioli generate "large danger button with icon" --format json
aioli generate "search field with label" -o components/search.html
aioli generate --ai "responsive pricing table" --api-key sk-ant-...
```

---

## aioli audit

Run accessibility audit on design tokens.

```
aioli audit [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--tokens-dir <path>` | Path to tokens directory | `./tokens` |
| `--level <level>` | WCAG level: `AA` or `AAA` | `AA` |
| `--report <path>` | Save JSON report to file | |

**What it checks:**
- Color contrast ratios between foreground/background token pairs
- WCAG AA: 4.5:1 for normal text, 3:1 for large text and UI components
- WCAG AAA: 7:1 for normal text, 4.5:1 for large text
- Token structural validity

**Examples:**

```bash
aioli audit
aioli audit --level AAA
aioli audit --report reports/a11y-audit.json
```

**Exit codes:** 0 if all checks pass, 1 if failures found.

---

## aioli export

Export tokens in different formats.

```
aioli export [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--format <format>` | Output format: `css`, `json`, `scss` | `css` |
| `--tokens-dir <path>` | Path to tokens directory | `./tokens` |
| `-o, --output <path>` | Output file path | (stdout) |

**Examples:**

```bash
aioli export --format css -o dist/tokens.css
aioli export --format scss -o styles/_tokens.scss
aioli export --format json -o dist/tokens.json
aioli export --format css  # prints to stdout
```

---

## Environment Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | `generate --ai` | Anthropic API key for AI-powered generation |
| `DEBUG` | All commands | Set to any value to show stack traces on error |
