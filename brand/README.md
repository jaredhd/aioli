<p align="center">
  <img src="assets/svg/aioli-github-banner.svg" alt="Aioli" width="100%" />
</p>

<p align="center">
  <strong>Open source AI agent orchestration design system</strong>
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a> •
  <a href="#what-is-aioli">What is Aioli?</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#agents">Agents</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-5ae6a2?style=flat-square&labelColor=0e0e12" alt="MIT License" />
  <img src="https://img.shields.io/badge/built_with-Claude_Code-5ae6a2?style=flat-square&labelColor=0e0e12" alt="Built with Claude Code" />
  <img src="https://img.shields.io/badge/status-alpha-f0c050?style=flat-square&labelColor=0e0e12" alt="Status: Alpha" />
</p>

---

## What is Aioli?

**Aioli** is an open source AI agent orchestration design system — a framework for coordinating multiple specialized AI agents into cohesive workflows. Like its namesake condiment (an emulsion of garlic, oil, and egg yolk), Aioli blends discrete AI ingredients into something greater than the sum of its parts.

**Good AI should be free.**

### Core Principles

- **Orchestration over isolation** — Agents work together, not alone
- **Open by default** — MIT licensed, community-driven
- **Design-system thinking** — Consistent patterns, reusable components, clear taxonomy
- **Human in the loop** — Draft-and-approve workflows keep humans in control

## Quickstart

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/aioli.git
cd aioli

# Install dependencies
npm install

# Run the orchestrator
npm run start
```

## Architecture

```
aioli/
├── agents/              # Agent definitions and personas
│   ├── writer/          # Creative writing agent
│   ├── editor/          # Developmental editing agent
│   ├── reviewer/        # Review and feedback agent
│   └── orchestrator/    # Meta-agent that coordinates others
├── workflows/           # Predefined multi-agent workflows
├── config/              # System configuration
├── docs/                # Documentation
│   └── brand/           # Brand assets and guidelines
└── src/                 # Core orchestration engine
```

## Agents

| Agent | Role | Status |
|-------|------|--------|
| `orchestrator` | Coordinates agent workflows and routing | 🟢 Active |
| `writer` | Creative writing and drafting | 🟢 Active |
| `editor` | Developmental and line editing | 🟡 In Progress |
| `reviewer` | Quality review and feedback | 🟡 In Progress |
| `researcher` | World-building and fact verification | 🔴 Planned |

## Contributing

Aioli is open source and contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork the repo, create a branch
git checkout -b feature/your-feature

# Make changes, commit
git commit -m "feat: add your feature"

# Push and open a PR
git push origin feature/your-feature
```

## Brand Assets

Logo assets are available in `docs/brand/assets/`:

| File | Use |
|------|-----|
| `aioli-logo-dark.svg` | Primary logo for dark backgrounds |
| `aioli-logo-light.svg` | Logo for light backgrounds |
| `aioli-icon-green.svg` | Icon-only mark |
| `aioli-icon-mono-white.svg` | Monochrome for single-color contexts |
| `aioli-github-banner.svg` | Social preview / banner |

See the [Brand Guidelines](docs/brand/BRAND-GUIDELINES.md) for full usage rules.

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <img src="assets/svg/aioli-icon-green.svg" alt="Aioli" width="32" />
  <br />
  <sub>Built with 🧄 by the Aioli community</sub>
</p>
