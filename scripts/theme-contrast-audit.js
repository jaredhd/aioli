#!/usr/bin/env node
/**
 * WCAG AA contrast audit for all 6 Aioli theme presets.
 *
 * Checks every preset's token overrides against the standard contrast pairs
 * (text on surfaces, button text on button bg, intent colors, gradients).
 *
 * Usage:
 *   node scripts/theme-contrast-audit.js
 */
import { THEME_PRESETS, hexToRgb, rgbToHex, mixColors } from '../lib/theme-presets.js';
import { createDesignTokenAgent, getContrastRatio, parseColor } from '../lib/index.js';

const tokenAgent = createDesignTokenAgent('./tokens');

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve a token path: check theme overrides first, then fall back to token agent.
 * @param {string} path - Token path (e.g. 'semantic.text.default')
 * @param {Record<string, string>} overrides - Theme preset overrides
 * @param {object} agent - Design token agent instance
 * @returns {string|null} Resolved color value or null
 */
function resolveThemeColor(path, overrides, agent) {
  if (overrides[path] !== undefined) return overrides[path];
  const r = agent.handleRequest({ action: 'get', path });
  if (!r.success || !r.data) return null;
  const val = r.data.resolvedValue || r.data.rawValue || r.data.$value;
  return typeof val === 'string' ? val : null;
}

/**
 * Alpha-composite an rgba() color onto a solid hex background.
 * @param {string} rgbaStr - CSS rgba() string
 * @param {string} bgHex - Background hex color
 * @returns {string|null} Composited hex color or null
 */
function compositeRgba(rgbaStr, bgHex) {
  const match = rgbaStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
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
 * Extract hex color stops from a CSS linear-gradient string.
 * @param {string} gradientStr - CSS linear-gradient string
 * @returns {string[]} Array of hex color strings
 */
function extractGradientStops(gradientStr) {
  const hexMatches = gradientStr.match(/#[0-9a-fA-F]{6}/g);
  return hexMatches || [];
}

/**
 * Check contrast of text color against all gradient stops + interpolated midpoint.
 * @param {string} textColor - Hex color of the text
 * @param {string} gradientStr - CSS linear-gradient string
 * @returns {object|null} Contrast results or null if insufficient stops
 */
function checkGradientContrast(textColor, gradientStr) {
  const stops = extractGradientStops(gradientStr);
  if (stops.length < 2) return null;
  const midpoint = mixColors(stops[0], stops[stops.length - 1], 0.5);
  const allPoints = [...stops, midpoint];
  const results = allPoints.map(stop => ({
    stop,
    ratio: getContrastRatio(textColor, stop),
  }));
  const worstRatio = Math.min(...results.map(r => r.ratio).filter(r => r !== null));
  return { stops, midpoint, results, worstRatio, allPass: worstRatio >= 4.5 };
}

// ============================================================================
// CONTRAST PAIRS
// ============================================================================

const CONTRAST_PAIRS = [
  // Text hierarchy on page surface
  { fg: 'semantic.text.default', bg: 'semantic.surface.page.default', label: 'Body text on page', type: 'text' },
  { fg: 'semantic.text.secondary', bg: 'semantic.surface.page.default', label: 'Secondary on page', type: 'text' },
  { fg: 'semantic.text.muted', bg: 'semantic.surface.page.default', label: 'Muted on page', type: 'text' },
  { fg: 'semantic.text.link', bg: 'semantic.surface.page.default', label: 'Link on page', type: 'text' },

  // Text on card surface
  { fg: 'semantic.text.default', bg: 'semantic.surface.card.default', label: 'Body text on card', type: 'text' },
  { fg: 'semantic.text.muted', bg: 'semantic.surface.card.default', label: 'Muted on card', type: 'text' },

  // Intent colors on page
  { fg: 'semantic.color.primary.default', bg: 'semantic.surface.page.default', label: 'Primary on page', type: 'text' },
  { fg: 'semantic.color.success.default', bg: 'semantic.surface.page.default', label: 'Success on page', type: 'text' },
  { fg: 'semantic.color.warning.default', bg: 'semantic.surface.page.default', label: 'Warning on page', type: 'text' },
  { fg: 'semantic.color.danger.default', bg: 'semantic.surface.page.default', label: 'Danger on page', type: 'text' },

  // Button text on button bg
  { fg: 'component.button.primary.text', bg: 'component.button.primary.bg', label: 'Btn primary text/bg', type: 'text' },
  { fg: 'component.button.primary.text', bg: 'component.button.primary.bg-hover', label: 'Btn primary text/hover', type: 'text' },
  { fg: 'component.button.primary.text', bg: 'component.button.primary.bg-active', label: 'Btn primary text/active', type: 'ui' },
  { fg: 'component.button.danger.text', bg: 'component.button.danger.bg', label: 'Btn danger text/bg', type: 'text' },
  { fg: 'component.button.secondary.text', bg: 'component.button.secondary.bg', label: 'Btn secondary text/bg', type: 'text' },
  { fg: 'component.button.outline.text', bg: 'semantic.surface.page.default', label: 'Btn outline text/page', type: 'text' },
  { fg: 'component.button.ghost.text', bg: 'semantic.surface.page.default', label: 'Btn ghost text/page', type: 'text' },
];

const GRADIENT_PAIRS = [
  { text: 'component.button.primary.text', gradient: 'component.button.primary.gradient', label: 'Btn primary gradient' },
  { text: 'component.button.primary.text', gradient: 'component.button.primary.gradient-hover', label: 'Btn primary grad hover' },
  { text: 'component.button.danger.text', gradient: 'component.button.danger.gradient', label: 'Btn danger gradient' },
  { text: 'component.button.danger.text', gradient: 'component.button.danger.gradient-hover', label: 'Btn danger grad hover' },
];

// ============================================================================
// MAIN AUDIT
// ============================================================================

console.log('\nWCAG Theme Preset Contrast Audit');
console.log('='.repeat(100));

let globalPass = 0;
let globalFail = 0;
let globalSkip = 0;
const allFailures = [];

for (const [presetKey, preset] of Object.entries(THEME_PRESETS)) {
  const { name, label, overrides } = preset;

  console.log(`\x1b[36m\x1b[1m\n${'='.repeat(2)} PRESET: ${name} (${label}) ${'='.repeat(2)}\x1b[0m`);
  console.log('-'.repeat(100));
  console.log(
    'Pair'.padEnd(28),
    'FG'.padEnd(10),
    'BG'.padEnd(10),
    'Ratio'.padEnd(9),
    'Threshold'.padEnd(12),
    'Result'
  );
  console.log('-'.repeat(100));

  let presetPass = 0;
  let presetFail = 0;
  let presetSkip = 0;

  // Resolve page background once (needed for rgba compositing)
  const pageBg = resolveThemeColor('semantic.surface.page.default', overrides, tokenAgent);

  // ── Solid contrast pairs ──
  for (const pair of CONTRAST_PAIRS) {
    let fgVal = resolveThemeColor(pair.fg, overrides, tokenAgent);
    let bgVal = resolveThemeColor(pair.bg, overrides, tokenAgent);

    if (!fgVal || !bgVal) {
      console.log(pair.label.padEnd(28), `SKIP - missing: ${!fgVal ? pair.fg : pair.bg}`);
      presetSkip++;
      globalSkip++;
      continue;
    }

    // If bg is rgba, composite against page background
    if (bgVal.startsWith('rgba(') && pageBg) {
      const composited = compositeRgba(bgVal, pageBg);
      if (composited) {
        bgVal = composited;
      } else {
        console.log(pair.label.padEnd(28), `SKIP - can't composite rgba bg`);
        presetSkip++;
        globalSkip++;
        continue;
      }
    }

    // If fg is rgba, composite against the resolved bg
    if (fgVal.startsWith('rgba(')) {
      const composited = compositeRgba(fgVal, bgVal);
      if (composited) {
        fgVal = composited;
      } else {
        console.log(pair.label.padEnd(28), `SKIP - can't composite rgba fg`);
        presetSkip++;
        globalSkip++;
        continue;
      }
    }

    try {
      const ratio = getContrastRatio(fgVal, bgVal);
      if (ratio === null) {
        console.log(pair.label.padEnd(28), `SKIP - can't parse: fg=${fgVal} bg=${bgVal}`);
        presetSkip++;
        globalSkip++;
        continue;
      }

      const threshold = pair.type === 'ui' ? 3.0 : 4.5;
      const pass = ratio >= threshold;
      const resultStr = pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';

      if (pass) {
        presetPass++;
        globalPass++;
      } else {
        presetFail++;
        globalFail++;
        allFailures.push({ preset: name, label: pair.label, fgVal, bgVal, ratio, threshold });
      }

      console.log(
        pair.label.padEnd(28),
        fgVal.padEnd(10),
        bgVal.padEnd(10),
        (ratio.toFixed(2) + ':1').padEnd(9),
        (threshold + ':1').padEnd(12),
        resultStr
      );
    } catch (e) {
      console.log(pair.label.padEnd(28), `ERROR: ${e.message}`);
      presetSkip++;
      globalSkip++;
    }
  }

  // ── Gradient contrast pairs ──
  for (const gp of GRADIENT_PAIRS) {
    const textVal = resolveThemeColor(gp.text, overrides, tokenAgent);
    const gradientVal = resolveThemeColor(gp.gradient, overrides, tokenAgent);

    if (!textVal || !gradientVal) {
      console.log(gp.label.padEnd(28), `SKIP - missing: ${!textVal ? gp.text : gp.gradient}`);
      presetSkip++;
      globalSkip++;
      continue;
    }

    // Skip if gradient is disabled (e.g. neumorphic sets to 'none')
    if (gradientVal === 'none' || !gradientVal.includes('linear-gradient')) {
      console.log(gp.label.padEnd(28), '—'.padEnd(10), '—'.padEnd(10), '—'.padEnd(9), '4.5:1'.padEnd(12), 'SKIP');
      presetSkip++;
      globalSkip++;
      continue;
    }

    try {
      const result = checkGradientContrast(textVal, gradientVal);
      if (!result) {
        console.log(gp.label.padEnd(28), `SKIP - insufficient gradient stops`);
        presetSkip++;
        globalSkip++;
        continue;
      }

      const pass = result.allPass;
      const resultStr = pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';

      if (pass) {
        presetPass++;
        globalPass++;
      } else {
        presetFail++;
        globalFail++;
        allFailures.push({
          preset: name,
          label: gp.label,
          fgVal: textVal,
          bgVal: `gradient(worst stop)`,
          ratio: result.worstRatio,
          threshold: 4.5,
        });
      }

      const stopsStr = result.stops.join(',').substring(0, 9);
      console.log(
        gp.label.padEnd(28),
        textVal.padEnd(10),
        stopsStr.padEnd(10),
        (result.worstRatio.toFixed(2) + ':1').padEnd(9),
        '4.5:1'.padEnd(12),
        resultStr
      );
    } catch (e) {
      console.log(gp.label.padEnd(28), `ERROR: ${e.message}`);
      presetSkip++;
      globalSkip++;
    }
  }

  console.log('-'.repeat(100));
  const presetTotal = presetPass + presetFail;
  const pct = presetTotal > 0 ? ((presetPass / presetTotal) * 100).toFixed(0) : '0';
  console.log(
    `  ${name}: ${presetPass}/${presetTotal} pass (${pct}%), ${presetSkip} skipped`
  );
}

// ============================================================================
// OVERALL SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(100));
console.log('\x1b[1mOVERALL SUMMARY\x1b[0m');
console.log('='.repeat(100));

const totalChecked = globalPass + globalFail;
const overallPct = totalChecked > 0 ? ((globalPass / totalChecked) * 100).toFixed(0) : '0';

console.log(`  Total pairs checked: ${totalChecked}`);
console.log(`  Passed:  ${globalPass} (${overallPct}%)`);
console.log(`  Failed:  ${globalFail}`);
console.log(`  Skipped: ${globalSkip}`);

if (allFailures.length > 0) {
  console.log(`\n\x1b[31m── Failures (${allFailures.length}) ──\x1b[0m`);
  for (const f of allFailures) {
    console.log(
      `  [${f.preset}] ${f.label}: ${f.ratio.toFixed(2)}:1 (need ${f.threshold}:1) — ${f.fgVal} on ${f.bgVal}`
    );
  }
  console.log('');
  process.exit(1);
} else {
  console.log(`\n\x1b[32mAll ${totalChecked} pairs pass WCAG AA contrast requirements across all presets.\x1b[0m\n`);
  process.exit(0);
}
