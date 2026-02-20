#!/usr/bin/env node

/**
 * Aioli → Figma Token Transformer
 *
 * Reads DTCG token files and theme presets, outputs a single figma-tokens.json
 * payload that the Figma plugin consumes to create Variables, Styles, and Components.
 *
 * Usage: node figma/transform-tokens.js
 * Output: figma/figma-tokens.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TOKENS = join(ROOT, 'tokens');
const OUTPUT = join(__dirname, 'figma-tokens.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Parse a hex color to Figma RGBA (0-1 range).
 */
function hexToFigma(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const n = parseInt(hex, 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
    a: 1,
  };
}

/**
 * Parse rgba(r, g, b, a) string to Figma RGBA.
 */
function rgbaToFigma(str) {
  const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  return {
    r: parseFloat(m[1]) / 255,
    g: parseFloat(m[2]) / 255,
    b: parseFloat(m[3]) / 255,
    a: m[4] !== undefined ? parseFloat(m[4]) : 1,
  };
}

/**
 * Parse a color string (hex or rgba) to Figma RGBA.
 */
function parseColor(value) {
  if (typeof value !== 'string') return null;
  if (value.startsWith('#')) return hexToFigma(value);
  if (value.startsWith('rgb')) return rgbaToFigma(value);
  return null;
}

/**
 * Parse a dimension value to a number (px).
 */
function parseDimension(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const m = value.match(/^([\d.]+)\s*(px|rem)?$/);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (m[2] === 'rem') return num * 16; // 1rem = 16px
  return num;
}

/**
 * Check if a value is a DTCG reference like {primitive.color.blue.600}.
 */
function isReference(value) {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

/**
 * Convert a DTCG reference to a Figma variable path.
 * {primitive.color.blue.600} → primitives/color/blue/600
 * {semantic.color.primary.default} → semantic/color/primary/default
 * {component.button.primary.bg} → component/button/primary/bg
 */
function refToFigmaPath(ref) {
  const inner = ref.slice(1, -1); // strip { }
  const parts = inner.split('.');
  // Map DTCG tier prefixes to Figma collection names
  if (parts[0] === 'primitive') {
    parts[0] = 'primitives';
  }
  return parts.join('/');
}

/**
 * Determine the Figma variable type from a DTCG $type.
 */
function dtcgTypeToFigma(type) {
  switch (type) {
    case 'color': return 'COLOR';
    case 'dimension': return 'FLOAT';
    case 'number': return 'FLOAT';
    case 'fontWeight': return 'FLOAT';
    default: return null; // shadow, gradient, etc. → not Figma variables
  }
}

// ---------------------------------------------------------------------------
// Token walking
// ---------------------------------------------------------------------------

/**
 * Walk a DTCG token tree, collecting leaf tokens.
 * Each leaf has { path, $value, $type, $description }.
 * Inherits $type from parent groups per DTCG spec.
 */
function walkTokens(obj, path = [], inheritedType = null) {
  const results = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue; // skip meta keys at this level
    if (val && typeof val === 'object' && '$value' in val) {
      // Leaf token
      results.push({
        path: [...path, key],
        $value: val.$value,
        $type: val.$type || inheritedType,
        $description: val.$description || '',
      });
    } else if (val && typeof val === 'object') {
      // Group — may carry $type
      const groupType = val.$type || inheritedType;
      results.push(...walkTokens(val, [...path, key], groupType));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Process primitives
// ---------------------------------------------------------------------------

function processPrimitives() {
  const variables = {};
  const files = readdirSync(join(TOKENS, 'primitives')).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const data = readJSON(join(TOKENS, 'primitives', file));
    const tokens = walkTokens(data);

    for (const token of tokens) {
      const figmaType = dtcgTypeToFigma(token.$type);
      if (!figmaType) continue; // skip shadow, gradient, strokeStyle, fontFamily, etc.

      // Build Figma path: strip 'primitive' prefix, use / separator
      const figmaPath = token.path.slice(1).join('/'); // skip 'primitive'

      if (figmaType === 'COLOR') {
        const color = parseColor(token.$value);
        if (color) {
          variables[figmaPath] = { value: color, type: 'COLOR', description: token.$description };
        }
      } else if (figmaType === 'FLOAT') {
        const num = parseDimension(token.$value);
        if (num !== null) {
          variables[figmaPath] = { value: num, type: 'FLOAT', description: token.$description };
        }
      }
    }
  }

  return variables;
}

// ---------------------------------------------------------------------------
// Process semantic tokens
// ---------------------------------------------------------------------------

function processSemantic(primitiveVars) {
  const variables = {};
  const files = readdirSync(join(TOKENS, 'semantic')).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const data = readJSON(join(TOKENS, 'semantic', file));
    const tokens = walkTokens(data);

    for (const token of tokens) {
      const figmaType = dtcgTypeToFigma(token.$type);
      if (!figmaType) continue;

      const figmaPath = token.path.slice(1).join('/'); // skip 'semantic'

      if (isReference(token.$value)) {
        // Store as alias reference
        const aliasPath = refToFigmaPath(token.$value);
        variables[figmaPath] = { alias: aliasPath, type: figmaType, description: token.$description };
      } else if (figmaType === 'COLOR') {
        const color = parseColor(token.$value);
        if (color) {
          variables[figmaPath] = { value: color, type: 'COLOR', description: token.$description };
        }
      } else if (figmaType === 'FLOAT') {
        const num = parseDimension(token.$value);
        if (num !== null) {
          variables[figmaPath] = { value: num, type: 'FLOAT', description: token.$description };
        }
      }
    }
  }

  return variables;
}

// ---------------------------------------------------------------------------
// Process component tokens
// ---------------------------------------------------------------------------

function processComponents() {
  const variables = {};
  const files = readdirSync(join(TOKENS, 'components')).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const data = readJSON(join(TOKENS, 'components', file));
    const tokens = walkTokens(data);

    for (const token of tokens) {
      const figmaType = dtcgTypeToFigma(token.$type);
      if (!figmaType) continue;

      const figmaPath = token.path.slice(1).join('/'); // skip 'component'

      if (isReference(token.$value)) {
        const aliasPath = refToFigmaPath(token.$value);
        variables[figmaPath] = { alias: aliasPath, type: figmaType, description: token.$description };
      } else if (figmaType === 'COLOR') {
        const color = parseColor(token.$value);
        if (color) {
          variables[figmaPath] = { value: color, type: 'COLOR', description: token.$description };
        }
      } else if (figmaType === 'FLOAT') {
        const num = parseDimension(token.$value);
        if (num !== null) {
          variables[figmaPath] = { value: num, type: 'FLOAT', description: token.$description };
        }
      }
    }
  }

  return variables;
}

// ---------------------------------------------------------------------------
// Process theme presets
// ---------------------------------------------------------------------------

async function processThemes() {
  const { THEME_PRESETS } = await import(join(ROOT, 'lib', 'theme-presets.js'));
  const themes = {};

  for (const [name, preset] of Object.entries(THEME_PRESETS)) {
    const overrides = {};
    for (const [tokenPath, value] of Object.entries(preset.overrides)) {
      // Convert dot-notation token path to Figma path
      // e.g. 'semantic.surface.card.default' → 'surface/card/default' (semantic collection)
      // e.g. 'component.button.primary.bg' → 'button/primary/bg' (component collection)
      // e.g. 'primitive.radius.md' → 'radius/md' (primitives collection)
      const parts = tokenPath.split('.');
      const tier = parts[0]; // primitive, semantic, or component
      const figmaPath = parts.slice(1).join('/');

      // Try to parse the value
      const color = parseColor(value);
      if (color) {
        overrides[`${tier}/${figmaPath}`] = { value: color, type: 'COLOR' };
      } else {
        const num = parseDimension(value);
        if (num !== null) {
          overrides[`${tier}/${figmaPath}`] = { value: num, type: 'FLOAT' };
        }
        // Skip gradient/shadow string values that can't be Figma variables
      }
    }
    // Filter out primitive-tier overrides (Primitives collection has only 1 mode, can't override)
    let primitiveSkipped = 0;
    for (const key of Object.keys(overrides)) {
      if (key.startsWith('primitive/')) {
        delete overrides[key];
        primitiveSkipped++;
      }
    }
    if (primitiveSkipped > 0) {
      console.warn(`    ⚠ ${name}: skipped ${primitiveSkipped} primitive override(s) (Primitives has single mode)`);
    }

    themes[name] = {
      label: preset.label,
      description: preset.description,
      overrides,
    };
  }

  return themes;
}

// ---------------------------------------------------------------------------
// Dark mode overrides
// ---------------------------------------------------------------------------

/**
 * Build dark theme overrides from tokens/semantic/dark.json.
 * Maps dark namespace tokens to their light-mode counterparts.
 * e.g. semantic.color.dark.primary.default → semantic/color/primary/default
 */
function buildDarkThemeOverrides(primitiveVars) {
  const darkFile = join(TOKENS, 'semantic', 'dark.json');
  let darkData;
  try {
    darkData = readJSON(darkFile);
  } catch (_) {
    console.warn('  ⚠ tokens/semantic/dark.json not found, skipping dark mode');
    return {};
  }

  const tokens = walkTokens(darkData);
  const overrides = {};

  for (const token of tokens) {
    // token.path is like ['semantic', 'color', 'dark', 'primary', 'default']
    // or ['semantic', 'surface', 'dark', 'page', 'default']
    // We need to strip 'semantic' prefix and 'dark' from the category
    // to get the override path: 'color/primary/default'
    const parts = token.path.slice(1); // strip 'semantic'
    // Find and remove the 'dark' segment (always at index 1 in the remaining path)
    // parts = ['color', 'dark', 'primary', 'default']
    if (parts.length < 3 || parts[1] !== 'dark') continue;
    const overridePath = [parts[0], ...parts.slice(2)].join('/');

    // Resolve the value
    if (isReference(token.$value)) {
      // Resolve primitive reference like {primitive.color.blue.400}
      const refPath = refToFigmaPath(token.$value);
      // Strip collection prefix to look up in primitiveVars
      // refPath is like 'primitives/color/blue/400', primitiveVars key is 'color/blue/400'
      const primKey = refPath.replace(/^primitives\//, '');
      const resolved = primitiveVars[primKey];
      if (resolved && resolved.value) {
        overrides['semantic/' + overridePath] = { value: resolved.value, type: resolved.type };
      }
    } else {
      // Direct value (rgba string)
      const color = parseColor(token.$value);
      if (color) {
        overrides['semantic/' + overridePath] = { value: color, type: 'COLOR' };
      }
    }
  }

  return overrides;
}

// ---------------------------------------------------------------------------
// Color style definitions (for Figma Paint Styles)
// ---------------------------------------------------------------------------

function buildColorStyleDefs() {
  return [
    { name: 'Primary/Default', variablePath: 'color/primary/default', fallback: { r: 0.15, g: 0.39, b: 0.92 } },
    { name: 'Primary/Hover', variablePath: 'color/primary/hover', fallback: { r: 0.11, g: 0.33, b: 0.84 } },
    { name: 'Primary/Subtle', variablePath: 'color/primary/subtle', fallback: { r: 0.86, g: 0.92, b: 1 } },
    { name: 'Success/Default', variablePath: 'color/success/default', fallback: { r: 0.02, g: 0.53, b: 0.34 } },
    { name: 'Success/Hover', variablePath: 'color/success/hover', fallback: { r: 0.01, g: 0.44, b: 0.28 } },
    { name: 'Warning/Default', variablePath: 'color/warning/default', fallback: { r: 0.85, g: 0.47, b: 0.02 } },
    { name: 'Warning/Hover', variablePath: 'color/warning/hover', fallback: { r: 0.72, g: 0.39, b: 0.01 } },
    { name: 'Danger/Default', variablePath: 'color/danger/default', fallback: { r: 0.86, g: 0.15, b: 0.15 } },
    { name: 'Danger/Hover', variablePath: 'color/danger/hover', fallback: { r: 0.73, g: 0.11, b: 0.11 } },
    { name: 'Info/Default', variablePath: 'color/info/default', fallback: { r: 0.15, g: 0.39, b: 0.92 } },
    { name: 'Surface/Page', variablePath: 'surface/page/default', fallback: { r: 1, g: 1, b: 1 } },
    { name: 'Surface/Card', variablePath: 'surface/card/default', fallback: { r: 1, g: 1, b: 1 } },
    { name: 'Surface/Inverse', variablePath: 'surface/inverse/default', fallback: { r: 0.06, g: 0.09, b: 0.16 } },
    { name: 'Border/Default', variablePath: 'border/default', fallback: { r: 0.82, g: 0.84, b: 0.87 } },
    { name: 'Text/Default', variablePath: 'text/default', fallback: { r: 0.06, g: 0.09, b: 0.16 } },
    { name: 'Text/Muted', variablePath: 'text/muted', fallback: { r: 0.5, g: 0.52, b: 0.55 } },
    { name: 'Text/Link', variablePath: 'text/link', fallback: { r: 0.15, g: 0.39, b: 0.92 } },
  ];
}

// ---------------------------------------------------------------------------
// Text styles
// ---------------------------------------------------------------------------

function buildTextStyles() {
  return [
    { name: 'Display/Large', fontFamily: 'Inter', fontSize: 60, fontWeight: 800, lineHeight: 1.0, letterSpacing: -0.03 },
    { name: 'Display/Medium', fontFamily: 'Inter', fontSize: 48, fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.025 },
    { name: 'Heading/H1', fontFamily: 'Inter', fontSize: 36, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.02 },
    { name: 'Heading/H2', fontFamily: 'Inter', fontSize: 30, fontWeight: 600, lineHeight: 1.25, letterSpacing: -0.015 },
    { name: 'Heading/H3', fontFamily: 'Inter', fontSize: 24, fontWeight: 600, lineHeight: 1.3, letterSpacing: -0.01 },
    { name: 'Heading/H4', fontFamily: 'Inter', fontSize: 20, fontWeight: 600, lineHeight: 1.35, letterSpacing: -0.005 },
    { name: 'Body/Large', fontFamily: 'Inter', fontSize: 18, fontWeight: 400, lineHeight: 1.6, letterSpacing: 0 },
    { name: 'Body/Default', fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },
    { name: 'Body/Small', fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0 },
    { name: 'Caption', fontFamily: 'Inter', fontSize: 12, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0.005 },
    { name: 'Label/Default', fontFamily: 'Inter', fontSize: 14, fontWeight: 500, lineHeight: 1.0, letterSpacing: 0.01 },
    { name: 'Label/Small', fontFamily: 'Inter', fontSize: 12, fontWeight: 500, lineHeight: 1.0, letterSpacing: 0.01 },
    { name: 'Code/Default', fontFamily: 'SFMono-Regular', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },
  ];
}

// ---------------------------------------------------------------------------
// Effect styles (shadows)
// ---------------------------------------------------------------------------

function buildEffectStyles() {
  return [
    {
      name: 'Shadow/XS',
      effects: [
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.05 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0 },
      ],
    },
    {
      name: 'Shadow/SM',
      effects: [
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 1 }, radius: 3, spread: 0 },
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 1 }, radius: 2, spread: -1 },
      ],
    },
    {
      name: 'Shadow/MD',
      effects: [
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 6, spread: -1 },
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 2 }, radius: 4, spread: -2 },
      ],
    },
    {
      name: 'Shadow/LG',
      effects: [
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 10 }, radius: 15, spread: -3 },
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 6, spread: -4 },
      ],
    },
    {
      name: 'Shadow/XL',
      effects: [
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 20 }, radius: 25, spread: -5 },
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 8 }, radius: 10, spread: -6 },
      ],
    },
    {
      name: 'Shadow/2XL',
      effects: [
        { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.25 }, offset: { x: 0, y: 25 }, radius: 50, spread: -12 },
      ],
    },
    {
      name: 'Shadow/Inner',
      effects: [
        { type: 'INNER_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.06 }, offset: { x: 0, y: 2 }, radius: 4, spread: 0 },
      ],
    },
    {
      name: 'Focus/Ring',
      effects: [
        { type: 'DROP_SHADOW', color: { r: 0.231, g: 0.510, b: 0.965, a: 0.5 }, offset: { x: 0, y: 0 }, radius: 0, spread: 2 },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Component definitions for the plugin
// ---------------------------------------------------------------------------

function buildComponentDefs() {
  return [
    // ATOMS
    {
      name: 'Button', category: 'atom',
      variants: { Variant: ['primary', 'secondary', 'danger', 'success', 'outline', 'ghost'], Size: ['xs', 'sm', 'md', 'lg', 'xl'], State: ['default', 'hover', 'focus', 'disabled'] },
      defaultVariant: { Variant: 'primary', Size: 'md', State: 'default' },
      tokens: { fill: 'component/button/{Variant}/bg', text: 'component/button/{Variant}/text', radius: 'component/button/radius' },
    },
    {
      name: 'Input', category: 'atom',
      variants: { State: ['default', 'focus', 'error', 'disabled'] },
      defaultVariant: { State: 'default' },
      tokens: { fill: 'semantic/surface/page/default', border: 'semantic/border/default', text: 'semantic/text/default', radius: 'component/input/radius' },
    },
    {
      name: 'Badge', category: 'atom',
      variants: { Variant: ['primary', 'secondary', 'success', 'warning', 'danger'], Size: ['sm', 'md', 'lg'] },
      defaultVariant: { Variant: 'primary', Size: 'md' },
      tokens: { fill: 'semantic/color/{Variant}/subtle', text: 'semantic/color/{Variant}/default' },
    },
    {
      name: 'Avatar', category: 'atom',
      variants: { Size: ['xs', 'sm', 'md', 'lg'], Shape: ['circle', 'square'] },
      defaultVariant: { Size: 'md', Shape: 'circle' },
      tokens: { fill: 'semantic/color/primary/subtle', text: 'semantic/color/primary/default' },
    },
    {
      name: 'Spinner', category: 'atom',
      variants: { Size: ['sm', 'md', 'lg'] },
      defaultVariant: { Size: 'md' },
      tokens: { stroke: 'semantic/color/primary/default' },
    },
    {
      name: 'Link', category: 'atom',
      variants: { State: ['default', 'hover', 'visited'] },
      defaultVariant: { State: 'default' },
      tokens: { text: 'semantic/text/link' },
    },
    {
      name: 'Chip', category: 'atom',
      variants: { Variant: ['default', 'primary', 'success'], Removable: ['true', 'false'] },
      defaultVariant: { Variant: 'default', Removable: 'false' },
      tokens: { fill: 'semantic/surface/page/subtle', text: 'semantic/text/default', border: 'semantic/border/default' },
    },
    {
      name: 'Divider', category: 'atom',
      variants: { Orientation: ['horizontal', 'vertical'] },
      defaultVariant: { Orientation: 'horizontal' },
      tokens: { stroke: 'semantic/border/default' },
    },
    {
      name: 'Skeleton', category: 'atom',
      variants: { Type: ['text', 'circle', 'rectangle'] },
      defaultVariant: { Type: 'text' },
      tokens: { fill: 'semantic/surface/page/muted' },
    },
    {
      name: 'Progress', category: 'atom',
      variants: { Variant: ['primary', 'success', 'warning'], Size: ['sm', 'md'] },
      defaultVariant: { Variant: 'primary', Size: 'md' },
      tokens: { fill: 'semantic/color/{Variant}/default', track: 'semantic/surface/page/muted' },
    },
    {
      name: 'Checkbox', category: 'atom',
      variants: { Checked: ['unchecked', 'checked', 'indeterminate'], State: ['default', 'focus', 'disabled'] },
      defaultVariant: { Checked: 'unchecked', State: 'default' },
      tokens: { fill: 'semantic/color/primary/default', border: 'semantic/border/default' },
    },
    {
      name: 'Radio', category: 'atom',
      variants: { Selected: ['false', 'true'], State: ['default', 'focus', 'disabled'] },
      defaultVariant: { Selected: 'false', State: 'default' },
      tokens: { fill: 'semantic/color/primary/default', border: 'semantic/border/default' },
    },
    {
      name: 'Rating', category: 'atom',
      variants: { Size: ['sm', 'md', 'lg'], Interactive: ['true', 'false'] },
      defaultVariant: { Size: 'md', Interactive: 'false' },
      tokens: { fillActive: 'primitives/color/amber/400', fillEmpty: 'semantic/border/subtle' },
    },
    {
      name: 'Toggle', category: 'atom',
      variants: { State: ['off', 'on'], Size: ['sm', 'md'] },
      defaultVariant: { State: 'off', Size: 'md' },
      tokens: { fillOn: 'semantic/color/primary/default', fillOff: 'semantic/border/default' },
    },

    // MOLECULES
    {
      name: 'Tooltip', category: 'molecule',
      variants: { Position: ['top', 'right', 'bottom', 'left'] },
      defaultVariant: { Position: 'top' },
      tokens: { fill: 'semantic/surface/inverse/default', text: 'semantic/text/inverse' },
    },
    {
      name: 'Select', category: 'molecule',
      variants: { State: ['default', 'open', 'error', 'disabled'] },
      defaultVariant: { State: 'default' },
      tokens: { fill: 'semantic/surface/page/default', border: 'semantic/border/default', text: 'semantic/text/default' },
    },
    {
      name: 'Textarea', category: 'molecule',
      variants: { State: ['default', 'focus', 'error', 'disabled'] },
      defaultVariant: { State: 'default' },
      tokens: { fill: 'semantic/surface/page/default', border: 'semantic/border/default', text: 'semantic/text/default' },
    },
    {
      name: 'Alert', category: 'molecule',
      variants: { Variant: ['info', 'success', 'warning', 'danger', 'error'], Dismissible: ['true', 'false'] },
      defaultVariant: { Variant: 'info', Dismissible: 'false' },
      tokens: { fill: 'semantic/color/{Variant}/subtle', text: 'semantic/color/{Variant}/default', border: 'semantic/color/{Variant}/default', muted: 'semantic/text/muted' },
    },
    {
      name: 'Tabs', category: 'molecule',
      variants: { Count: ['2', '3', '4'] },
      defaultVariant: { Count: '3' },
      tokens: { fill: 'semantic/surface/page/default', activeText: 'semantic/color/primary/default', border: 'semantic/border/default' },
    },
    {
      name: 'Accordion', category: 'molecule',
      variants: { Expanded: ['false', 'true'] },
      defaultVariant: { Expanded: 'false' },
      tokens: { fill: 'semantic/surface/page/default', text: 'semantic/text/default', border: 'semantic/border/default' },
    },
    {
      name: 'Dropdown', category: 'molecule',
      variants: { State: ['closed', 'open'] },
      defaultVariant: { State: 'closed' },
      tokens: { fill: 'semantic/surface/card/default', text: 'semantic/text/default', border: 'semantic/border/default', subtleFill: 'semantic/surface/page/subtle' },
    },
    {
      name: 'Toast', category: 'molecule',
      variants: { Variant: ['info', 'success', 'warning', 'error'] },
      defaultVariant: { Variant: 'info' },
      tokens: { fill: 'semantic/surface/card/default', text: 'semantic/text/default', border: 'semantic/color/{Variant}/default', muted: 'semantic/text/muted' },
    },
    {
      name: 'Breadcrumb', category: 'molecule',
      variants: { Items: ['2', '3', '4'] },
      defaultVariant: { Items: '3' },
      tokens: { text: 'semantic/text/muted', activeText: 'semantic/text/default' },
    },
    {
      name: 'Pagination', category: 'molecule',
      variants: {},
      defaultVariant: {},
      tokens: { fill: 'semantic/color/primary/default', text: 'semantic/text/default', border: 'semantic/border/default' },
    },
    {
      name: 'Stepper', category: 'molecule',
      variants: { Steps: ['3', '4', '5'] },
      defaultVariant: { Steps: '3' },
      tokens: { fillActive: 'semantic/color/primary/default', fillComplete: 'semantic/color/success/default', text: 'semantic/text/default' },
    },
    {
      name: 'Popover', category: 'molecule',
      variants: { Position: ['top', 'right', 'bottom', 'left'] },
      defaultVariant: { Position: 'bottom' },
      tokens: { fill: 'semantic/surface/card/default', text: 'semantic/text/default', border: 'semantic/border/default' },
    },
    {
      name: 'Form Group', category: 'molecule',
      variants: { Fields: ['2', '3', '4'] },
      defaultVariant: { Fields: '3' },
      tokens: { fill: 'semantic/surface/page/default', text: 'semantic/text/default', border: 'semantic/border/default', muted: 'semantic/text/muted' },
    },
    {
      name: 'Search Autocomplete', category: 'molecule',
      variants: { State: ['closed', 'open'] },
      defaultVariant: { State: 'closed' },
      tokens: { fill: 'semantic/surface/card/default', text: 'semantic/text/default', border: 'semantic/border/default' },
    },

    // ORGANISMS
    {
      name: 'Card', category: 'organism',
      variants: { Variant: ['default', 'elevated', 'outlined'] },
      defaultVariant: { Variant: 'default' },
      tokens: { fill: 'component/card/bg/default', border: 'component/card/border/color', radius: 'component/card/radius' },
    },
    {
      name: 'Modal', category: 'organism',
      variants: { Size: ['sm', 'md', 'lg'] },
      defaultVariant: { Size: 'md' },
      tokens: { fill: 'semantic/surface/card/default', text: 'semantic/text/default', overlay: 'semantic/surface/inverse/default' },
    },
    {
      name: 'Table', category: 'organism',
      variants: { Rows: ['3', '5'] },
      defaultVariant: { Rows: '3' },
      tokens: { fill: 'semantic/surface/page/default', text: 'semantic/text/default', border: 'semantic/border/subtle', headerFill: 'semantic/surface/page/subtle', headerText: 'semantic/text/muted' },
    },
    {
      name: 'Navigation', category: 'organism',
      variants: {},
      defaultVariant: {},
      tokens: { fill: 'semantic/surface/page/default', text: 'semantic/text/default', accent: 'semantic/color/primary/default' },
    },
    {
      name: 'Card Product', category: 'organism',
      variants: { Variant: ['default', 'elevated', 'outlined'] },
      defaultVariant: { Variant: 'default' },
      tokens: { fill: 'component/card/bg/default', border: 'component/card/border/color', radius: 'component/card/radius' },
    },
    {
      name: 'Card Profile', category: 'organism',
      variants: {},
      defaultVariant: {},
      tokens: { fill: 'component/card/bg/default', text: 'semantic/text/default' },
    },
    {
      name: 'Card Stats', category: 'organism',
      variants: { Direction: ['up', 'down'] },
      defaultVariant: { Direction: 'up' },
      tokens: { fill: 'component/card/bg/default', text: 'semantic/text/default', positive: 'semantic/color/success/default', negative: 'semantic/color/danger/default' },
    },
    {
      name: 'Hero', category: 'organism',
      variants: { Alignment: ['left', 'center', 'right'] },
      defaultVariant: { Alignment: 'left' },
      tokens: { fill: 'semantic/surface/page/default', text: 'semantic/text/default', accent: 'semantic/color/primary/default' },
    },
    {
      name: 'Feature Grid', category: 'organism',
      variants: { Columns: ['2', '3', '4'] },
      defaultVariant: { Columns: '3' },
      tokens: { fill: 'semantic/surface/card/default', text: 'semantic/text/default', accent: 'semantic/color/primary/default' },
    },
    {
      name: 'Pricing Table', category: 'organism',
      variants: { Highlighted: ['false', 'true'] },
      defaultVariant: { Highlighted: 'false' },
      tokens: { fill: 'semantic/surface/card/default', text: 'semantic/text/default', accent: 'semantic/color/primary/default', muted: 'semantic/text/muted', success: 'semantic/color/success/default', border: 'semantic/border/subtle' },
    },
    {
      name: 'Data Table', category: 'organism',
      variants: {},
      defaultVariant: {},
      tokens: { fill: 'semantic/surface/page/default', text: 'semantic/text/default', border: 'semantic/border/subtle', headerFill: 'semantic/surface/page/subtle', headerText: 'semantic/text/muted' },
    },
    {
      name: 'Form Wizard', category: 'organism',
      variants: { Steps: ['2', '3', '4'] },
      defaultVariant: { Steps: '3' },
      tokens: { fill: 'semantic/surface/page/default', text: 'semantic/text/default', accent: 'semantic/color/primary/default', stepFill: 'semantic/surface/page/subtle', stepActive: 'semantic/color/primary/subtle', muted: 'semantic/text/muted' },
    },

    // TEMPLATES
    {
      name: 'Layout Dashboard', category: 'template',
      variants: {},
      defaultVariant: {},
      tokens: { fill: 'semantic/surface/page/subtle', sidebar: 'semantic/surface/card/default', text: 'semantic/text/default', accent: 'semantic/color/primary/default', accentSubtle: 'semantic/color/primary/subtle', muted: 'semantic/text/muted', cardFill: 'semantic/surface/card/default', border: 'semantic/border/subtle' },
    },
    {
      name: 'Layout Marketing', category: 'template',
      variants: {},
      defaultVariant: {},
      tokens: { fill: 'semantic/surface/page/default', text: 'semantic/text/default', accent: 'semantic/color/primary/default', muted: 'semantic/text/muted', subtleFill: 'semantic/surface/page/subtle', border: 'semantic/border/subtle' },
    },
    {
      name: 'Layout Blog', category: 'template',
      variants: {},
      defaultVariant: {},
      tokens: { fill: 'semantic/surface/page/default', text: 'semantic/text/default', accent: 'semantic/color/primary/default', muted: 'semantic/text/muted', subtleFill: 'semantic/surface/page/subtle', border: 'semantic/border/subtle' },
    },
  ];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Aioli → Figma token transform\n');

  // 1. Process all token tiers
  console.log('Processing primitives...');
  const primitives = processPrimitives();
  console.log(`  → ${Object.keys(primitives).length} variables`);

  console.log('Processing semantic tokens...');
  const semantic = processSemantic(primitives);
  console.log(`  → ${Object.keys(semantic).length} variables`);

  console.log('Processing component tokens...');
  const component = processComponents();
  console.log(`  → ${Object.keys(component).length} variables`);

  // 2. Process theme presets
  console.log('Processing theme presets...');
  const themes = await processThemes();

  // Add dark mode theme
  console.log('Building dark mode overrides...');
  const darkOverrides = buildDarkThemeOverrides(primitives);
  themes['dark'] = {
    label: 'Dark',
    description: 'Standard dark mode with WCAG AA compliant contrast',
    overrides: darkOverrides,
  };
  console.log(`  → ${Object.keys(themes).length} themes (${Object.keys(darkOverrides).length} dark overrides)`);

  // 3. Build styles
  const textStyles = buildTextStyles();
  const effectStyles = buildEffectStyles();
  const colorStyles = buildColorStyleDefs();
  console.log(`Built ${textStyles.length} text styles, ${effectStyles.length} effect styles, ${colorStyles.length} color styles`);

  // 4. Build component definitions
  const components = buildComponentDefs();
  console.log(`Built ${components.length} component definitions`);

  // 5. Write output
  const output = {
    meta: {
      generator: 'aioli-figma-transform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      stats: {
        primitiveVars: Object.keys(primitives).length,
        semanticVars: Object.keys(semantic).length,
        componentVars: Object.keys(component).length,
        totalVars: Object.keys(primitives).length + Object.keys(semantic).length + Object.keys(component).length,
        themes: Object.keys(themes).length,
        textStyles: textStyles.length,
        effectStyles: effectStyles.length,
        colorStyles: colorStyles.length,
        components: components.length,
      },
    },
    variables: {
      primitives,
      semantic,
      component,
    },
    themes,
    textStyles,
    effectStyles,
    colorStyles,
    components,
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${OUTPUT}`);
  console.log(`Total: ${output.meta.stats.totalVars} variables, ${textStyles.length + effectStyles.length} styles, ${components.length} components`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
