import React, { useState } from 'react';
import CodeBlock from '../components/CodeBlock';

// ---------------------------------------------------------------------------
// ThemePlayground -- Interactive live theme preview
// ---------------------------------------------------------------------------

function ThemePlayground() {
  const [primary, setPrimary] = useState('#2563eb');
  const [danger, setDanger] = useState('#b91c1c');

  const customStyles = {
    '--semantic-color-primary-default': primary,
    '--semantic-color-primary-hover': primary,
    '--component-button-primary-bg': primary,
    '--component-button-primary-bg-hover': primary,
    '--semantic-color-danger-default': danger,
    '--component-button-danger-bg': danger,
    '--component-button-danger-bg-hover': danger,
  };

  return (
    <div className="docs-theme-playground">
      <div className="docs-theme-playground__controls">
        <label>
          Primary:{' '}
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
          />
        </label>
        <label>
          Danger:{' '}
          <input
            type="color"
            value={danger}
            onChange={(e) => setDanger(e.target.value)}
          />
        </label>
      </div>
      <div className="docs-theme-playground__preview" style={customStyles}>
        <button type="button" className="btn btn--primary btn--md">
          <span className="btn__text">Primary Button</span>
        </button>
        <button type="button" className="btn btn--danger btn--md">
          <span className="btn__text">Danger Button</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ThemingAPI section
// ---------------------------------------------------------------------------

export default function ThemingAPI() {
  return (
    <section id="theming" className="docs-section">
      <h2 className="docs-section__title">Theming API</h2>

      {/* ------------------------------------------------------------------ */}
      {/* Overview                                                           */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Overview</h3>
      <p className="docs-section__text">
        Aioli supports runtime theme customization via CSS custom properties.
        The theming API lets you override any token at runtime, generate CSS
        output for injection, and apply themes directly to the DOM.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* createTheme                                                        */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">
        <code>createTheme(overrides, selector?)</code>
      </h3>
      <p className="docs-section__text">
        Creates a theme object from a set of token path overrides. The returned
        theme provides multiple serialization methods for different consumption
        contexts &mdash; injected style tags, inline styles, or JSON transport.
      </p>
      <CodeBlock
        language="js"
        title="createTheme usage"
        code={`import { createTheme, applyTheme } from 'aioli/theme';

const brand = createTheme({
  'primitive.color.blue.600': '#0066cc',
  'semantic.color.primary.default': '#0066cc',
});

// Get CSS output
brand.toCSS();     // ":root { --primitive-color-blue-600: #0066cc; ... }"
brand.toCSSText(); // Same CSS string (alias)
brand.toJSON();    // { '--primitive-color-blue-600': '#0066cc', ... }`}
      />
      <p className="docs-section__text">
        The optional <code>selector</code> parameter defaults to{' '}
        <code>:root</code>. Pass a custom selector to scope overrides to a
        specific element or context.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* applyTheme                                                         */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">
        <code>applyTheme(theme, element?)</code>
      </h3>
      <p className="docs-section__text">
        Applies a theme to a DOM element by setting CSS custom properties on its
        inline style. Defaults to <code>document.documentElement</code> (the{' '}
        <code>&lt;html&gt;</code> tag). Returns a cleanup function that removes
        exactly the properties that were set.
      </p>
      <CodeBlock
        language="js"
        title="applyTheme usage"
        code={`import { createTheme, applyTheme } from 'aioli/theme';

const brand = createTheme({
  'semantic.color.primary.default': '#0066cc',
  'component.button.primary.bg': '#0066cc',
});

// Apply to DOM -- returns cleanup function
const cleanup = applyTheme(brand);

// Later, revert the overrides:
cleanup();

// Apply to a specific element
const cleanup2 = applyTheme(brand, document.getElementById('my-section'));`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* createDarkTheme                                                    */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">
        <code>createDarkTheme(overrides?)</code>
      </h3>
      <p className="docs-section__text">
        Creates a dark-mode theme scoped to the{' '}
        <code>[data-theme="dark"]</code> selector. Without arguments, it returns
        the standard Aioli dark-mode remapping. You can pass additional
        overrides that merge on top of the defaults.
      </p>
      <CodeBlock
        language="js"
        title="createDarkTheme usage"
        code={`import { createDarkTheme } from 'aioli/theme';

// Standard dark mode
const darkCSS = createDarkTheme().toCSS();

// Customized dark mode with a different primary color
const custom = createDarkTheme({
  'semantic.color.primary.default': '#7c3aed',
  'semantic.color.primary.hover': '#6d28d9',
});`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* serializeTheme                                                     */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">
        <code>serializeTheme(theme)</code>
      </h3>
      <p className="docs-section__text">
        Standalone function equivalent to calling <code>theme.toCSS()</code>.
        Useful when you want a functional style or need to pass a serializer
        without carrying the theme instance.
      </p>
      <CodeBlock
        language="js"
        title="serializeTheme usage"
        code={`import { serializeTheme, createTheme } from 'aioli/theme';

const theme = createTheme({ 'semantic.color.primary.default': '#0066cc' });
const css = serializeTheme(theme);

// Write to file (Node.js)
fs.writeFileSync('theme-overrides.css', css);`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Helper Utilities                                                   */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Helper Utilities</h3>
      <p className="docs-section__text">
        Two helper functions convert between dot-notation token paths and CSS
        custom property names.
      </p>
      <CodeBlock
        language="js"
        title="tokenPathToVar / varToTokenPath"
        code={`import { tokenPathToVar, varToTokenPath } from 'aioli/theme';

tokenPathToVar('primitive.color.blue.600');
// => '--primitive-color-blue-600'

tokenPathToVar('component.button.primary.bg');
// => '--component-button-primary-bg'

varToTokenPath('--primitive-color-blue-600');
// => 'primitive.color.blue.600'

varToTokenPath('--component-button-primary-bg');
// => 'component.button.primary.bg'`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Live Theme Playground                                              */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Live Theme Playground</h3>
      <p className="docs-section__text">
        Use the color pickers below to customize the primary and danger colors.
        The buttons update in real time via CSS custom property overrides
        applied to the preview container.
      </p>

      <ThemePlayground />
    </section>
  );
}
