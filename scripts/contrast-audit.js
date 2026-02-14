#!/usr/bin/env node
/**
 * Comprehensive WCAG contrast audit for all semantic color token pairs
 */
import { createDesignTokenAgent, getContrastRatio } from '../lib/index.js';

const token = createDesignTokenAgent('./tokens');

// Resolve a token path to a hex color string
function resolve(path) {
  const r = token.handleRequest({ action: 'get', path });
  if (!r.success || !r.data) return null;
  const val = r.data.resolvedValue || r.data.rawValue || r.data.$value;
  return typeof val === 'string' ? val : null;
}

// Define contrast pairs using actual token paths
const pairs = [
  // ── Intent colors on white page background ──
  ['semantic.color.primary.default', 'semantic.surface.page.default', 'Primary on page'],
  ['semantic.color.primary.hover', 'semantic.surface.page.default', 'Primary hover on page'],
  ['semantic.color.primary.active', 'semantic.surface.page.default', 'Primary active on page'],
  ['semantic.color.secondary.default', 'semantic.surface.page.default', 'Secondary on page'],
  ['semantic.color.success.default', 'semantic.surface.page.default', 'Success on page'],
  ['semantic.color.warning.default', 'semantic.surface.page.default', 'Warning on page'],
  ['semantic.color.danger.default', 'semantic.surface.page.default', 'Danger on page'],
  ['semantic.color.info.default', 'semantic.surface.page.default', 'Info on page'],

  // ── Intent colors on subtle backgrounds ──
  ['semantic.color.primary.default', 'semantic.color.primary.subtle', 'Primary on primary.subtle'],
  ['semantic.color.primary.default', 'semantic.color.primary.muted', 'Primary on primary.muted'],
  ['semantic.color.success.default', 'semantic.color.success.subtle', 'Success on success.subtle'],
  ['semantic.color.success.default', 'semantic.color.success.muted', 'Success on success.muted'],
  ['semantic.color.warning.default', 'semantic.color.warning.subtle', 'Warning on warning.subtle'],
  ['semantic.color.warning.default', 'semantic.color.warning.muted', 'Warning on warning.muted'],
  ['semantic.color.danger.default', 'semantic.color.danger.subtle', 'Danger on danger.subtle'],
  ['semantic.color.danger.default', 'semantic.color.danger.muted', 'Danger on danger.muted'],
  ['semantic.color.info.default', 'semantic.color.info.subtle', 'Info on info.subtle'],
  ['semantic.color.info.default', 'semantic.color.info.muted', 'Info on info.muted'],

  // ── Text hierarchy on page ──
  ['semantic.text.default', 'semantic.surface.page.default', 'Body text on page'],
  ['semantic.text.muted', 'semantic.surface.page.default', 'Muted text on page'],
  ['semantic.text.secondary', 'semantic.surface.page.default', 'Secondary text on page'],

  // ── Text on card ──
  ['semantic.text.default', 'semantic.surface.card.default', 'Body text on card'],
  ['semantic.text.muted', 'semantic.surface.card.default', 'Muted text on card'],

  // ── White on colored buttons ──
  ['semantic.surface.page.default', 'semantic.color.primary.default', 'White on primary btn'],
  ['semantic.surface.page.default', 'semantic.color.primary.hover', 'White on primary.hover btn'],
  ['semantic.surface.page.default', 'semantic.color.secondary.default', 'White on secondary btn'],
  ['semantic.surface.page.default', 'semantic.color.success.default', 'White on success btn'],
  ['semantic.surface.page.default', 'semantic.color.warning.default', 'White on warning btn'],
  ['semantic.surface.page.default', 'semantic.color.danger.default', 'White on danger btn'],
  ['semantic.surface.page.default', 'semantic.color.info.default', 'White on info btn'],

  // ── Dark mode: intent on dark surface ──
  ['semantic.color.primary.default', 'semantic.surface.dark.page.default', 'Primary on dark page'],
  ['semantic.color.success.default', 'semantic.surface.dark.page.default', 'Success on dark page'],
  ['semantic.color.danger.default', 'semantic.surface.dark.page.default', 'Danger on dark page'],

  // ── Component-specific: button text ──
  ['component.button.primary.text', 'component.button.primary.bg', 'Btn primary text/bg'],
  ['component.button.primary.text', 'component.button.primary.bgHover', 'Btn primary text/bgHov'],
  ['component.button.secondary.text', 'component.button.secondary.bg', 'Btn secondary text/bg'],
  ['component.button.danger.text', 'component.button.danger.bg', 'Btn danger text/bg'],
  ['component.button.outline.text', 'semantic.surface.page.default', 'Btn outline text/page'],
  ['component.button.ghost.text', 'semantic.surface.page.default', 'Btn ghost text/page'],

  // ── Component-specific: alert ──
  ['component.alert.variant.info.title', 'component.alert.variant.info.bg', 'Alert info title/bg'],
  ['component.alert.variant.success.title', 'component.alert.variant.success.bg', 'Alert success title/bg'],
  ['component.alert.variant.warning.title', 'component.alert.variant.warning.bg', 'Alert warning title/bg'],
  ['component.alert.variant.danger.title', 'component.alert.variant.danger.bg', 'Alert danger title/bg'],

  // ── Link colors ──
  ['semantic.text.link', 'semantic.surface.page.default', 'Link on page'],
];

console.log('\nWCAG Contrast Ratio Audit');
console.log('='.repeat(95));
console.log(
  'Pair'.padEnd(28),
  'FG'.padEnd(10),
  'BG'.padEnd(10),
  'Ratio'.padEnd(9),
  'AA-text'.padEnd(10),
  'AAA-text'.padEnd(10),
  'AA-UI'
);
console.log('-'.repeat(95));

let aaPass = 0, aaaPass = 0, aaUIPass = 0, total = 0, aaFail = 0, skipped = 0;
const failures = [];

for (const [fgPath, bgPath, label] of pairs) {
  const fgVal = resolve(fgPath);
  const bgVal = resolve(bgPath);

  if (!fgVal || !bgVal) {
    console.log(label.padEnd(28), `SKIP - missing: ${!fgVal ? fgPath : bgPath}`);
    skipped++;
    continue;
  }

  try {
    // getContrastRatio accepts hex strings directly
    const ratio = getContrastRatio(fgVal, bgVal);
    if (ratio === null) {
      console.log(label.padEnd(28), `SKIP - can't parse: fg=${fgVal} bg=${bgVal}`);
      skipped++;
      continue;
    }

    const aaText = ratio >= 4.5;
    const aaaText = ratio >= 7.0;
    const aaUI = ratio >= 3.0;

    if (aaText) aaPass++;
    else {
      aaFail++;
      failures.push({ label, fgPath, bgPath, fgVal, bgVal, ratio });
    }
    if (aaaText) aaaPass++;
    if (aaUI) aaUIPass++;
    total++;

    const aaStr = aaText ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    const aaaStr = aaaText ? '\x1b[32mPASS\x1b[0m' : '\x1b[33mFAIL\x1b[0m';
    const aaUIStr = aaUI ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';

    console.log(
      label.padEnd(28),
      fgVal.padEnd(10),
      bgVal.padEnd(10),
      (ratio.toFixed(2) + ':1').padEnd(9),
      aaStr.padEnd(19),
      aaaStr.padEnd(19),
      aaUIStr
    );
  } catch (e) {
    console.log(label.padEnd(28), `ERROR: ${e.message}`);
    skipped++;
  }
}

console.log('='.repeat(95));
console.log(`\nResults: ${total} pairs tested, ${skipped} skipped\n`);
console.log(`  AA  normal text (4.5:1): ${aaPass}/${total} pass (${total ? ((aaPass/total)*100).toFixed(0) : 0}%)`);
console.log(`  AAA normal text (7.0:1): ${aaaPass}/${total} pass (${total ? ((aaaPass/total)*100).toFixed(0) : 0}%)`);
console.log(`  AA  UI components (3:1): ${aaUIPass}/${total} pass (${total ? ((aaUIPass/total)*100).toFixed(0) : 0}%)`);

if (failures.length > 0) {
  console.log(`\n\x1b[31m── AA Text Failures (${failures.length}) ──\x1b[0m`);
  for (const f of failures) {
    console.log(`  ${f.label}: ${f.ratio.toFixed(2)}:1 (need 4.5:1) — ${f.fgVal} on ${f.bgVal}`);
  }
}

console.log('');
