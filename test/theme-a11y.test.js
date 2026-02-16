/**
 * Theme Accessibility Tests — WCAG AA Compliance for All Presets
 *
 * Validates that every theme preset produces accessible contrast ratios.
 * Also tests derivePalette() output and the validateThemeContrast agent action.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createDesignTokenAgent, getContrastRatio, parseColor } from '../lib/index.js';
import {
  THEME_PRESETS,
  hexToRgb,
  rgbToHex,
  mixColors,
  derivePalette,
} from '../lib/theme-presets.js';
import { createAccessibilityValidator } from '../agents/accessibility-validator-agent.js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensDir = resolve(__dirname, '..', 'tokens');

let tokenAgent;
let a11yAgent;

beforeAll(() => {
  tokenAgent = createDesignTokenAgent(tokensDir);
  a11yAgent = createAccessibilityValidator({ tokenAgent, targetLevel: 'AA' });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a token path: check overrides first, then fall back to token agent.
 */
function resolveColor(path, overrides) {
  if (overrides[path] !== undefined) return overrides[path];
  const r = tokenAgent.handleRequest({ action: 'get', path });
  if (!r.success || !r.data) return null;
  return r.data.resolvedValue || r.data.rawValue || r.data.$value || null;
}

/**
 * Alpha-composite rgba onto solid hex background.
 */
function compositeRgba(rgbaStr, bgHex) {
  const match = rgbaStr.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!match) return null;
  const [fr, fg, fb, alpha] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseFloat(match[4])];
  const bg = parseColor(bgHex);
  if (!bg) return null;
  return rgbToHex({
    r: Math.round(fr * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg * alpha + bg.g * (1 - alpha)),
    b: Math.round(fb * alpha + bg.b * (1 - alpha)),
  });
}

/**
 * Extract hex stops from a CSS gradient and check contrast against text.
 * Returns { allPass, worstRatio } or null if gradient is 'none'.
 */
function checkGradientContrast(textColor, gradientStr) {
  if (!gradientStr || gradientStr === 'none' || !gradientStr.includes('linear-gradient')) return null;
  const stops = gradientStr.match(/#[0-9a-fA-F]{6}/g);
  if (!stops || stops.length < 2) return null;
  const midpoint = mixColors(stops[0], stops[stops.length - 1], 0.5);
  const allPoints = [...stops, midpoint];
  const ratios = allPoints.map(s => getContrastRatio(textColor, s)).filter(r => r !== null);
  const worstRatio = Math.min(...ratios);
  return { allPass: worstRatio >= 4.5, worstRatio };
}

// ---------------------------------------------------------------------------
// Contrast pair definitions
// ---------------------------------------------------------------------------

const TEXT_PAIRS = [
  { fg: 'semantic.text.default', bg: 'semantic.surface.page.default', label: 'Body text on page' },
  { fg: 'semantic.text.secondary', bg: 'semantic.surface.page.default', label: 'Secondary on page' },
  { fg: 'semantic.text.muted', bg: 'semantic.surface.page.default', label: 'Muted on page' },
  { fg: 'semantic.text.link', bg: 'semantic.surface.page.default', label: 'Link on page' },
  { fg: 'semantic.text.default', bg: 'semantic.surface.card.default', label: 'Body text on card' },
  { fg: 'semantic.text.muted', bg: 'semantic.surface.card.default', label: 'Muted on card' },
];

const INTENT_PAIRS = [
  { fg: 'semantic.color.primary.default', bg: 'semantic.surface.page.default', label: 'Primary on page' },
  { fg: 'semantic.color.success.default', bg: 'semantic.surface.page.default', label: 'Success on page' },
  { fg: 'semantic.color.warning.default', bg: 'semantic.surface.page.default', label: 'Warning on page' },
  { fg: 'semantic.color.danger.default', bg: 'semantic.surface.page.default', label: 'Danger on page' },
];

const BUTTON_PAIRS = [
  { fg: 'component.button.primary.text', bg: 'component.button.primary.bg', label: 'Btn primary text/bg' },
  { fg: 'component.button.primary.text', bg: 'component.button.primary.bgHover', label: 'Btn primary text/hover' },
  { fg: 'component.button.danger.text', bg: 'component.button.danger.bg', label: 'Btn danger text/bg' },
];

const GRADIENT_TOKENS = [
  { text: 'component.button.primary.text', gradient: 'component.button.primary.gradient', label: 'Btn primary gradient' },
  { text: 'component.button.primary.text', gradient: 'component.button.primary.gradientHover', label: 'Btn primary grad hover' },
  { text: 'component.button.danger.text', gradient: 'component.button.danger.gradient', label: 'Btn danger gradient' },
];

// ---------------------------------------------------------------------------
// 1. Per-preset WCAG AA compliance
// ---------------------------------------------------------------------------

const presetNames = Object.keys(THEME_PRESETS);

describe('Theme preset WCAG AA compliance', () => {
  describe.each(presetNames)('preset: %s', (presetName) => {
    const overrides = THEME_PRESETS[presetName].overrides;

    it('all text pairs meet 4.5:1 AA contrast', () => {
      const pageBg = resolveColor('semantic.surface.page.default', overrides) || '#ffffff';
      const failures = [];

      for (const pair of TEXT_PAIRS) {
        let fg = resolveColor(pair.fg, overrides);
        let bg = resolveColor(pair.bg, overrides);
        if (!fg || !bg) continue;
        if (bg.startsWith('rgba')) bg = compositeRgba(bg, pageBg);
        if (!bg) continue;

        const ratio = getContrastRatio(fg, bg);
        if (ratio === null || ratio < 4.5) {
          failures.push(`${pair.label}: ${ratio?.toFixed(2) || '?'}:1`);
        }
      }

      expect(failures).toEqual([]);
    });

    it('all intent color pairs meet 4.5:1 AA contrast', () => {
      const failures = [];

      for (const pair of INTENT_PAIRS) {
        const fg = resolveColor(pair.fg, overrides);
        const bg = resolveColor(pair.bg, overrides);
        if (!fg || !bg) continue;

        const ratio = getContrastRatio(fg, bg);
        if (ratio === null || ratio < 4.5) {
          failures.push(`${pair.label}: ${ratio?.toFixed(2) || '?'}:1`);
        }
      }

      expect(failures).toEqual([]);
    });

    it('all button text/bg pairs meet 4.5:1 AA contrast', () => {
      const failures = [];

      for (const pair of BUTTON_PAIRS) {
        const fg = resolveColor(pair.fg, overrides);
        const bg = resolveColor(pair.bg, overrides);
        if (!fg || !bg) continue;

        const ratio = getContrastRatio(fg, bg);
        if (ratio === null || ratio < 4.5) {
          failures.push(`${pair.label}: ${ratio?.toFixed(2) || '?'}:1`);
        }
      }

      expect(failures).toEqual([]);
    });

    it('button gradients pass 4.5:1 at all stops and midpoint', () => {
      const failures = [];

      for (const gp of GRADIENT_TOKENS) {
        const textColor = resolveColor(gp.text, overrides);
        const gradient = resolveColor(gp.gradient, overrides);
        if (!textColor || !gradient) continue;

        const result = checkGradientContrast(textColor, gradient);
        if (result && !result.allPass) {
          failures.push(`${gp.label}: worst ${result.worstRatio.toFixed(2)}:1`);
        }
      }

      expect(failures).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. derivePalette() WCAG compliance
// ---------------------------------------------------------------------------

describe('derivePalette() WCAG compliance', () => {
  const testColors = [
    { hex: '#2563eb', name: 'blue (standard)' },
    { hex: '#fbbf24', name: 'yellow (very light)' },
    { hex: '#10b981', name: 'green (medium)' },
    { hex: '#ef4444', name: 'red (medium)' },
    { hex: '#8b5cf6', name: 'violet (light-ish)' },
    { hex: '#f97316', name: 'orange (light)' },
  ];

  it.each(testColors)('$name → primary.default passes 4.5:1 on white', ({ hex }) => {
    const palette = derivePalette(hex);
    const primary = palette['semantic.color.primary.default'];
    expect(primary).toBeDefined();
    const ratio = getContrastRatio(primary, '#ffffff');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(testColors)('$name → button.primary.bg passes 4.5:1 with white text', ({ hex }) => {
    const palette = derivePalette(hex);
    const bg = palette['component.button.primary.bg'];
    expect(bg).toBeDefined();
    const ratio = getContrastRatio('#ffffff', bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(testColors)('$name → hover shade is darker than default', ({ hex }) => {
    const palette = derivePalette(hex);
    const defaultRatio = getContrastRatio('#ffffff', palette['semantic.color.primary.default']);
    const hoverRatio = getContrastRatio('#ffffff', palette['semantic.color.primary.hover']);
    expect(hoverRatio).toBeGreaterThanOrEqual(defaultRatio);
  });
});

// ---------------------------------------------------------------------------
// 3. validateThemeContrast agent action
// ---------------------------------------------------------------------------

describe('AccessibilityValidatorAgent.validateThemeContrast', () => {
  it('returns valid:true for default preset (base tokens)', () => {
    const result = a11yAgent.handleRequest({
      action: 'validateThemeContrast',
      overrides: THEME_PRESETS.default.overrides,
    });
    expect(result.success).toBe(true);
    expect(result.data.valid).toBe(true);
    expect(result.data.summary.fail).toBe(0);
  });

  it('returns valid:true for darkLuxury preset', () => {
    const result = a11yAgent.handleRequest({
      action: 'validateThemeContrast',
      overrides: THEME_PRESETS.darkLuxury.overrides,
    });
    expect(result.success).toBe(true);
    expect(result.data.valid).toBe(true);
    expect(result.data.summary.fail).toBe(0);
  });

  it('returns valid:true for all presets', () => {
    for (const [name, preset] of Object.entries(THEME_PRESETS)) {
      const result = a11yAgent.handleRequest({
        action: 'validateThemeContrast',
        overrides: preset.overrides,
      });
      expect(result.success, `${name} handleRequest failed`).toBe(true);
      expect(result.data.valid, `${name} has contrast failures`).toBe(true);
    }
  });

  it('detects failures in intentionally bad overrides', () => {
    const badOverrides = {
      'semantic.text.default': '#cccccc', // light gray text on white → ~1.6:1
    };
    const result = a11yAgent.handleRequest({
      action: 'validateThemeContrast',
      overrides: badOverrides,
    });
    expect(result.success).toBe(true);
    expect(result.data.valid).toBe(false);
    expect(result.data.failures.length).toBeGreaterThan(0);
  });

  it('returns results with expected shape', () => {
    const result = a11yAgent.handleRequest({
      action: 'validateThemeContrast',
      overrides: {},
    });
    expect(result.data.summary).toHaveProperty('total');
    expect(result.data.summary).toHaveProperty('pass');
    expect(result.data.summary).toHaveProperty('fail');
    expect(result.data.results).toBeInstanceOf(Array);
    expect(result.data.failures).toBeInstanceOf(Array);
    expect(result.data.results.length).toBeGreaterThan(0);
  });
});
