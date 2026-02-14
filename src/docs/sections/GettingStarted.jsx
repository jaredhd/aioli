import React from 'react';
import CodeBlock from '../components/CodeBlock';

export default function GettingStarted() {
  return (
    <section id="getting-started" className="docs-section">
      <h2 className="docs-section__title">Getting Started</h2>

      {/* ------------------------------------------------------------------ */}
      {/* Prerequisites                                                      */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Prerequisites</h3>
      <ul className="docs-section__list">
        <li>Node.js &gt;= 18.0.0</li>
        <li>npm or yarn</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* Installation                                                       */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Installation</h3>
      <p className="docs-section__text">
        Aioli can be installed globally for CLI usage, or locally for
        programmatic access in your project.
      </p>
      <CodeBlock
        language="bash"
        title="Global install (CLI)"
        code="npm install -g aioli-design"
      />
      <CodeBlock
        language="bash"
        title="Local install (programmatic)"
        code="npm install aioli-design"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Initialize a Project                                               */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Initialize a Project</h3>
      <p className="docs-section__text">
        Aioli ships three project templates so you can choose the right starting
        point for your design system.
      </p>

      <table className="docs-table">
        <thead>
          <tr>
            <th>Template</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>minimal</code></td>
            <td>Primitives + semantic tokens only</td>
          </tr>
          <tr>
            <td><code>starter</code></td>
            <td>Primitives + semantic + dark mode + button, input, card, form-field, badge, modal (recommended)</td>
          </tr>
          <tr>
            <td><code>full</code></td>
            <td>All tokens including all 23 component token files</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        language="bash"
        title="Template mode (quick start)"
        code={`# Starter: primitives + semantic + common components (recommended)
aioli init --template starter

# Minimal: just primitive and semantic tokens
aioli init --template minimal

# Full: all 23 component token files
aioli init --template full`}
      />

      <p className="docs-section__text">
        You can also run <code>aioli init</code> without flags for interactive
        mode, which walks you through prompts to choose a project name, preset
        or custom configuration, dark mode inclusion, and component token
        selection.
      </p>
      <CodeBlock
        language="bash"
        title="Interactive mode"
        code="aioli init"
      />

      {/* ------------------------------------------------------------------ */}
      {/* What Gets Created                                                  */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">What Gets Created</h3>
      <p className="docs-section__text">
        After initialization, your project directory will contain the following
        structure:
      </p>
      <CodeBlock
        language="text"
        title="Project structure"
        code={`your-project/
  tokens/
    primitives/     # Color, spacing, typography, radius, motion scales
    semantic/       # Intent-based tokens (primary, success, danger)
    components/     # Component-scoped tokens (button, card, input, etc.)
  config.js         # Style Dictionary build configuration
  .env.example      # API key placeholder
  dist/             # Build output directory`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Build                                                              */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Build Tokens</h3>
      <p className="docs-section__text">
        The <code>build</code> command runs Style Dictionary to transform your
        DTCG tokens into consumable formats.
      </p>
      <CodeBlock language="bash" code="aioli build" />
      <p className="docs-section__text">This generates:</p>
      <ul className="docs-section__list">
        <li><code>dist/css/tokens.css</code> &mdash; CSS custom properties</li>
        <li><code>dist/tokens.json</code> &mdash; Nested JSON for programmatic access</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* Validate                                                           */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Validate Tokens</h3>
      <p className="docs-section__text">
        Validate all token files for DTCG structural correctness, reference
        integrity, and type safety.
      </p>
      <CodeBlock language="bash" code="aioli validate" />
      <p className="docs-section__text">Checks for:</p>
      <ul className="docs-section__list">
        <li>Valid DTCG structure (<code>$value</code>, <code>$type</code> fields)</li>
        <li>Correct reference format (<code>{'{primitive.color.blue.500}'}</code>)</li>
        <li>Broken or circular references</li>
        <li>Unknown <code>$type</code> values</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* Generate                                                           */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Generate a Component</h3>
      <p className="docs-section__text">
        Generate components from natural language descriptions. Template-based
        generation works out of the box; AI-powered generation requires an
        Anthropic API key.
      </p>
      <CodeBlock
        language="bash"
        title="Component generation"
        code={`# Template-based (no API key needed)
aioli generate "large primary button with icon"

# AI-powered (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=your-key
aioli generate --ai "responsive pricing table"`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Audit                                                              */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Run Accessibility Audit</h3>
      <p className="docs-section__text">
        Audit your design tokens for WCAG compliance, checking color contrast
        ratios and other accessibility requirements.
      </p>
      <CodeBlock
        language="bash"
        title="Accessibility audit"
        code={`# WCAG AA audit
aioli audit

# WCAG AAA audit
aioli audit --level AAA

# Save report to file
aioli audit --report reports/a11y.json`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Export                                                              */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Export Tokens</h3>
      <p className="docs-section__text">
        Export tokens in CSS, JSON, or SCSS format for consumption in any
        project.
      </p>
      <CodeBlock
        language="bash"
        title="Token export"
        code={`# CSS custom properties (default)
aioli export --format css -o dist/tokens.css

# JSON
aioli export --format json -o dist/tokens.json

# SCSS variables
aioli export --format scss -o dist/_tokens.scss

# Pipe to stdout
aioli export --format css`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Programmatic Usage                                                 */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Programmatic Usage</h3>
      <p className="docs-section__text">
        Aioli can be used as a library in Node.js. The <code>createAgentSystem</code>{' '}
        function initializes all six agents and the orchestrator.
      </p>
      <CodeBlock
        language="js"
        title="Programmatic usage"
        code={`import { createAgentSystem } from 'aioli-design';

const agents = createAgentSystem('./tokens');

// Access individual agents
agents.token        // Design Token Agent
agents.a11y         // Accessibility Validator
agents.motion       // Motion Agent
agents.component    // Component Generator
agents.codeReview   // Code Review Agent
agents.orchestrator // Orchestrator`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Next Steps                                                         */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Next Steps</h3>
      <ul className="docs-section__list">
        <li>
          <a href="#token-architecture">Token Architecture</a> &mdash; How the
          3-tier token system works
        </li>
        <li>
          <a href="#cli">CLI Reference</a> &mdash; Detailed command
          documentation
        </li>
        <li>
          <a href="#agents">Agent System</a> &mdash; How agents orchestrate
          validation and generation
        </li>
        <li>
          <a href="#theming">Theming API</a> &mdash; Runtime theme customization
        </li>
        <li>
          <a href="#accessibility">Accessibility</a> &mdash; WCAG compliance
          standards and audit results
        </li>
        <li>
          <a href="#motion">Motion Standards</a> &mdash; Animation and
          transition guidelines
        </li>
      </ul>
    </section>
  );
}
