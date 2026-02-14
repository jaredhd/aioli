/**
 * Aioli Kit -- Design Tool Integration API
 *
 * Provides a clean, high-level facade over the Aioli agent system
 * for use by front-end design tools and visual editors.
 *
 * @module aioli/kit
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createAgentSystem } from '../agents/index.js';
import { COMPONENT_TEMPLATES } from '../agents/component-generator-agent.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Resolve a default tokens path relative to the package root. */
function defaultTokensPath() {
  return resolve(__dirname, '..', 'tokens');
}

/**
 * Extract the parameter names and their defaults from a template function.
 * Uses the function source to pull out the destructured parameter list.
 *
 * @param {Function} fn - The template function to introspect.
 * @returns {Object} Map of prop names to their default values (or null if none).
 */
function extractTemplateProps(fn) {
  const src = fn.toString();

  // Match the destructured object parameter: ({ variant = 'primary', ... }) =>
  const paramMatch = src.match(/^\(\s*\{\s*([\s\S]*?)\}\s*\)/);
  if (!paramMatch) return {};

  const paramBlock = paramMatch[1];
  const props = {};

  // Split on commas that are not inside nested braces/brackets
  let depth = 0;
  let current = '';
  for (const ch of paramBlock) {
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      current = current.trim();
      if (current) parseParam(current, props);
      current = '';
      continue;
    }
    current += ch;
  }
  current = current.trim();
  if (current) parseParam(current, props);

  return props;
}

/**
 * Parse a single destructured parameter string into a name + default.
 * @param {string} raw - e.g. "variant = 'primary'" or "items"
 * @param {Object} out - Object to populate.
 */
function parseParam(raw, out) {
  const eqIdx = raw.indexOf('=');
  if (eqIdx === -1) {
    const name = raw.trim();
    if (name) out[name] = null;
    return;
  }
  const name = raw.slice(0, eqIdx).trim();
  let val = raw.slice(eqIdx + 1).trim();

  // Try to parse the default value as JSON-compatible
  try {
    // Handle single-quoted strings -> double-quoted
    if (/^'[^']*'$/.test(val)) val = `"${val.slice(1, -1)}"`;
    out[name] = JSON.parse(val);
  } catch {
    out[name] = val; // leave as raw string if unparseable
  }
}

// ---------------------------------------------------------------------------
// CSS import path helper
// ---------------------------------------------------------------------------

/**
 * Build a list of suggested CSS import paths for a component type.
 * @param {string} type - Component type name (e.g. 'button').
 * @returns {string[]}
 */
function cssImportsForType(type) {
  return [`aioli/css/components/${type}.css`];
}

// ---------------------------------------------------------------------------
// AioliKit
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} RenderResult
 * @property {string}   html       - Generated HTML markup.
 * @property {string[]} cssImports - Suggested CSS import paths.
 * @property {string[]} tokens     - Design token paths referenced by the component.
 * @property {Object}   a11y       - Accessibility metadata for the component.
 */

/**
 * @typedef {Object} CatalogEntry
 * @property {string}   category    - Atomic Design category (atom, molecule, organism).
 * @property {string}   description - Short human-readable description.
 * @property {string[]} variants    - Available visual variants.
 * @property {string[]} sizes       - Available size options.
 * @property {Object}   props       - Accepted props with their default values.
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid  - Whether the HTML passed validation.
 * @property {Array}   issues - List of accessibility issues found.
 */

/**
 * Create an Aioli kit instance.
 *
 * The kit wraps the full Aioli agent system behind a concise API designed
 * for integration with front-end design tools and visual editors.
 *
 * @param {string} [tokensPath] - Absolute or relative path to the tokens
 *   directory.  Defaults to the `tokens/` directory at the package root.
 * @returns {AioliKit}
 */
export function createAioliKit(tokensPath) {
  const resolvedPath = tokensPath
    ? resolve(tokensPath)
    : defaultTokensPath();

  let agents;
  try {
    agents = createAgentSystem(resolvedPath);
  } catch (err) {
    throw new Error(`Aioli Kit: failed to initialise agent system -- ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // Public API object
  // -------------------------------------------------------------------------

  /** @type {AioliKit} */
  const kit = {
    // -- Direct agent access (advanced) ------------------------------------
    /**
     * The underlying agent instances for advanced or lower-level usage.
     *
     * @type {{
     *   token:      import('../agents/design-token-agent.js').DesignTokenAgent,
     *   a11y:       import('../agents/accessibility-validator-agent.js').AccessibilityValidatorAgent,
     *   motion:     import('../agents/motion-agent.js').MotionAgent,
     *   component:  import('../agents/component-generator-agent.js').ComponentGeneratorAgent,
     *   codeReview: import('../agents/code-review-agent.js').CodeReviewAgent,
     *   orchestrator: import('../agents/orchestrator-agent.js').OrchestratorAgent,
     * }}
     */
    agents,

    // -- render ------------------------------------------------------------
    /**
     * Render a component by type and props.
     *
     * @param {string} type  - Component type (e.g. 'button', 'card', 'modal').
     * @param {Object} [props={}] - Props forwarded to the component template
     *   (variant, size, children, etc.).
     * @returns {RenderResult} The rendered component output.
     *
     * @example
     * const out = kit.render('button', { variant: 'danger', size: 'lg', children: 'Delete' });
     * console.log(out.html);
     */
    render(type, props = {}) {
      try {
        const response = agents.component.handleRequest({
          action: 'generate',
          componentType: type,
          props,
        });

        if (!response.success) {
          return {
            html: '',
            cssImports: [],
            tokens: [],
            a11y: {},
            error: response.error || 'Component generation failed',
          };
        }

        const data = response.data;

        // If the component generator itself returned an error object
        if (data.error) {
          return {
            html: '',
            cssImports: [],
            tokens: [],
            a11y: {},
            error: data.message,
            availableTypes: data.availableTypes,
          };
        }

        return {
          html: data.html || '',
          cssImports: cssImportsForType(type),
          tokens: data.tokens || [],
          a11y: data.a11y || {},
        };
      } catch (err) {
        return {
          html: '',
          cssImports: [],
          tokens: [],
          a11y: {},
          error: err.message,
        };
      }
    },

    // -- catalog -----------------------------------------------------------
    /**
     * Return the full component catalog with metadata.
     *
     * Each key is a component name and its value contains the category,
     * description, available variants/sizes, and the props the template
     * accepts together with their default values.
     *
     * @returns {Object.<string, CatalogEntry>}
     *
     * @example
     * const catalog = kit.catalog();
     * console.log(Object.keys(catalog)); // ['button', 'input', 'card', ...]
     * console.log(catalog.button.variants); // ['primary', 'secondary', 'danger', 'ghost']
     */
    catalog() {
      const result = {};

      for (const [name, entry] of Object.entries(COMPONENT_TEMPLATES)) {
        result[name] = {
          category: entry.category,
          description: entry.description,
          variants: entry.variants || [],
          sizes: entry.sizes || [],
          props: extractTemplateProps(entry.template),
        };
      }

      return result;
    },

    // -- resolve -----------------------------------------------------------
    /**
     * Resolve one or more design token paths to their final values.
     *
     * @param {string|string[]} tokenPaths - A single token path or an array
     *   of token paths (e.g. 'semantic.color.primary' or
     *   ['component.button.primary.background', 'component.button.primary.color']).
     * @returns {Object|null} When given a single string, returns the resolved
     *   token object (or null if not found).  When given an array, returns an
     *   object mapping each path to its resolved token (or null).
     *
     * @example
     * // Single token
     * const token = kit.resolve('semantic.color.primary');
     * console.log(token.resolvedValue); // '#2563eb'
     *
     * // Multiple tokens
     * const tokens = kit.resolve(['semantic.color.primary', 'semantic.color.danger']);
     */
    resolve(tokenPaths) {
      try {
        if (typeof tokenPaths === 'string') {
          const response = agents.token.handleRequest({
            action: 'get',
            path: tokenPaths,
          });
          return response.success ? response.data : null;
        }

        if (Array.isArray(tokenPaths)) {
          const result = {};
          for (const p of tokenPaths) {
            const response = agents.token.handleRequest({
              action: 'get',
              path: p,
            });
            result[p] = response.success ? response.data : null;
          }
          return result;
        }

        return null;
      } catch (err) {
        return null;
      }
    },

    // -- validate ----------------------------------------------------------
    /**
     * Validate an HTML string for accessibility compliance.
     *
     * Runs the accessibility validator agent against the provided markup,
     * checking semantic HTML usage, ARIA correctness, and more.
     *
     * @param {string} html - The HTML markup to validate.
     * @returns {ValidationResult}
     *
     * @example
     * const result = kit.validate('<img src="photo.jpg">');
     * console.log(result.valid);  // false
     * console.log(result.issues); // [{ ... missing alt attribute ... }]
     */
    validate(html) {
      try {
        const response = agents.a11y.handleRequest({
          action: 'validateComponent',
          component: { name: 'kit-validation', html },
        });

        if (!response.success) {
          return { valid: false, issues: [{ error: response.error }] };
        }

        const report = response.data;
        return {
          valid: report.valid,
          issues: report.allIssues || [],
        };
      } catch (err) {
        return { valid: false, issues: [{ error: err.message }] };
      }
    },
  };

  return kit;
}
