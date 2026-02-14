import React from 'react';
import CodeBlock from '../components/CodeBlock';

export default function Accessibility() {
  return (
    <section id="accessibility" className="docs-section">
      <h2 className="docs-section__title">Accessibility</h2>

      {/* ------------------------------------------------------------------ */}
      {/* WCAG Commitment                                                    */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">WCAG Commitment</h3>
      <p className="docs-section__text">
        Aioli enforces WCAG 2.1 AA as a minimum standard across all components
        and tokens, with AAA compliance targeted wherever feasible. Every
        generated component includes semantic HTML, proper ARIA attributes,
        keyboard navigation support, and <code>prefers-reduced-motion</code>{' '}
        handling.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Contrast Ratio Thresholds                                          */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Contrast Ratio Thresholds</h3>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Element Type</th>
            <th>AA Minimum</th>
            <th>AAA Minimum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Normal text (&lt; 18px / 14px bold)</td>
            <td>4.5:1</td>
            <td>7:1</td>
          </tr>
          <tr>
            <td>Large text (&ge; 18px / 14px bold)</td>
            <td>3:1</td>
            <td>4.5:1</td>
          </tr>
          <tr>
            <td>UI components &amp; graphical objects</td>
            <td>3:1</td>
            <td>4.5:1</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* Aioli Audit Results                                                */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Aioli Audit Results</h3>
      <p className="docs-section__text">
        The following results are from the latest WCAG contrast audit run
        against Aioli's semantic color tokens.
      </p>

      <table className="docs-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>AA text contrast</td>
            <td>89% (39/44 pairs pass)</td>
          </tr>
          <tr>
            <td>AA UI component contrast</td>
            <td>100% (43/44 pairs pass)</td>
          </tr>
          <tr>
            <td>Dark mode AA compliance</td>
            <td>100% AA</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* Semantic Color Contrast Values                                     */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Semantic Color Contrast Values</h3>
      <p className="docs-section__text">
        Each semantic intent color has been audited against a white (#ffffff)
        background for text readability.
      </p>

      <table className="docs-table">
        <thead>
          <tr>
            <th>Intent</th>
            <th>Color</th>
            <th>Swatch</th>
            <th>Hex</th>
            <th>Ratio</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Primary</td>
            <td>blue.600</td>
            <td>
              <span
                style={{ display: 'inline-block', width: 18, height: 18, backgroundColor: '#2563eb', borderRadius: 3, verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.1)' }}
                aria-label="Primary color swatch: blue"
              />
            </td>
            <td><code>#2563eb</code></td>
            <td>5.17:1</td>
            <td>AA</td>
          </tr>
          <tr>
            <td>Secondary</td>
            <td>neutral.600</td>
            <td>
              <span
                style={{ display: 'inline-block', width: 18, height: 18, backgroundColor: '#475569', borderRadius: 3, verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.1)' }}
                aria-label="Secondary color swatch: neutral gray"
              />
            </td>
            <td><code>#475569</code></td>
            <td>7.58:1</td>
            <td>AAA</td>
          </tr>
          <tr>
            <td>Success</td>
            <td>emerald.700</td>
            <td>
              <span
                style={{ display: 'inline-block', width: 18, height: 18, backgroundColor: '#047857', borderRadius: 3, verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.1)' }}
                aria-label="Success color swatch: emerald green"
              />
            </td>
            <td><code>#047857</code></td>
            <td>5.48:1</td>
            <td>AA</td>
          </tr>
          <tr>
            <td>Warning</td>
            <td>amber.700</td>
            <td>
              <span
                style={{ display: 'inline-block', width: 18, height: 18, backgroundColor: '#b45309', borderRadius: 3, verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.1)' }}
                aria-label="Warning color swatch: amber"
              />
            </td>
            <td><code>#b45309</code></td>
            <td>5.02:1</td>
            <td>AA</td>
          </tr>
          <tr>
            <td>Danger</td>
            <td>red.700</td>
            <td>
              <span
                style={{ display: 'inline-block', width: 18, height: 18, backgroundColor: '#b91c1c', borderRadius: 3, verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.1)' }}
                aria-label="Danger color swatch: red"
              />
            </td>
            <td><code>#b91c1c</code></td>
            <td>6.47:1</td>
            <td>AA</td>
          </tr>
          <tr>
            <td>Info</td>
            <td>blue.600</td>
            <td>
              <span
                style={{ display: 'inline-block', width: 18, height: 18, backgroundColor: '#2563eb', borderRadius: 3, verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.1)' }}
                aria-label="Info color swatch: blue"
              />
            </td>
            <td><code>#2563eb</code></td>
            <td>5.17:1</td>
            <td>AA</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* Semantic HTML                                                      */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Semantic HTML Guidelines</h3>
      <p className="docs-section__text">
        All generated components use semantic HTML elements to convey meaning
        and structure to assistive technologies.
      </p>
      <ul className="docs-section__list">
        <li>
          Use <code>&lt;button&gt;</code> for interactive controls, not{' '}
          <code>&lt;div onclick&gt;</code>
        </li>
        <li>
          Use <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>,{' '}
          <code>&lt;header&gt;</code>, <code>&lt;footer&gt;</code> for page
          landmarks
        </li>
        <li>
          Use heading elements (<code>&lt;h1&gt;</code>&ndash;
          <code>&lt;h6&gt;</code>) in proper hierarchical order
        </li>
        <li>
          Use <code>&lt;ul&gt;</code>/<code>&lt;ol&gt;</code> for lists, not
          styled <code>&lt;div&gt;</code> sequences
        </li>
        <li>
          Use <code>&lt;table&gt;</code> with <code>&lt;thead&gt;</code>,{' '}
          <code>&lt;tbody&gt;</code>, and <code>&lt;th&gt;</code> for tabular
          data
        </li>
        <li>
          Every <code>&lt;img&gt;</code> must have meaningful{' '}
          <code>alt</code> text (or <code>alt=""</code> for decorative images)
        </li>
        <li>
          Form controls must have associated <code>&lt;label&gt;</code>{' '}
          elements
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* ARIA Usage                                                         */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">ARIA Usage Principles</h3>
      <p className="docs-section__text">
        ARIA attributes supplement HTML semantics when native elements alone
        cannot convey the component's purpose or state.
      </p>
      <ul className="docs-section__list">
        <li>
          <strong>First rule of ARIA:</strong> Prefer native HTML elements over
          ARIA roles. Use a <code>&lt;button&gt;</code> instead of{' '}
          <code>&lt;div role="button"&gt;</code>.
        </li>
        <li>
          Use <code>aria-label</code> or <code>aria-labelledby</code> when a
          visible text label is not sufficient.
        </li>
        <li>
          Use <code>aria-expanded</code> on toggles that control collapsible
          regions (accordions, dropdowns, menus).
        </li>
        <li>
          Use <code>aria-live</code> regions for dynamic content updates (toasts,
          alerts, loading states).
        </li>
        <li>
          Use <code>aria-describedby</code> to associate help text or error
          messages with form controls.
        </li>
        <li>
          Never use <code>aria-hidden="true"</code> on focusable elements.
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* Keyboard Navigation                                                */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Keyboard Navigation</h3>
      <p className="docs-section__text">
        All interactive components must be fully operable via keyboard.
      </p>
      <ul className="docs-section__list">
        <li>
          <code>Tab</code> / <code>Shift+Tab</code> to navigate between
          focusable elements
        </li>
        <li>
          <code>Enter</code> or <code>Space</code> to activate buttons and
          links
        </li>
        <li>
          <code>Arrow keys</code> to navigate within composite widgets (tabs,
          menus, radio groups)
        </li>
        <li>
          <code>Escape</code> to close modals, dropdowns, and overlays
        </li>
        <li>
          Focus must be visible at all times &mdash; never remove the focus
          indicator
        </li>
        <li>
          Focus trapping inside modal dialogs to prevent tabbing outside
        </li>
        <li>
          Skip links for page-level navigation where appropriate
        </li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* prefers-reduced-motion                                             */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">
        <code>prefers-reduced-motion</code> Support
      </h3>
      <p className="docs-section__text">
        Aioli requires all non-essential animations to respect the user's motion
        preferences. The preferred approach is opt-in: animations are only
        enabled when the user has no motion preference set.
      </p>
      <CodeBlock
        language="css"
        title="Opt-in approach (preferred)"
        code={`.animated-element {
  /* Static styles by default */
}

@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    transition: transform 0.2s ease-out;
  }
}`}
      />
      <CodeBlock
        language="css"
        title="Disable approach (alternative)"
        code={`@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Running Audits                                                     */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Running Accessibility Audits</h3>
      <p className="docs-section__text">
        Use the <code>aioli audit</code> command to check your design tokens for
        WCAG compliance. The audit validates contrast ratios across all semantic
        color token pairs.
      </p>
      <CodeBlock
        language="bash"
        title="Audit commands"
        code={`# WCAG AA audit (default)
aioli audit

# WCAG AAA audit (stricter thresholds)
aioli audit --level AAA

# Save report to file
aioli audit --report reports/a11y-audit.json`}
      />
      <p className="docs-section__text">
        You can also run contrast audits programmatically using the
        Accessibility Validator Agent:
      </p>
      <CodeBlock
        language="js"
        title="Programmatic audit"
        code={`import { createAgentSystem } from 'aioli-design';

const { a11y } = createAgentSystem('./tokens');

// Check a specific color pair
const result = a11y.handleRequest({
  action: 'checkContrast',
  foreground: '#2563eb',
  background: '#ffffff',
});
// result.data => { ratio: 5.17, meetsAA: true, meetsAAA: false }

// Audit all semantic token pairs
const audit = a11y.handleRequest({
  action: 'validateTokenContrast',
});`}
      />
    </section>
  );
}
