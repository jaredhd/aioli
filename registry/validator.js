/**
 * Aioli Community Registry — Package Validator
 *
 * Validates component packages before install/publish.
 * Checks manifest, template, CSS, and tokens for correctness.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { pathToFileURL } from 'url';
import { COMPONENT_TEMPLATES } from '../agents/component-generator-agent.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_CATEGORIES = ['atom', 'molecule', 'organism', 'template'];
const KEBAB_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+/;
const BUILT_IN_NAMES = new Set(Object.keys(COMPONENT_TEMPLATES));

const VALID_TOKEN_TYPES = new Set([
  'color', 'dimension', 'fontFamily', 'fontWeight', 'fontStyle',
  'number', 'shadow', 'gradient', 'duration', 'cubicBezier',
  'strokeStyle', 'border', 'transition', 'typography', 'spacing',
]);

// ============================================================================
// MANIFEST VALIDATION
// ============================================================================

/**
 * Validate a package manifest object.
 * @param {Object} manifest - Parsed manifest.json content
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a JSON object'], warnings };
  }

  // Required fields
  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push('name is required and must be a string');
  } else {
    if (!KEBAB_RE.test(manifest.name)) {
      errors.push(`name "${manifest.name}" must be kebab-case (e.g., "my-component")`);
    }
    if (manifest.name.length < 2 || manifest.name.length > 50) {
      errors.push('name must be 2-50 characters');
    }
    if (BUILT_IN_NAMES.has(manifest.name)) {
      errors.push(`name "${manifest.name}" conflicts with a built-in component`);
    }
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('version is required and must be a string');
  } else if (!SEMVER_RE.test(manifest.version)) {
    errors.push(`version "${manifest.version}" must be valid semver (e.g., "1.0.0")`);
  }

  if (!manifest.description || typeof manifest.description !== 'string') {
    errors.push('description is required and must be a string');
  } else if (manifest.description.length < 5) {
    errors.push('description should be at least 5 characters');
  }

  if (!manifest.category || typeof manifest.category !== 'string') {
    errors.push('category is required');
  } else if (!VALID_CATEGORIES.includes(manifest.category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // Optional but recommended fields
  if (!manifest.keywords || !Array.isArray(manifest.keywords) || manifest.keywords.length === 0) {
    warnings.push('keywords array is recommended for discoverability');
  }

  if (!manifest.nlPatterns || !Array.isArray(manifest.nlPatterns) || manifest.nlPatterns.length === 0) {
    warnings.push('nlPatterns array is recommended for natural language matching');
  }

  if (!manifest.author) {
    warnings.push('author field is recommended');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// TEMPLATE VALIDATION
// ============================================================================

/**
 * Validate a template module (the default export of template.js).
 * @param {Object} templateModule - The default export from template.js
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateTemplate(templateModule) {
  const errors = [];
  const warnings = [];

  if (!templateModule || typeof templateModule !== 'object') {
    return { valid: false, errors: ['Template must export an object as default'], warnings };
  }

  if (!templateModule.category || typeof templateModule.category !== 'string') {
    errors.push('Template must have a category string');
  }

  if (!templateModule.description || typeof templateModule.description !== 'string') {
    errors.push('Template must have a description string');
  }

  if (typeof templateModule.template !== 'function') {
    errors.push('Template must have a template function');
    return { valid: false, errors, warnings };
  }

  // Try calling the template function
  try {
    const result = templateModule.template({});

    if (!result || typeof result !== 'object') {
      errors.push('template() must return an object');
      return { valid: false, errors, warnings };
    }

    if (!result.html || typeof result.html !== 'string') {
      errors.push('template() must return { html: string }');
    } else {
      // Check for at least one HTML tag
      if (!/<[a-zA-Z]/.test(result.html)) {
        errors.push('template() html must contain at least one HTML element');
      }
      // Security: no <script> tags
      if (/<script/i.test(result.html)) {
        errors.push('template() html must not contain <script> tags');
      }
    }

    if (!result.tokens || !Array.isArray(result.tokens)) {
      errors.push('template() must return { tokens: string[] }');
    }

    if (!result.a11y || typeof result.a11y !== 'object') {
      errors.push('template() must return { a11y: object }');
    }
  } catch (err) {
    errors.push(`template() threw an error: ${err.message}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// CSS VALIDATION
// ============================================================================

/**
 * Validate a component CSS file.
 * @param {string} cssContent - Raw CSS string
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateCSS(cssContent) {
  const errors = [];
  const warnings = [];

  if (!cssContent || typeof cssContent !== 'string') {
    return { valid: false, errors: ['CSS file must be a non-empty string'], warnings };
  }

  if (cssContent.trim().length === 0) {
    errors.push('CSS file is empty');
    return { valid: false, errors, warnings };
  }

  // Check for at least one class selector
  if (!/\.[a-z][\w-]*/i.test(cssContent)) {
    errors.push('CSS must contain at least one class selector');
  }

  // Warn on !important
  if (/!important/i.test(cssContent)) {
    warnings.push('CSS contains !important — consider removing for better composability');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Validate a DTCG token file.
 * @param {Object} tokensContent - Parsed JSON content
 * @param {string} componentName - Expected component name for namespace check
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateTokens(tokensContent, componentName) {
  const errors = [];
  const warnings = [];

  if (!tokensContent || typeof tokensContent !== 'object') {
    return { valid: false, errors: ['Tokens must be a JSON object'], warnings };
  }

  // Walk the token tree and validate DTCG format
  function walk(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue; // Skip meta keys at this level
      const currentPath = path ? `${path}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if ('$value' in value) {
          // This is a leaf token
          if (!('$type' in value)) {
            warnings.push(`Token "${currentPath}" has $value but no $type`);
          } else if (!VALID_TOKEN_TYPES.has(value.$type)) {
            warnings.push(`Token "${currentPath}" has unknown $type: "${value.$type}"`);
          }
        } else {
          // Nested group — recurse
          walk(value, currentPath);
        }
      }
    }
  }

  walk(tokensContent);

  // Check namespace — tokens should be under component.<name>
  const topKeys = Object.keys(tokensContent).filter(k => !k.startsWith('$'));
  for (const key of topKeys) {
    if (key !== 'component' && key !== componentName) {
      warnings.push(`Top-level key "${key}" is outside the component namespace — consider using "component.${componentName}.${key}"`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// FULL PACKAGE VALIDATION
// ============================================================================

/**
 * Validate an entire package directory.
 * @param {string} dirPath - Absolute path to the package directory
 * @returns {Promise<{ valid: boolean, errors: string[], warnings: string[], manifest: Object|null }>}
 */
export async function validatePackageDirectory(dirPath) {
  const allErrors = [];
  const allWarnings = [];
  let manifest = null;

  // 1. Check manifest.json
  const manifestPath = resolve(dirPath, 'manifest.json');
  if (!existsSync(manifestPath)) {
    allErrors.push('manifest.json not found');
    return { valid: false, errors: allErrors, warnings: allWarnings, manifest: null };
  }

  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (err) {
    allErrors.push(`manifest.json is not valid JSON: ${err.message}`);
    return { valid: false, errors: allErrors, warnings: allWarnings, manifest: null };
  }

  const manifestResult = validateManifest(manifest);
  allErrors.push(...manifestResult.errors);
  allWarnings.push(...manifestResult.warnings);

  // 2. Check template.js
  const templatePath = resolve(dirPath, 'template.js');
  if (!existsSync(templatePath)) {
    allErrors.push('template.js not found');
  } else {
    try {
      const templateUrl = pathToFileURL(templatePath).href;
      const mod = await import(templateUrl);
      const templateModule = mod.default;
      const templateResult = validateTemplate(templateModule);
      allErrors.push(...templateResult.errors);
      allWarnings.push(...templateResult.warnings);
    } catch (err) {
      allErrors.push(`template.js could not be loaded: ${err.message}`);
    }
  }

  // 3. Check styles.css
  const cssPath = resolve(dirPath, 'styles.css');
  if (!existsSync(cssPath)) {
    allErrors.push('styles.css not found');
  } else {
    const cssContent = readFileSync(cssPath, 'utf-8');
    const cssResult = validateCSS(cssContent);
    allErrors.push(...cssResult.errors);
    allWarnings.push(...cssResult.warnings);
  }

  // 4. Check tokens.json (optional)
  if (manifest && manifest.hasTokens) {
    const tokensPath = resolve(dirPath, 'tokens.json');
    if (!existsSync(tokensPath)) {
      allErrors.push('manifest declares hasTokens: true but tokens.json not found');
    } else {
      try {
        const tokensContent = JSON.parse(readFileSync(tokensPath, 'utf-8'));
        const tokensResult = validateTokens(tokensContent, manifest?.name);
        allErrors.push(...tokensResult.errors);
        allWarnings.push(...tokensResult.warnings);
      } catch (err) {
        allErrors.push(`tokens.json is not valid JSON: ${err.message}`);
      }
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    manifest,
  };
}
