/**
 * CSS Layer Tests — Aioli Design System
 *
 * Validates the CSS build output:
 *   1. All 31 component CSS files exist
 *   2. Every var(--xxx) in component CSS resolves to a token in tokens.css
 *   3. aioli.css imports tokens, base, and components
 *   4. components/index.css imports all 31 component files
 *   5. base.css includes dark mode support
 *   6. No hardcoded hex colors in component CSS
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const cssDir = resolve(projectRoot, 'css');
const componentsDir = resolve(cssDir, 'components');
const distCssDir = resolve(projectRoot, 'dist', 'css');

// ---------------------------------------------------------------------------
// Expected component list (31 components)
// ---------------------------------------------------------------------------

const EXPECTED_COMPONENTS = [
  'button',
  'input',
  'badge',
  'avatar',
  'spinner',
  'link',
  'chip',
  'divider',
  'skeleton',
  'progress',
  'tooltip',
  'checkbox',
  'radio',
  'rating',
  'toggle',
  'select',
  'textarea',
  'alert',
  'tabs',
  'accordion',
  'dropdown',
  'toast',
  'breadcrumb',
  'pagination',
  'stepper',
  'popover',
  'form-group',
  'card',
  'modal',
  'table',
  'navigation',
  // AI-Native Components
  'chat-bubble',
  'typing-indicator',
  'prompt-input',
  'streaming-text',
  'source-citation',
  'confidence-score',
  'trust-badge',
  'token-counter',
  'model-selector',
  'tool-call-card',
  'agent-status',
  'thumbs-rating',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read tokens.css once and extract the set of all defined CSS custom properties.
 * Matches lines like:  --component-button-radius: ...;
 */
function loadTokenVarNames() {
  const tokensCssPath = resolve(distCssDir, 'tokens.css');
  const content = readFileSync(tokensCssPath, 'utf-8');
  const varNames = new Set();
  const re = /--([\w-]+)\s*:/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    varNames.add(`--${match[1]}`);
  }
  return varNames;
}

/**
 * Extract all var(--xxx) references from a CSS string.
 * Handles fallback values: var(--foo, #fff) extracts just --foo.
 */
function extractVarReferences(css) {
  const refs = new Set();
  const re = /var\(\s*(--[\w-]+)/g;
  let match;
  while ((match = re.exec(css)) !== null) {
    refs.add(match[1]);
  }
  return refs;
}

// Cache tokens so we only read the file once across all tests.
let tokenVarNames;

function getTokenVarNames() {
  if (!tokenVarNames) {
    tokenVarNames = loadTokenVarNames();
  }
  return tokenVarNames;
}

// Cache component file contents: Map<componentName, cssString>
const componentContents = new Map();

function getComponentCss(name) {
  if (!componentContents.has(name)) {
    const filePath = resolve(componentsDir, `${name}.css`);
    componentContents.set(name, readFileSync(filePath, 'utf-8'));
  }
  return componentContents.get(name);
}

// ===========================================================================
// 1. All 31 component CSS files exist
// ===========================================================================

describe('Component CSS files exist', () => {
  it.each(EXPECTED_COMPONENTS)('%s.css exists in css/components/', (name) => {
    const filePath = resolve(componentsDir, `${name}.css`);
    expect(existsSync(filePath), `Missing: css/components/${name}.css`).toBe(true);
  });

  it('directory contains exactly 55 component files (plus index.css)', () => {
    const files = readdirSync(componentsDir).filter((f) => f.endsWith('.css'));
    // 55 components + index.css = 56 CSS files
    expect(files.length).toBe(56);
  });
});

// ===========================================================================
// 2. Every var() reference in component CSS resolves to a token
// ===========================================================================

describe('CSS var() references resolve to tokens.css', () => {
  it.each(EXPECTED_COMPONENTS)(
    'all var() references in %s.css exist in tokens.css',
    (name) => {
      const css = getComponentCss(name);
      const refs = extractVarReferences(css);
      const tokens = getTokenVarNames();
      const unresolved = [];

      for (const ref of refs) {
        if (!tokens.has(ref)) {
          unresolved.push(ref);
        }
      }

      expect(
        unresolved,
        `Unresolved variables in ${name}.css:\n  ${unresolved.join('\n  ')}`,
      ).toEqual([]);
    },
  );
});

// ===========================================================================
// 3. aioli.css imports tokens.css, base.css, and components/index.css
// ===========================================================================

describe('aioli.css entry point imports', () => {
  const aioliCss = readFileSync(resolve(cssDir, 'aioli.css'), 'utf-8');

  it('imports tokens.css', () => {
    expect(aioliCss).toMatch(/tokens\.css/);
  });

  it('imports base.css', () => {
    expect(aioliCss).toMatch(/base\.css/);
  });

  it('imports components/index.css', () => {
    expect(aioliCss).toMatch(/components\/index\.css/);
  });
});

// ===========================================================================
// 4. components/index.css imports all 31 components
// ===========================================================================

describe('components/index.css imports all 31 components', () => {
  const indexCss = readFileSync(resolve(componentsDir, 'index.css'), 'utf-8');

  it.each(EXPECTED_COMPONENTS)('imports %s.css', (name) => {
    const pattern = new RegExp(`@import\\s+['"]\\./${name}\\.css['"]`);
    expect(
      indexCss,
      `components/index.css missing @import for ${name}.css`,
    ).toMatch(pattern);
  });

  it('contains exactly 55 @import statements', () => {
    const imports = indexCss.match(/^@import\s/gm) || [];
    expect(imports.length).toBe(55);
  });
});

// ===========================================================================
// 5. base.css includes dark mode support
// ===========================================================================

describe('base.css dark mode', () => {
  const baseCss = readFileSync(resolve(cssDir, 'base.css'), 'utf-8');

  it('contains [data-theme="dark"] selector', () => {
    expect(baseCss).toContain('[data-theme="dark"]');
  });

  it('remaps semantic light-mode variables inside dark mode block', () => {
    // Verify at least one semantic surface remap exists
    expect(baseCss).toMatch(
      /--semantic-surface-page-default:\s*var\(--semantic-surface-dark-page-default\)/,
    );
  });

  it('sets color-scheme: dark', () => {
    expect(baseCss).toMatch(/color-scheme:\s*dark/);
  });
});

// ===========================================================================
// 6. No hardcoded hex colors in component CSS
// ===========================================================================

describe('No hardcoded hex colors in component CSS', () => {
  /**
   * Matches hex color patterns: #rgb, #rrggbb, #rgba, #rrggbbaa
   * Excludes occurrences inside comments.
   */
  function findHardcodedHexColors(css) {
    // Strip CSS comments first
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const hexPattern = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
    const matches = [];
    let match;
    while ((match = hexPattern.exec(stripped)) !== null) {
      matches.push(match[0]);
    }
    return matches;
  }

  it.each(EXPECTED_COMPONENTS)(
    '%s.css contains no hardcoded hex color values',
    (name) => {
      const css = getComponentCss(name);
      const hexColors = findHardcodedHexColors(css);
      expect(
        hexColors,
        `Hardcoded hex colors found in ${name}.css: ${hexColors.join(', ')}`,
      ).toEqual([]);
    },
  );
});
