import React from 'react';
import CodeBlock from '../components/CodeBlock';
import TokenBrowser from '../components/TokenBrowser';

export default function TokenArchitecture() {
  return (
    <section id="token-architecture" className="docs-section">
      <h2 className="docs-section__title">Token Architecture</h2>

      {/* ------------------------------------------------------------------ */}
      {/* Overview                                                           */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Overview</h3>
      <p className="docs-section__text">
        Aioli uses a three-tier token hierarchy following the W3C Design Tokens
        Community Group (DTCG) specification. Tokens flow from raw values
        (primitives) through intent-based mappings (semantic) to
        component-specific scoping.
      </p>

      <div className="docs-token-tiers" aria-label="Token hierarchy: Primitives flow to Semantic flow to Component">
        <div className="docs-token-tiers__tier">
          <strong>Primitives</strong>
          <span>Raw values</span>
        </div>
        <div className="docs-token-tiers__arrow" aria-hidden="true">&rarr;</div>
        <div className="docs-token-tiers__tier">
          <strong>Semantic</strong>
          <span>Intent</span>
        </div>
        <div className="docs-token-tiers__arrow" aria-hidden="true">&rarr;</div>
        <div className="docs-token-tiers__tier">
          <strong>Component</strong>
          <span>Scoped</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DTCG Format                                                        */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">DTCG Format</h3>
      <p className="docs-section__text">
        Every token uses the standard DTCG format with <code>$</code>-prefixed
        properties. The <code>$value</code> field is required; <code>$type</code>{' '}
        and <code>$description</code> are optional but recommended.
      </p>
      <CodeBlock
        language="json"
        title="DTCG token format"
        code={`{
  "tokenName": {
    "$value": "#3b82f6",
    "$type": "color",
    "$description": "Blue 500 from the primary palette"
  }
}`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Supported Types                                                    */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Supported Types</h3>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>color</code></td>
            <td><code>#3b82f6</code>, <code>rgb(59, 130, 246)</code></td>
          </tr>
          <tr>
            <td><code>dimension</code></td>
            <td><code>16px</code>, <code>1rem</code></td>
          </tr>
          <tr>
            <td><code>fontFamily</code></td>
            <td><code>'Inter', sans-serif</code></td>
          </tr>
          <tr>
            <td><code>fontWeight</code></td>
            <td><code>400</code>, <code>600</code></td>
          </tr>
          <tr>
            <td><code>duration</code></td>
            <td><code>100ms</code>, <code>0.25s</code></td>
          </tr>
          <tr>
            <td><code>cubicBezier</code></td>
            <td><code>[0.4, 0, 0.2, 1]</code></td>
          </tr>
          <tr>
            <td><code>number</code></td>
            <td><code>1.5</code>, <code>4.5</code></td>
          </tr>
          <tr>
            <td><code>shadow</code></td>
            <td><code>0 1px 3px rgba(0,0,0,0.1)</code></td>
          </tr>
          <tr>
            <td><code>typography</code></td>
            <td>Composite font properties</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* References                                                         */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">References</h3>
      <p className="docs-section__text">
        Tokens can reference other tokens using curly brace syntax. References
        are resolved at build time by Style Dictionary. The Design Token Agent
        also resolves them at runtime.
      </p>
      <CodeBlock
        language="json"
        title="Token reference syntax"
        code={`{
  "primary": {
    "$value": "{primitive.color.blue.500}",
    "$type": "color"
  }
}`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Tier 1: Primitives                                                 */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Tier 1: Primitives</h3>
      <p className="docs-section__text">
        <strong>Location:</strong> <code>tokens/primitives/</code>
      </p>
      <p className="docs-section__text">
        Raw values with no semantic meaning. These are never used directly in
        components &mdash; they serve as the foundation that semantic tokens
        reference.
      </p>

      <CodeBlock
        language="text"
        title="Color primitives (6 families, 11-12 shades each)"
        code={`primitive.color.neutral.0     -> #ffffff
primitive.color.neutral.50    -> #f8fafc
primitive.color.neutral.100   -> #f1f5f9
...
primitive.color.neutral.950   -> #020617

primitive.color.blue.50       -> #eff6ff
primitive.color.blue.500      -> #3b82f6
primitive.color.blue.950      -> #172554

Families: neutral, blue, emerald, amber, red, purple`}
      />

      <CodeBlock
        language="text"
        title="Spacing primitives (0-96 scale)"
        code={`primitive.spacing.0    -> 0px
primitive.spacing.1    -> 4px
primitive.spacing.2    -> 8px
primitive.spacing.4    -> 16px
primitive.spacing.8    -> 32px
primitive.spacing.16   -> 64px`}
      />

      <CodeBlock
        language="text"
        title="Typography primitives"
        code={`primitive.font.family.sans   -> 'Inter', system-ui, sans-serif
primitive.font.family.serif  -> 'Merriweather', Georgia, serif
primitive.font.family.mono   -> 'JetBrains Mono', monospace

primitive.font.size.xs       -> 0.75rem
primitive.font.size.base     -> 1rem
primitive.font.size.4xl      -> 2.25rem`}
      />

      <p className="docs-section__text">
        Additional primitive files include <code>radius.json</code> (border
        radius scale) and <code>motion.json</code> (animation duration and
        easing definitions).
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Tier 2: Semantic                                                   */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Tier 2: Semantic</h3>
      <p className="docs-section__text">
        <strong>Location:</strong> <code>tokens/semantic/</code>
      </p>
      <p className="docs-section__text">
        Intent-based tokens that reference primitives. These carry meaning and
        are what components should consume.
      </p>

      <CodeBlock
        language="json"
        title="Semantic color tokens"
        code={`{
  "semantic": {
    "color": {
      "primary": { "$value": "{primitive.color.blue.600}", "$type": "color" },
      "success": {
        "default": { "$value": "{primitive.color.emerald.600}", "$type": "color" },
        "hover": { "$value": "{primitive.color.emerald.700}", "$type": "color" }
      },
      "danger": {
        "default": { "$value": "{primitive.color.red.600}", "$type": "color" }
      }
    }
  }
}`}
      />

      <CodeBlock
        language="text"
        title="Surface tokens"
        code={`semantic.surface.page.default  -> {primitive.color.neutral.0}
semantic.surface.card.default  -> {primitive.color.neutral.0}
semantic.border.default        -> {primitive.color.neutral.200}
semantic.text.default          -> {primitive.color.neutral.900}
semantic.text.muted            -> {primitive.color.neutral.500}`}
      />

      <p className="docs-section__text">
        Dark mode overrides (<code>dark.json</code>) provide the same token
        paths with dark-appropriate values:
      </p>
      <CodeBlock
        language="text"
        title="Dark mode overrides"
        code={`semantic.surface.dark.page.default  -> {primitive.color.neutral.900}
semantic.text.dark.default          -> {primitive.color.neutral.50}`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Tier 3: Component                                                  */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Tier 3: Component</h3>
      <p className="docs-section__text">
        <strong>Location:</strong> <code>tokens/components/</code>
      </p>
      <p className="docs-section__text">
        Scoped to individual components. These reference semantic tokens and
        define every visual property a component needs &mdash; sizes, variants,
        and interactive states.
      </p>

      <CodeBlock
        language="json"
        title="Example: button.json"
        code={`{
  "component": {
    "button": {
      "radius": { "$value": "{primitive.radius.md}", "$type": "dimension" },
      "size": {
        "sm": {
          "height": { "$value": "32px", "$type": "dimension" },
          "paddingX": { "$value": "{primitive.spacing.3}", "$type": "dimension" },
          "fontSize": { "$value": "{primitive.font.size.sm}", "$type": "dimension" }
        },
        "md": { "..." : "..." },
        "lg": { "..." : "..." }
      },
      "primary": {
        "bg": { "$value": "{semantic.color.primary.default}", "$type": "color" },
        "bgHover": { "$value": "{semantic.color.primary.hover}", "$type": "color" },
        "text": { "$value": "{primitive.color.neutral.0}", "$type": "color" }
      }
    }
  }
}`}
      />

      <p className="docs-section__text">
        <strong>Available components (23):</strong> accordion, alert, avatar,
        badge, button, card, checkbox, divider, dropdown, form-field, input,
        modal, navigation, radio, select, skeleton, spinner, table, tabs,
        textarea, toast, toggle, tooltip.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* File Organization                                                  */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">File Organization</h3>
      <CodeBlock
        language="text"
        title="Token file structure"
        code={`tokens/
  primitives/
    colors.json        # 6 color families, 11-12 shades each
    spacing.json       # 0-96 scale
    typography.json    # Fonts, sizes, weights, line heights
    radius.json        # Border radius scale
    motion.json        # Durations and easing curves
  semantic/
    colors.json        # primary, success, warning, danger
    surfaces.json      # Backgrounds, borders, text
    dark.json          # Dark mode overrides
  components/
    button.json        # Button sizes, variants, states
    input.json         # Input states, borders, focus
    card.json          # Card shadow, padding, media
    ...                # 20 more component files`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Naming Conventions                                                 */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Naming Conventions</h3>
      <p className="docs-section__text">
        Token paths follow a consistent dot-notation convention per tier:
      </p>
      <ul className="docs-section__list">
        <li><strong>Primitives:</strong> <code>primitive.{'{category}'}.{'{name}'}.{'{shade/scale}'}</code></li>
        <li><strong>Semantic:</strong> <code>semantic.{'{category}'}.{'{intent}'}.{'{variant}'}</code></li>
        <li><strong>Component:</strong> <code>component.{'{name}'}.{'{property}'}.{'{state/variant}'}</code></li>
      </ul>
      <CodeBlock
        language="text"
        title="Naming examples"
        code={`primitive.color.blue.500
semantic.color.primary.default
component.button.primary.bg
component.button.size.md.height`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Adding New Tokens                                                  */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Adding New Tokens</h3>
      <ol className="docs-section__list">
        <li>Determine the tier (primitive, semantic, or component)</li>
        <li>Create or edit the appropriate JSON file</li>
        <li>Use DTCG format with <code>$value</code>, <code>$type</code>, <code>$description</code></li>
        <li>Reference existing tokens where possible</li>
        <li>Run <code>aioli validate</code> to check structure</li>
        <li>Run <code>aioli build</code> to regenerate outputs</li>
        <li>Run <code>aioli audit</code> to verify accessibility</li>
      </ol>

      {/* ------------------------------------------------------------------ */}
      {/* Token Browser                                                      */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Browse Tokens</h3>
      <p className="docs-section__text">
        Explore the full set of design tokens interactively. Filter by tier,
        category, or search for specific token paths.
      </p>
      <TokenBrowser />
    </section>
  );
}
