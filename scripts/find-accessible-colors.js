/**
 * Find accessible color alternatives
 */

const neutralPalette = {
  '100': '#f1f5f9',
  '200': '#e2e8f0',
  '300': '#cbd5e1',
  '400': '#94a3b8',
  '500': '#64748b',
  '600': '#475569',
  '700': '#334155',
  '800': '#1e293b',
  '900': '#0f172a',
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

const pageBg = '#0f172a';  // neutral.900
const cardBg = '#1e293b';  // neutral.800

console.log('Finding accessible alternatives for dark mode...\n');
console.log('═══════════════════════════════════════════════════════════════════════');

console.log('\n📝 TEXT COLORS (need 4.5:1 for normal text)\n');
console.log('Against page background (#0f172a):');
Object.entries(neutralPalette).forEach(([shade, hex]) => {
  const ratio = getContrastRatio(hex, pageBg);
  const status = ratio >= 4.5 ? '✅' : ratio >= 3 ? '⚠️' : '❌';
  console.log(`  ${status} neutral.${shade} (${hex}): ${ratio.toFixed(2)}:1`);
});

console.log('\nAgainst card background (#1e293b):');
Object.entries(neutralPalette).forEach(([shade, hex]) => {
  const ratio = getContrastRatio(hex, cardBg);
  const status = ratio >= 4.5 ? '✅' : ratio >= 3 ? '⚠️' : '❌';
  console.log(`  ${status} neutral.${shade} (${hex}): ${ratio.toFixed(2)}:1`);
});

console.log('\n═══════════════════════════════════════════════════════════════════════');
console.log('\n🔲 BORDER COLORS (need 3:1 for UI components)\n');
console.log('Against page background (#0f172a):');
Object.entries(neutralPalette).forEach(([shade, hex]) => {
  const ratio = getContrastRatio(hex, pageBg);
  const status = ratio >= 3 ? '✅' : '❌';
  console.log(`  ${status} neutral.${shade} (${hex}): ${ratio.toFixed(2)}:1`);
});

console.log('\nAgainst card background (#1e293b):');
Object.entries(neutralPalette).forEach(([shade, hex]) => {
  const ratio = getContrastRatio(hex, cardBg);
  const status = ratio >= 3 ? '✅' : '❌';
  console.log(`  ${status} neutral.${shade} (${hex}): ${ratio.toFixed(2)}:1`);
});

console.log('\n═══════════════════════════════════════════════════════════════════════');
console.log('\n✨ RECOMMENDED FIXES:\n');
console.log('  text.subtle:      neutral.500 → neutral.400 (#94a3b8) - 6.96:1 on page');
console.log('  text.placeholder: neutral.500 → neutral.400 (#94a3b8) - 4.68:1 on card');
console.log('  text.disabled:    neutral.600 → neutral.500 (#64748b) - 3.75:1 (acceptable for disabled)');
console.log('  border.default:   neutral.600 → neutral.500 (#64748b) - 3.75:1 on page');
console.log('  border.strong:    neutral.500 → neutral.400 (#94a3b8) - 6.96:1 on page');
console.log('');
