import React from 'react';
import CodeBlock from '../components/CodeBlock';

export default function CLIReference() {
  return (
    <section id="cli" className="docs-section">
      <h2 className="docs-section__title">CLI Reference</h2>

      {/* ------------------------------------------------------------------ */}
      {/* Global Options                                                     */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Global Options</h3>
      <CodeBlock
        language="bash"
        title="Global flags"
        code={`aioli --version    # Show version number
aioli --help       # Show help
aioli <cmd> --help # Show command-specific help`}
      />

      {/* ================================================================== */}
      {/* aioli init                                                         */}
      {/* ================================================================== */}
      <h3 className="docs-section__subtitle">aioli init</h3>
      <p className="docs-section__text">
        Initialize a new Aioli project with design tokens and configuration.
      </p>
      <CodeBlock language="bash" code="aioli init [options]" />

      <table className="docs-table">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>-t, --template &lt;name&gt;</code></td>
            <td>Use a template: <code>minimal</code>, <code>starter</code>, <code>full</code></td>
            <td>(interactive)</td>
          </tr>
          <tr>
            <td><code>-d, --dir &lt;path&gt;</code></td>
            <td>Target directory</td>
            <td><code>.</code></td>
          </tr>
          <tr>
            <td><code>--no-install</code></td>
            <td>Skip npm install after scaffolding</td>
            <td>&mdash;</td>
          </tr>
        </tbody>
      </table>

      <p className="docs-section__text"><strong>Templates:</strong></p>
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
            <td>Primitives + semantic + dark mode + button, input, card, form-field, badge, modal</td>
          </tr>
          <tr>
            <td><code>full</code></td>
            <td>All tokens including all 23 component files</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        language="bash"
        title="Examples"
        code={`aioli init --template starter
aioli init --template full --dir ./my-design-system
aioli init  # interactive mode`}
      />

      {/* ================================================================== */}
      {/* aioli build                                                        */}
      {/* ================================================================== */}
      <h3 className="docs-section__subtitle">aioli build</h3>
      <p className="docs-section__text">
        Build tokens into CSS and JSON output using Style Dictionary.
      </p>
      <CodeBlock language="bash" code="aioli build [options]" />

      <table className="docs-table">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>-c, --config &lt;path&gt;</code></td>
            <td>Path to Style Dictionary config</td>
            <td><code>config.js</code></td>
          </tr>
          <tr>
            <td><code>-w, --watch</code></td>
            <td>Watch for changes</td>
            <td>&mdash;</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        language="bash"
        title="Examples"
        code={`aioli build
aioli build --config custom-config.js`}
      />
      <p className="docs-section__text">
        <strong>Exit codes:</strong> 0 on success, 1 on build failure.
      </p>

      {/* ================================================================== */}
      {/* aioli validate                                                     */}
      {/* ================================================================== */}
      <h3 className="docs-section__subtitle">aioli validate</h3>
      <p className="docs-section__text">
        Validate DTCG token files for structural correctness.
      </p>
      <CodeBlock language="bash" code="aioli validate [options]" />

      <table className="docs-table">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--tokens-dir &lt;path&gt;</code></td>
            <td>Path to tokens directory</td>
            <td><code>./tokens</code></td>
          </tr>
        </tbody>
      </table>

      <p className="docs-section__text"><strong>What it checks:</strong></p>
      <ul className="docs-section__list">
        <li>Every token has a <code>$value</code> field</li>
        <li><code>$type</code> values are valid DTCG types</li>
        <li>References use correct <code>{'{path.to.token}'}</code> format</li>
        <li>Referenced tokens exist (no broken references)</li>
        <li>No circular reference chains</li>
      </ul>

      <CodeBlock
        language="bash"
        title="Examples"
        code={`aioli validate
aioli validate --tokens-dir ./design-tokens`}
      />
      <p className="docs-section__text">
        <strong>Exit codes:</strong> 0 if all tokens valid, 1 if errors found.
      </p>

      {/* ================================================================== */}
      {/* aioli generate                                                     */}
      {/* ================================================================== */}
      <h3 className="docs-section__subtitle">aioli generate</h3>
      <p className="docs-section__text">
        Generate a component from a natural language description.
      </p>
      <CodeBlock language="bash" code="aioli generate <description> [options]" />

      <table className="docs-table">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--tokens-dir &lt;path&gt;</code></td>
            <td>Path to tokens directory</td>
            <td><code>./tokens</code></td>
          </tr>
          <tr>
            <td><code>--format &lt;format&gt;</code></td>
            <td>Output format: <code>html</code>, <code>json</code></td>
            <td><code>html</code></td>
          </tr>
          <tr>
            <td><code>-o, --output &lt;path&gt;</code></td>
            <td>Write output to file</td>
            <td>(stdout)</td>
          </tr>
          <tr>
            <td><code>--ai</code></td>
            <td>Use AI-powered generation</td>
            <td>&mdash;</td>
          </tr>
          <tr>
            <td><code>--api-key &lt;key&gt;</code></td>
            <td>Anthropic API key</td>
            <td><code>$ANTHROPIC_API_KEY</code></td>
          </tr>
        </tbody>
      </table>

      <p className="docs-section__text">
        <strong>Supported components (template-based):</strong> button, input,
        card, modal, navigation, form group, search field, badge, alert, table,
        accordion, tabs, dropdown, toast, tooltip, avatar, checkbox, radio,
        select, textarea, toggle, spinner, skeleton, divider.
      </p>

      <CodeBlock
        language="bash"
        title="Examples"
        code={`aioli generate "primary button"
aioli generate "large danger button with icon" --format json
aioli generate "search field with label" -o components/search.html
aioli generate --ai "responsive pricing table" --api-key sk-ant-...`}
      />

      {/* ================================================================== */}
      {/* aioli audit                                                        */}
      {/* ================================================================== */}
      <h3 className="docs-section__subtitle">aioli audit</h3>
      <p className="docs-section__text">
        Run accessibility audit on design tokens.
      </p>
      <CodeBlock language="bash" code="aioli audit [options]" />

      <table className="docs-table">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--tokens-dir &lt;path&gt;</code></td>
            <td>Path to tokens directory</td>
            <td><code>./tokens</code></td>
          </tr>
          <tr>
            <td><code>--level &lt;level&gt;</code></td>
            <td>WCAG level: <code>AA</code> or <code>AAA</code></td>
            <td><code>AA</code></td>
          </tr>
          <tr>
            <td><code>--report &lt;path&gt;</code></td>
            <td>Save JSON report to file</td>
            <td>&mdash;</td>
          </tr>
        </tbody>
      </table>

      <p className="docs-section__text"><strong>What it checks:</strong></p>
      <ul className="docs-section__list">
        <li>Color contrast ratios between foreground/background token pairs</li>
        <li>WCAG AA: 4.5:1 for normal text, 3:1 for large text and UI components</li>
        <li>WCAG AAA: 7:1 for normal text, 4.5:1 for large text</li>
        <li>Token structural validity</li>
      </ul>

      <CodeBlock
        language="bash"
        title="Examples"
        code={`aioli audit
aioli audit --level AAA
aioli audit --report reports/a11y-audit.json`}
      />
      <p className="docs-section__text">
        <strong>Exit codes:</strong> 0 if all checks pass, 1 if failures found.
      </p>

      {/* ================================================================== */}
      {/* aioli export                                                       */}
      {/* ================================================================== */}
      <h3 className="docs-section__subtitle">aioli export</h3>
      <p className="docs-section__text">
        Export tokens in different formats.
      </p>
      <CodeBlock language="bash" code="aioli export [options]" />

      <table className="docs-table">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--format &lt;format&gt;</code></td>
            <td>Output format: <code>css</code>, <code>json</code>, <code>scss</code></td>
            <td><code>css</code></td>
          </tr>
          <tr>
            <td><code>--tokens-dir &lt;path&gt;</code></td>
            <td>Path to tokens directory</td>
            <td><code>./tokens</code></td>
          </tr>
          <tr>
            <td><code>-o, --output &lt;path&gt;</code></td>
            <td>Output file path</td>
            <td>(stdout)</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        language="bash"
        title="Examples"
        code={`aioli export --format css -o dist/tokens.css
aioli export --format scss -o styles/_tokens.scss
aioli export --format json -o dist/tokens.json
aioli export --format css  # prints to stdout`}
      />

      {/* ================================================================== */}
      {/* Environment Variables                                              */}
      {/* ================================================================== */}
      <h3 className="docs-section__subtitle">Environment Variables</h3>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Used By</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ANTHROPIC_API_KEY</code></td>
            <td><code>generate --ai</code></td>
            <td>Anthropic API key for AI-powered generation</td>
          </tr>
          <tr>
            <td><code>DEBUG</code></td>
            <td>All commands</td>
            <td>Set to any value to show stack traces on error</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
