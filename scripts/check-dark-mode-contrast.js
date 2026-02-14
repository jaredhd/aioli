/**
 * Dark Mode Accessibility Contrast Checker (Updated)
 * Validates WCAG 2.1 AA compliance
 */

// FIXED color values from our tokens
const colors = {
  // Backgrounds (dark mode)
  'page.default': '#0f172a',      // neutral.900
  'page.subtle': '#1e293b',       // neutral.800
  'card.default': '#1e293b',      // neutral.800
  'card.hover': '#334155',        // neutral.700
  'input.default': '#1e293b',     // neutral.800
  
  // Text colors (dark mode) - FIXED
  'text.default': '#f1f5f9',      // neutral.100
  'text.muted': '#94a3b8',        // neutral.400
  'text.subtle': '#94a3b8',       // neutral.400 (was 500)
  'text.disabled': '#64748b',     // neutral.500 (was 600)
  'text.placeholder': '#94a3b8',  // neutral.400 (was 500)
  
  // Interactive colors (dark mode)
  'primary.default': '#60a5fa',   // blue.400
  'primary.hover': '#93c5fd',     // blue.300
  'success.default': '#34d399',   // emerald.400
  'success.hover': '#6ee7b7',     // emerald.300
  'warning.default': '#fbbf24',   // amber.400
  'warning.hover': '#fcd34d',     // amber.300
  'danger.default': '#f87171',    // red.400
  'danger.hover': '#fca5a5',      // red.300
  'info.default': '#60a5fa',      // blue.400
  
  // Borders (dark mode) - FIXED
  'border.default': '#64748b',    // neutral.500 (was 600)
  'border.subtle': '#475569',     // neutral.600 (was 700) - decorative only
  'border.strong': '#94a3b8',     // neutral.400 (was 500)
  'border.focus': '#60a5fa',      // blue.400
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function evaluateContrast(ratio) {
  if (ratio >= 7) return { aa: '✅ Pass', aaa: '✅ Pass' };
  if (ratio >= 4.5) return { aa: '✅ Pass', aaa: '❌ Fail' };
  if (ratio >= 3) return { aa: '⚠️ Large only', aaa: '❌ Fail' };
  return { aa: '❌ Fail', aaa: '❌ Fail' };
}

const checks = [
  // Text on page background
  { fg: 'text.default', bg: 'page.default', use: 'Body text on page', minRatio: 4.5 },
  { fg: 'text.muted', bg: 'page.default', use: 'Secondary text on page', minRatio: 4.5 },
  { fg: 'text.subtle', bg: 'page.default', use: 'Tertiary text on page', minRatio: 4.5 },
  { fg: 'text.disabled', bg: 'page.default', use: 'Disabled text on page', minRatio: 3, note: 'Intentionally reduced' },
  { fg: 'text.placeholder', bg: 'input.default', use: 'Placeholder in input', minRatio: 4.5 },
  
  // Text on card background
  { fg: 'text.default', bg: 'card.default', use: 'Body text on card', minRatio: 4.5 },
  { fg: 'text.muted', bg: 'card.default', use: 'Secondary text on card', minRatio: 4.5 },
  { fg: 'text.subtle', bg: 'card.default', use: 'Tertiary text on card', minRatio: 4.5 },
  
  // Interactive colors on backgrounds
  { fg: 'primary.default', bg: 'page.default', use: 'Primary button/link on page', minRatio: 4.5 },
  { fg: 'primary.default', bg: 'card.default', use: 'Primary button/link on card', minRatio: 4.5 },
  { fg: 'success.default', bg: 'page.default', use: 'Success text/icon on page', minRatio: 4.5 },
  { fg: 'warning.default', bg: 'page.default', use: 'Warning text/icon on page', minRatio: 4.5 },
  { fg: 'danger.default', bg: 'page.default', use: 'Danger text/icon on page', minRatio: 4.5 },
  
  // UI component colors (3:1 minimum for AA)
  { fg: 'border.default', bg: 'page.default', use: 'Border on page', minRatio: 3 },
  { fg: 'border.strong', bg: 'page.default', use: 'Strong border on page', minRatio: 3 },
  { fg: 'border.focus', bg: 'page.default', use: 'Focus ring on page', minRatio: 3 },
  { fg: 'border.default', bg: 'card.default', use: 'Border on card', minRatio: 3 },
  { fg: 'border.strong', bg: 'card.default', use: 'Strong border on card', minRatio: 3 },
];

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('            DARK MODE ACCESSIBILITY AUDIT (AFTER FIXES)                        ');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('WCAG AA:  4.5:1 (normal text) | 3:1 (large text, UI components)');
console.log('WCAG AAA: 7:1 (normal text)   | 4.5:1 (large text)');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

let failures = [];
let passes = 0;

checks.forEach(({ fg, bg, use, minRatio, note }) => {
  const fgColor = colors[fg];
  const bgColor = colors[bg];
  const ratio = getContrastRatio(fgColor, bgColor);
  const evaluation = evaluateContrast(ratio);
  
  const status = ratio >= minRatio ? '✅' : '❌';
  
  if (ratio >= minRatio) {
    passes++;
  } else {
    failures.push({ fg, bg, use, ratio, required: minRatio });
  }
  
  console.log(`${status} ${use}${note ? ` (${note})` : ''}`);
  console.log(`   ${fg} (${fgColor}) on ${bg} (${bgColor})`);
  console.log(`   Ratio: ${ratio.toFixed(2)}:1 | Required: ${minRatio}:1 | AA: ${evaluation.aa} | AAA: ${evaluation.aaa}`);
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                              SUMMARY                                          ');
console.log('═══════════════════════════════════════════════════════════════════════════════');

if (failures.length === 0) {
  console.log(`\n🎉 SUCCESS! All ${passes} color combinations meet WCAG AA requirements!\n`);
} else {
  console.log(`\n❌ ${failures.length} FAILURES remaining:\n`);
  failures.forEach(f => {
    console.log(`   • ${f.use}: ${f.ratio.toFixed(2)}:1 (needs ${f.required}:1)`);
  });
}

console.log('═══════════════════════════════════════════════════════════════════════════════\n');
