/**
 * Aioli Theme — Runtime Theming API
 *
 * Generates CSS variable overrides for customizing the Aioli design system.
 * Consumers provide token path -> value overrides, and this module produces
 * ready-to-inject CSS.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a dot-notation token path to a CSS custom property name.
 *
 * @param {string} path - Dot-notation token path, e.g. `'primitive.color.blue.600'`
 * @returns {string} CSS variable name, e.g. `'--primitive-color-blue-600'`
 * @throws {TypeError} If `path` is not a non-empty string.
 *
 * @example
 * tokenPathToVar('primitive.color.blue.600');
 * // => '--primitive-color-blue-600'
 *
 * tokenPathToVar('component.button.primary.bg');
 * // => '--component-button-primary-bg'
 */
export function tokenPathToVar(path) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new TypeError('tokenPathToVar: path must be a non-empty string');
  }
  return '--' + path.replace(/\./g, '-');
}

/**
 * Converts a CSS custom property name back to a dot-notation token path.
 *
 * @param {string} cssVar - CSS variable name, e.g. `'--primitive-color-blue-600'`
 * @returns {string} Dot-notation path, e.g. `'primitive.color.blue.600'`
 * @throws {TypeError} If `cssVar` is not a string starting with `'--'`.
 *
 * @example
 * varToTokenPath('--primitive-color-blue-600');
 * // => 'primitive.color.blue.600'
 *
 * varToTokenPath('--component-button-primary-bg');
 * // => 'component.button.primary.bg'
 */
export function varToTokenPath(cssVar) {
  if (typeof cssVar !== 'string' || !cssVar.startsWith('--')) {
    throw new TypeError('varToTokenPath: cssVar must be a string starting with "--"');
  }
  return cssVar.slice(2).replace(/-/g, '.');
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

/**
 * Validates that an overrides object is a plain object (not null/array).
 *
 * @param {*} overrides
 * @returns {object} The validated overrides, or an empty object if falsy.
 * @private
 */
function normalizeOverrides(overrides) {
  if (!overrides) {
    return {};
  }
  if (typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new TypeError('Overrides must be a plain object mapping token paths to values');
  }
  return overrides;
}

/**
 * Generates CSS declaration lines from an overrides map.
 *
 * @param {Record<string, string>} overrides - Token path -> value map.
 * @returns {string[]} Array of CSS declaration strings (without trailing semicolons).
 * @private
 */
function overridesToDeclarations(overrides) {
  const declarations = [];
  for (const [path, value] of Object.entries(overrides)) {
    if (typeof path !== 'string' || path.length === 0) {
      continue; // skip invalid keys silently
    }
    const varName = tokenPathToVar(path);
    declarations.push(`  ${varName}: ${value};`);
  }
  return declarations;
}

/**
 * Wraps CSS declarations in a selector block.
 *
 * @param {string} selector - CSS selector, e.g. `:root` or `[data-theme="dark"]`.
 * @param {string[]} declarations - Array of indented CSS declaration strings.
 * @returns {string} Complete CSS rule block.
 * @private
 */
function wrapInSelector(selector, declarations) {
  if (declarations.length === 0) {
    return `${selector} {}`;
  }
  return `${selector} {\n${declarations.join('\n')}\n}`;
}

// ---------------------------------------------------------------------------
// Dark-mode default overrides (mirrors css/base.css [data-theme="dark"])
// ---------------------------------------------------------------------------

/**
 * The standard dark-mode token remapping that Aioli ships out of the box.
 * These map light-mode semantic variables to their dark-mode counterparts,
 * matching the declarations in `css/base.css` under `[data-theme="dark"]`.
 *
 * @type {Record<string, string>}
 * @private
 */
const DARK_MODE_DEFAULTS = {
  // Colors — intent
  'semantic.color.primary.default': 'var(--semantic-color-dark-primary-default)',
  'semantic.color.primary.hover': 'var(--semantic-color-dark-primary-hover)',
  'semantic.color.primary.active': 'var(--semantic-color-dark-primary-active)',
  'semantic.color.primary.subtle': 'var(--semantic-color-dark-primary-subtle)',

  'semantic.color.secondary.default': 'var(--semantic-color-dark-secondary-default)',
  'semantic.color.secondary.hover': 'var(--semantic-color-dark-secondary-hover)',
  'semantic.color.secondary.active': 'var(--semantic-color-dark-secondary-active)',
  'semantic.color.secondary.subtle': 'var(--semantic-color-dark-secondary-subtle)',

  'semantic.color.success.default': 'var(--semantic-color-dark-success-default)',
  'semantic.color.success.hover': 'var(--semantic-color-dark-success-hover)',
  'semantic.color.success.subtle': 'var(--semantic-color-dark-success-subtle)',

  'semantic.color.warning.default': 'var(--semantic-color-dark-warning-default)',
  'semantic.color.warning.hover': 'var(--semantic-color-dark-warning-hover)',
  'semantic.color.warning.subtle': 'var(--semantic-color-dark-warning-subtle)',

  'semantic.color.danger.default': 'var(--semantic-color-dark-danger-default)',
  'semantic.color.danger.hover': 'var(--semantic-color-dark-danger-hover)',
  'semantic.color.danger.subtle': 'var(--semantic-color-dark-danger-subtle)',

  'semantic.color.info.default': 'var(--semantic-color-dark-info-default)',
  'semantic.color.info.hover': 'var(--semantic-color-dark-info-hover)',
  'semantic.color.info.subtle': 'var(--semantic-color-dark-info-subtle)',

  // Surfaces
  'semantic.surface.page.default': 'var(--semantic-surface-dark-page-default)',
  'semantic.surface.page.subtle': 'var(--semantic-surface-dark-page-subtle)',
  'semantic.surface.card.default': 'var(--semantic-surface-dark-card-default)',
  'semantic.surface.card.hover': 'var(--semantic-surface-dark-card-hover)',

  // Borders
  'semantic.border.default': 'var(--semantic-border-dark-default)',
  'semantic.border.subtle': 'var(--semantic-border-dark-subtle)',
  'semantic.border.strong': 'var(--semantic-border-dark-strong)',
  'semantic.border.focus': 'var(--semantic-border-dark-focus)',

  // Text
  'semantic.text.default': 'var(--semantic-text-dark-default)',
  'semantic.text.muted': 'var(--semantic-text-dark-muted)',
  'semantic.text.disabled': 'var(--semantic-text-dark-disabled)',
  'semantic.text.inverse': 'var(--semantic-text-dark-inverse)',
  'semantic.text.link': 'var(--semantic-text-dark-link)',

  // Focus
  'semantic.focus.ring.color': 'var(--semantic-border-dark-focus)',
};

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Creates a theme object from a set of token overrides.
 *
 * The returned theme provides multiple serialisation methods so it can be
 * consumed in different contexts (injected style tags, inline styles, JSON
 * transport, etc.).
 *
 * @param {Record<string, string>} overrides - Object mapping dot-notation
 *   token paths to CSS values.
 * @returns {Theme} A theme object with `overrides`, `toCSS()`, `toCSSText()`,
 *   and `toJSON()` methods.
 *
 * @example
 * const brand = createTheme({
 *   'primitive.color.blue.600': '#0066cc',
 *   'semantic.color.primary.default': '#0066cc',
 *   'component.button.primary.bg': '#0066cc',
 * });
 *
 * // Inject as a <style> block
 * document.head.insertAdjacentHTML('beforeend',
 *   `<style>${brand.toCSS()}</style>`);
 *
 * @typedef {object} Theme
 * @property {Record<string, string>} overrides - The raw overrides map.
 * @property {string} selector - CSS selector for the theme block.
 * @property {() => string} toCSS - Generates a complete CSS rule block.
 * @property {() => string} toCSSText - Alias for `toCSS()`.
 * @property {() => Record<string, string>} toJSON - Returns a mapping of
 *   CSS variable names to values, suitable for JSON serialisation.
 */
export function createTheme(overrides, selector = ':root') {
  const normalized = normalizeOverrides(overrides);

  /** @type {Theme} */
  const theme = {
    overrides: { ...normalized },
    selector,

    /**
     * Generates a complete CSS rule block containing all overrides.
     *
     * @returns {string} CSS string, e.g. `:root { --token-path: value; }`
     */
    toCSS() {
      const declarations = overridesToDeclarations(this.overrides);
      return wrapInSelector(this.selector, declarations);
    },

    /**
     * Alias for `toCSS()` — returns the same CSS rule block string.
     *
     * @returns {string}
     */
    toCSSText() {
      return this.toCSS();
    },

    /**
     * Returns a plain object mapping CSS custom property names to their
     * values.  Useful for JSON transport or programmatic consumption.
     *
     * @returns {Record<string, string>}
     */
    toJSON() {
      const result = {};
      for (const [path, value] of Object.entries(this.overrides)) {
        if (typeof path !== 'string' || path.length === 0) continue;
        result[tokenPathToVar(path)] = value;
      }
      return result;
    },
  };

  return theme;
}

/**
 * Serialises a theme object to a CSS string.
 *
 * This is a standalone function equivalent to calling `theme.toCSS()`.
 * Useful when you want a functional style or need to pass a serialiser
 * around without carrying the theme instance.
 *
 * @param {Theme} theme - A theme created by `createTheme()` or
 *   `createDarkTheme()`.
 * @returns {string} Complete CSS rule block string.
 *
 * @example
 * const css = serializeTheme(myTheme);
 * fs.writeFileSync('theme-overrides.css', css);
 */
export function serializeTheme(theme) {
  if (!theme || typeof theme.toCSS !== 'function') {
    throw new TypeError('serializeTheme: argument must be a theme object created by createTheme()');
  }
  return theme.toCSS();
}

/**
 * Applies a theme to a DOM element by setting CSS custom properties on its
 * inline style.  Defaults to `document.documentElement` (the `<html>` tag).
 *
 * Returns a cleanup function that removes exactly the properties that were
 * set, restoring the element to its previous state.
 *
 * **Note:** This function requires a DOM environment.  In Node.js or other
 * non-browser contexts it will throw.
 *
 * @param {Theme} theme - A theme created by `createTheme()` or
 *   `createDarkTheme()`.
 * @param {HTMLElement} [element=document.documentElement] - Target element.
 * @returns {() => void} Cleanup function that removes the applied overrides.
 *
 * @example
 * const cleanup = applyTheme(brandTheme);
 *
 * // Later, revert the overrides:
 * cleanup();
 */
export function applyTheme(theme, element) {
  if (!theme || typeof theme.overrides !== 'object') {
    throw new TypeError('applyTheme: first argument must be a theme object created by createTheme()');
  }

  // Resolve target element — defer document access so the module can be
  // imported in non-browser environments without immediately throwing.
  const target = element || (typeof document !== 'undefined' ? document.documentElement : null);
  if (!target || typeof target.style === 'undefined') {
    throw new Error('applyTheme: no valid DOM element available. Pass an element explicitly or run in a browser.');
  }

  const appliedVars = [];

  for (const [path, value] of Object.entries(theme.overrides)) {
    if (typeof path !== 'string' || path.length === 0) continue;
    const varName = tokenPathToVar(path);
    target.style.setProperty(varName, value);
    appliedVars.push(varName);
  }

  // Return cleanup function
  return function cleanup() {
    for (const varName of appliedVars) {
      target.style.removeProperty(varName);
    }
  };
}

/**
 * Creates a dark-mode theme scoped to the `[data-theme="dark"]` selector.
 *
 * Without arguments it returns the standard Aioli dark-mode remapping
 * (matching `css/base.css`).  You can pass additional overrides that are
 * merged on top of the defaults, allowing you to extend or customise the
 * dark palette.
 *
 * @param {Record<string, string>} [overrides] - Optional additional
 *   overrides merged on top of the standard dark-mode defaults.
 * @returns {Theme} A theme object whose `toCSS()` output uses the
 *   `[data-theme="dark"]` selector.
 *
 * @example
 * // Standard dark mode
 * const darkCSS = createDarkTheme().toCSS();
 *
 * @example
 * // Customised dark mode with a different primary colour
 * const custom = createDarkTheme({
 *   'semantic.color.primary.default': '#7c3aed',
 *   'semantic.color.primary.hover': '#6d28d9',
 * });
 */
export function createDarkTheme(overrides) {
  const additional = normalizeOverrides(overrides);

  // Merge: defaults first, then consumer overrides win
  const merged = { ...DARK_MODE_DEFAULTS, ...additional };

  return createTheme(merged, '[data-theme="dark"]');
}
