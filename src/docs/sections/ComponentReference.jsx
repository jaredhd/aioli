import React from 'react';
import CodeBlock from '../components/CodeBlock';
import ComponentCatalog from '../components/ComponentCatalog';

export default function ComponentReference() {
  return (
    <section id="components" className="docs-section">
      <h2 className="docs-section__title">Component Reference</h2>

      {/* ------------------------------------------------------------------ */}
      {/* Introduction                                                       */}
      {/* ------------------------------------------------------------------ */}
      <p className="docs-section__text">
        Aioli ships 31 component templates following Atomic Design methodology.
        Every component uses semantic design tokens, includes proper ARIA
        attributes, supports keyboard navigation, and respects{' '}
        <code>prefers-reduced-motion</code>.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Categories                                                         */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Component Categories</h3>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Count</th>
            <th>Components</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Atoms</strong></td>
            <td>15</td>
            <td>
              Button, Badge, Avatar, Spinner, Skeleton, Divider, Toggle,
              Tooltip, Alert, Toast, Icon, Label, Tag, Link, Text
            </td>
          </tr>
          <tr>
            <td><strong>Form Elements</strong></td>
            <td>2</td>
            <td>Input, Textarea</td>
          </tr>
          <tr>
            <td><strong>Molecules</strong></td>
            <td>10</td>
            <td>
              Search Field, Form Group, Nav Link, Checkbox, Radio, Select,
              Dropdown, Tabs, Accordion, Card
            </td>
          </tr>
          <tr>
            <td><strong>Organisms</strong></td>
            <td>4</td>
            <td>Header, Navigation, Modal, Table</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* Generation                                                         */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Generating Components</h3>
      <p className="docs-section__text">
        Components can be generated from natural language descriptions using the
        CLI or the programmatic API. Template-based generation works without an
        API key; AI-powered generation requires an Anthropic API key.
      </p>
      <CodeBlock
        language="bash"
        title="CLI generation"
        code={`# Template-based
aioli generate "large primary button with icon"
aioli generate "search field with label"

# AI-powered
aioli generate --ai "responsive pricing table"`}
      />
      <CodeBlock
        language="js"
        title="Programmatic generation"
        code={`import { createAgentSystem } from 'aioli';

const { component } = createAgentSystem('./tokens');

// Generate from description
const result = component.handleRequest({
  action: 'generateFromDescription',
  description: 'large danger button with icon',
});

// result.data => { html, tokens, a11y, parsed }`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Catalog                                                            */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Component Catalog</h3>
      <p className="docs-section__text">
        Browse generated component examples below. Each example shows the
        rendered output along with the HTML and applied tokens.
      </p>

      <ComponentCatalog />

      <p className="docs-section__text" style={{ marginTop: '1.5rem' }}>
        For the full interactive gallery with all variants, sizes, and states,
        visit the{' '}
        <a href="/demo.html">Component Gallery</a>.
      </p>
    </section>
  );
}
