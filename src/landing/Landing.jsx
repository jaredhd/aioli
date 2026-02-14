/**
 * Aioli Design System -- Landing Page
 *
 * The public-facing home page for the Aioli Design System. Replaces the
 * StudioWired IDE as the default entry point. Showcases the three-layer
 * architecture, token stats, built-in components, and quick-start guides.
 *
 * Follows the same dark-mode toggle pattern as Demo.jsx and Docs.jsx:
 *   document.documentElement.dataset.theme = 'dark' | delete
 *
 * Uses BEM naming throughout with the `.landing-` prefix.
 */

import React, { useState, useCallback } from 'react';
import { COMPONENT_TEMPLATES } from '../../agents/component-generator-agent.js';
import CodeBlock from '../docs/components/CodeBlock';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Components to render in the live preview section. */
const PREVIEW_COMPONENTS = ['button', 'card', 'alert', 'badge', 'input', 'tabs'];

/** Feature cards for the features grid. */
const FEATURES = [
  {
    icon: '\uD83C\uDFA8',
    title: 'Design Tokens',
    desc: '1,258 tokens in W3C DTCG format across three tiers: primitives, semantic, and component-scoped. Build to CSS, JSON, or SCSS.',
  },
  {
    icon: '\uD83E\uDD16',
    title: 'AI Agents',
    desc: '6 specialized agents handle token management, accessibility validation, motion standards, component generation, code review, and orchestration.',
  },
  {
    icon: '\u267F',
    title: 'Accessibility',
    desc: 'WCAG 2.1 AA enforced by default. Automated contrast auditing, semantic HTML validation, ARIA checks, and fix suggestions.',
  },
  {
    icon: '\uD83E\uDDE9',
    title: 'Components',
    desc: '31 production-ready components following Atomic Design. 15 atoms, 10 molecules, 4 organisms \u2014 all keyboard accessible.',
  },
  {
    icon: '\u2328\uFE0F',
    title: 'CLI',
    desc: '6 commands: init, build, validate, generate, audit, export. Generate components from natural language descriptions.',
  },
  {
    icon: '\uD83C\uDFAD',
    title: 'Theming',
    desc: 'Runtime theme overrides via CSS custom properties. Built-in dark mode with createDarkTheme(). Token-to-CSS variable mapping.',
  },
];

/** Stats shown in the hero ribbon. */
const HERO_STATS = [
  { value: '1,258', label: 'Design Tokens' },
  { value: '31', label: 'Components' },
  { value: '6', label: 'AI Agents' },
  { value: 'AA', label: 'WCAG Compliant' },
];

/** Architecture layers for the diagram. */
const ARCHITECTURE_LAYERS = [
  {
    title: 'Tokens',
    desc: '3-tier DTCG tokens: primitives \u2192 semantic \u2192 component',
  },
  {
    title: 'Agents',
    desc: '6 AI agents: token, a11y, motion, component, code review, orchestrator',
  },
  {
    title: 'Output',
    desc: 'CSS, JSON, SCSS, HTML \u2014 production-ready artifacts',
  },
];

// ---------------------------------------------------------------------------
// Quick-start code snippets
// ---------------------------------------------------------------------------

const CLI_SNIPPET = `# Install globally
npm install -g aioli

# Initialize a new project
aioli init --template starter

# Generate a component
aioli generate "primary button with icon"

# Run accessibility audit
aioli audit`;

const API_SNIPPET = `import { createAgentSystem } from 'aioli-design';

const agents = createAgentSystem('./tokens');

// Generate from natural language
const btn = agents.component.generateFromDescription(
  'large danger button with icon'
);

// Check accessibility
const contrast = agents.a11y.checkContrast(
  '#ffffff', '#2563eb'
);
console.log(contrast.ratio); // 5.17`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default props so every template renders without "undefined" labels. */
const COMPONENT_DEFAULTS = {
  button:  { children: 'Button' },
  card:    { title: 'Card Title', content: 'Card body text goes here.' },
  alert:   {},
  badge:   { children: 'Badge' },
  input:   { label: 'Label', placeholder: 'Placeholder…' },
  tabs:    {},
};

/**
 * Safely render a component from COMPONENT_TEMPLATES.
 * The template is always a function that returns { html, tokens, a11y }.
 */
function renderComponent(name) {
  const tmpl = COMPONENT_TEMPLATES[name];
  if (!tmpl) return null;

  try {
    const defaults = COMPONENT_DEFAULTS[name] || {};
    const result = typeof tmpl.template === 'function'
      ? tmpl.template(defaults)
      : { html: tmpl.template || '' };
    const html = result.html || result;

    return (
      <div key={name} className="landing-preview__item">
        <div className="landing-preview__label">{name}</div>
        <div
          className="landing-preview__render"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main Landing component
// ---------------------------------------------------------------------------

export default function Landing() {
  // -- State ----------------------------------------------------------------

  const [darkMode, setDarkMode] = useState(false);
  const [installCopied, setInstallCopied] = useState(false);

  // -- Dark mode toggle (same pattern as Demo.jsx / Docs.jsx) ---------------

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.dataset.theme = 'dark';
      } else {
        delete document.documentElement.dataset.theme;
      }
      return next;
    });
  }, []);

  // -- Copy install command to clipboard ------------------------------------

  const handleCopyInstall = useCallback(() => {
    navigator.clipboard.writeText('npm install aioli-design').then(() => {
      setInstallCopied(true);
      setTimeout(() => setInstallCopied(false), 2000);
    });
  }, []);

  // -- Render ---------------------------------------------------------------

  return (
    <div className="landing-page">

      {/* =================================================================== */}
      {/* HEADER (sticky)                                                     */}
      {/* =================================================================== */}
      <header className="landing-header">
        <a href="./" className="landing-header__logo">
          <span role="img" aria-label="garlic">&#x1F9C4;</span> Aioli
        </a>

        <nav className="landing-header__nav" aria-label="Main navigation">
          <a href="docs.html" className="landing-header__nav-link">
            Documentation
          </a>
          <a href="demo.html" className="landing-header__nav-link">
            Gallery
          </a>
          <a
            href="https://github.com/jaredhd/aioli"
            className="landing-header__nav-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>

        <button
          type="button"
          className="landing-header__toggle"
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </button>
      </header>

      {/* =================================================================== */}
      {/* HERO                                                                */}
      {/* =================================================================== */}
      <section className="landing-hero">
        <h1 className="landing-hero__title">AI-Native Design System</h1>

        <p className="landing-hero__subtitle">
          Build accessible, token-driven websites with 6 AI agents that enforce
          WCAG standards, manage design tokens, and generate production-ready
          components from natural language.
        </p>

        {/* -- Install command block ---------------------------------------- */}
        <div className="landing-hero__install">
          <code className="landing-hero__install-code">npm install aioli-design</code>
          <button
            type="button"
            className="landing-hero__install-copy"
            onClick={handleCopyInstall}
            aria-label="Copy install command"
          >
            {installCopied ? '\u2713 Copied' : 'Copy'}
          </button>
        </div>

        {/* -- CTA buttons ------------------------------------------------- */}
        <div className="landing-hero__actions">
          <a href="docs.html" className="landing-hero__cta landing-hero__cta--primary">
            Read the Docs &rarr;
          </a>
          <a href="demo.html" className="landing-hero__cta landing-hero__cta--outline">
            Component Gallery &rarr;
          </a>
        </div>

        {/* -- Stats ribbon ------------------------------------------------ */}
        <div className="landing-hero__stats">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="landing-hero__stat">
              <span className="landing-hero__stat-value">{stat.value}</span>
              <span className="landing-hero__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* FEATURES GRID                                                       */}
      {/* =================================================================== */}
      <section className="landing-features">
        <h2 className="landing-features__heading">Everything You Need</h2>

        <div className="landing-features__grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="landing-feature-card">
              <span className="landing-feature-card__icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="landing-feature-card__title">{feature.title}</h3>
              <p className="landing-feature-card__desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* LIVE COMPONENT PREVIEW                                              */}
      {/* =================================================================== */}
      <section className="landing-preview">
        <h2 className="landing-preview__heading">Built-In Components</h2>
        <p className="landing-preview__subtitle">
          Every component uses Aioli&apos;s own design tokens and passes WCAG AA
          accessibility standards.
        </p>

        <div className="landing-preview__grid">
          {PREVIEW_COMPONENTS.map((name) => renderComponent(name))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* ARCHITECTURE DIAGRAM                                                */}
      {/* =================================================================== */}
      <section className="landing-architecture">
        <h2 className="landing-architecture__heading">Three-Layer Architecture</h2>

        <div className="landing-architecture__layers">
          {ARCHITECTURE_LAYERS.map((layer, i) => (
            <React.Fragment key={layer.title}>
              {i > 0 && (
                <div className="landing-architecture__arrow" aria-hidden="true">
                  &rarr;
                </div>
              )}
              <div className="landing-architecture__layer">
                <h3 className="landing-architecture__layer-title">{layer.title}</h3>
                <p className="landing-architecture__layer-desc">{layer.desc}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* QUICK START                                                         */}
      {/* =================================================================== */}
      <section className="landing-quickstart">
        <h2 className="landing-quickstart__heading">Get Started in Seconds</h2>

        <div className="landing-quickstart__grid">
          <CodeBlock code={CLI_SNIPPET} language="bash" title="CLI" />
          <CodeBlock code={API_SNIPPET} language="js" title="Programmatic API" />
        </div>
      </section>

      {/* =================================================================== */}
      {/* FOOTER                                                              */}
      {/* =================================================================== */}
      <footer className="landing-footer">
        <div className="landing-footer__links">
          <a href="docs.html" className="landing-footer__link">Documentation</a>
          <a href="demo.html" className="landing-footer__link">Component Gallery</a>
          <a
            href="https://github.com/jaredhd/aioli"
            className="landing-footer__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/aioli-design"
            className="landing-footer__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            npm
          </a>
        </div>

        <p className="landing-footer__copy">
          MIT License &mdash; Built with Aioli&apos;s own design tokens
        </p>
      </footer>
    </div>
  );
}
