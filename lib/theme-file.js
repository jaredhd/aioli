/**
 * Aioli Theme File — .aioli-theme.json I/O
 *
 * Portable file format for importing, exporting, and sharing brand themes.
 * Schema version: aioli-theme/v1
 */

import { deriveBrandTheme, validateTheme, THEME_PRESETS } from './theme-presets.js';
import { createTheme } from './theme.js';

// ============================================================================
// SCHEMA CONSTANTS
// ============================================================================

export const THEME_FILE_VERSION = 'aioli-theme/v1';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const VALID_PRESETS = Object.keys(THEME_PRESETS);

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a parsed .aioli-theme.json object against the schema.
 *
 * @param {object} json - Parsed JSON content
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateThemeFile(json) {
  const errors = [];

  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { valid: false, errors: ['Theme file must be a JSON object'] };
  }

  // name: required string
  if (!json.name || typeof json.name !== 'string') {
    errors.push('Missing or invalid "name" (must be a non-empty string)');
  }

  // brand: required object with at least primary
  if (!json.brand || typeof json.brand !== 'object' || Array.isArray(json.brand)) {
    errors.push('Missing or invalid "brand" (must be an object)');
  } else {
    if (!json.brand.primary || !HEX_RE.test(json.brand.primary)) {
      errors.push('brand.primary is required and must be a 6-digit hex color (e.g. "#2563eb")');
    }
    const optionalColors = ['secondary', 'accent', 'neutral', 'success', 'danger'];
    for (const key of optionalColors) {
      if (json.brand[key] !== undefined && json.brand[key] !== null) {
        if (!HEX_RE.test(json.brand[key])) {
          errors.push(`brand.${key} must be a 6-digit hex color if provided`);
        }
      }
    }
  }

  // options: optional object
  if (json.options !== undefined) {
    if (typeof json.options !== 'object' || Array.isArray(json.options)) {
      errors.push('"options" must be an object if provided');
    } else {
      if (json.options.preset !== undefined && !VALID_PRESETS.includes(json.options.preset)) {
        errors.push(`options.preset "${json.options.preset}" is not valid. Available: ${VALID_PRESETS.join(', ')}`);
      }
      if (json.options.radius !== undefined && typeof json.options.radius !== 'string') {
        errors.push('options.radius must be a CSS dimension string (e.g. "8px")');
      }
      if (json.options.font !== undefined && typeof json.options.font !== 'string') {
        errors.push('options.font must be a font family string');
      }
    }
  }

  // overrides: optional object
  if (json.overrides !== undefined) {
    if (typeof json.overrides !== 'object' || Array.isArray(json.overrides)) {
      errors.push('"overrides" must be an object if provided');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// IMPORT
// ============================================================================

/**
 * Import a .aioli-theme.json file and generate a complete set of theme overrides.
 *
 * @param {object} json - Parsed .aioli-theme.json content
 * @returns {{ overrides: Record<string, string>, theme: object, validation: object, metadata: object }}
 * @throws {Error} If the file is invalid
 */
export function importThemeFile(json) {
  const { valid, errors } = validateThemeFile(json);
  if (!valid) {
    throw new Error(`Invalid theme file: ${errors.join('; ')}`);
  }

  // Build deriveBrandTheme config from the file
  const config = {
    primary: json.brand.primary,
  };
  if (json.brand.secondary) config.secondary = json.brand.secondary;
  if (json.brand.accent) config.accent = json.brand.accent;
  if (json.brand.neutral) config.neutral = json.brand.neutral;
  if (json.brand.success) config.success = json.brand.success;
  if (json.brand.danger) config.danger = json.brand.danger;
  if (json.options) config.options = json.options;

  // Generate base overrides from brand colors
  const brandOverrides = deriveBrandTheme(config);

  // Merge manual overrides on top
  const finalOverrides = json.overrides
    ? { ...brandOverrides, ...json.overrides }
    : brandOverrides;

  // Create theme object
  const theme = createTheme(finalOverrides);

  // Validate the resulting theme
  const validation = validateTheme(finalOverrides);

  return {
    overrides: finalOverrides,
    theme,
    validation,
    metadata: {
      name: json.name,
      schema: json.$schema || THEME_FILE_VERSION,
      brand: { ...json.brand },
      options: json.options ? { ...json.options } : {},
    },
  };
}

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Export a .aioli-theme.json file from the current theme state.
 *
 * @param {object} config
 * @param {string} config.name - Theme name (required)
 * @param {object} config.brand - Brand colors (at least primary required)
 * @param {object} [config.options] - Theme options
 * @param {Record<string, string>} [config.overrides] - Manual overrides
 * @returns {string} JSON string ready to write to a file
 */
export function exportThemeFile(config) {
  if (!config || !config.name || !config.brand || !config.brand.primary) {
    throw new Error('exportThemeFile: name and brand.primary are required');
  }

  const themeFile = {
    $schema: THEME_FILE_VERSION,
    name: config.name,
    brand: { ...config.brand },
  };

  // Only include non-empty sections
  if (config.options && Object.keys(config.options).length > 0) {
    themeFile.options = { ...config.options };
  }

  if (config.overrides && Object.keys(config.overrides).length > 0) {
    themeFile.overrides = { ...config.overrides };
  }

  return JSON.stringify(themeFile, null, 2);
}
