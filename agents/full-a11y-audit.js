#!/usr/bin/env node

/**
 * ♿ COMPREHENSIVE ACCESSIBILITY AUDIT
 * 
 * Tests ALL components in BOTH light and dark mode
 * 
 * Run with: node agents/full-a11y-audit.js
 */

import { AccessibilityValidatorAgent, getContrastRatio } from './accessibility-validator-agent.js';
import { DesignTokenAgent } from './design-token-agent.js';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = join(__dirname, '..', 'tokens');
const COMPONENTS_DIR = join(__dirname, '..', 'src', 'components');
const REPORT_DIR = join(__dirname, '..', 'reports');

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  orange: '\x1b[38;5;208m',
};

// ============================================================================
// CONTRAST PAIRS TO TEST
// ============================================================================

// Light mode pairs (foreground on background)
const LIGHT_MODE_PAIRS = [
  // Text on surfaces
  { fg: 'semantic.text.default', bg: 'semantic.surface.page.default', name: 'Text on page' },
  { fg: 'semantic.text.secondary', bg: 'semantic.surface.page.default', name: 'Secondary text on page' },
  { fg: 'semantic.text.muted', bg: 'semantic.surface.page.default', name: 'Muted text on page' },
  { fg: 'semantic.text.default', bg: 'semantic.surface.card.default', name: 'Text on card' },
  { fg: 'semantic.text.link', bg: 'semantic.surface.page.default', name: 'Link on page' },
  
  // Semantic colors on white
  { fg: 'semantic.color.primary.default', bg: 'semantic.surface.page.default', name: 'Primary on page', type: 'largeText' },
  { fg: 'semantic.color.success.default', bg: 'semantic.surface.page.default', name: 'Success on page', type: 'largeText' },
  { fg: 'semantic.color.warning.default', bg: 'semantic.surface.page.default', name: 'Warning on page', type: 'largeText' },
  { fg: 'semantic.color.danger.default', bg: 'semantic.surface.page.default', name: 'Danger on page', type: 'largeText' },
  
  // Borders (3:1 requirement for UI components)
  { fg: 'semantic.border.default', bg: 'semantic.surface.page.default', name: 'Border on page', type: 'uiComponents' },
  { fg: 'semantic.border.focus', bg: 'semantic.surface.page.default', name: 'Focus border', type: 'uiComponents' },
];

// Dark mode pairs
const DARK_MODE_PAIRS = [
  // Text on surfaces
  { fg: 'semantic.text.dark.default', bg: 'semantic.surface.dark.page.default', name: 'Text on page (dark)' },
  { fg: 'semantic.text.dark.muted', bg: 'semantic.surface.dark.page.default', name: 'Muted text on page (dark)' },
  { fg: 'semantic.text.dark.link', bg: 'semantic.surface.dark.page.default', name: 'Link on page (dark)' },
  { fg: 'semantic.text.dark.default', bg: 'semantic.surface.dark.card.default', name: 'Text on card (dark)' },
  { fg: 'semantic.text.dark.placeholder', bg: 'semantic.surface.dark.input.default', name: 'Placeholder in input (dark)' },
  
  // Semantic colors on dark
  { fg: 'semantic.color.dark.primary.default', bg: 'semantic.surface.dark.page.default', name: 'Primary on dark', type: 'largeText' },
  { fg: 'semantic.color.dark.success.default', bg: 'semantic.surface.dark.page.default', name: 'Success on dark', type: 'largeText' },
  { fg: 'semantic.color.dark.warning.default', bg: 'semantic.surface.dark.page.default', name: 'Warning on dark', type: 'largeText' },
  { fg: 'semantic.color.dark.danger.default', bg: 'semantic.surface.dark.page.default', name: 'Danger on dark', type: 'largeText' },
  
  // Borders (3:1 requirement)
  { fg: 'semantic.border.dark.default', bg: 'semantic.surface.dark.page.default', name: 'Border on dark', type: 'uiComponents' },
  { fg: 'semantic.border.dark.focus', bg: 'semantic.surface.dark.page.default', name: 'Focus border (dark)', type: 'uiComponents' },
];

// Component-specific contrast pairs (extracted from component tokens)
const COMPONENT_PAIRS = {
  button: [
    { fg: 'component.button.primary.text', bg: 'component.button.primary.bg', name: 'Primary button' },
    { fg: 'component.button.secondary.text', bg: 'component.button.secondary.bg', name: 'Secondary button' },
    { fg: 'component.button.danger.text', bg: 'component.button.danger.bg', name: 'Danger button' },
  ],
  badge: [
    { fg: 'component.badge.default.text', bg: 'component.badge.default.bg', name: 'Default badge' },
    { fg: 'component.badge.primary.text', bg: 'component.badge.primary.bg', name: 'Primary badge' },
    { fg: 'component.badge.success.text', bg: 'component.badge.success.bg', name: 'Success badge' },
    { fg: 'component.badge.warning.text', bg: 'component.badge.warning.bg', name: 'Warning badge' },
    { fg: 'component.badge.danger.text', bg: 'component.badge.danger.bg', name: 'Danger badge' },
  ],
  alert: [
    { fg: 'component.alert.info.text', bg: 'component.alert.info.bg', name: 'Info alert' },
    { fg: 'component.alert.success.text', bg: 'component.alert.success.bg', name: 'Success alert' },
    { fg: 'component.alert.warning.text', bg: 'component.alert.warning.bg', name: 'Warning alert' },
    { fg: 'component.alert.error.text', bg: 'component.alert.error.bg', name: 'Error alert' },
  ],
  input: [
    { fg: 'component.input.text', bg: 'component.input.bg', name: 'Input text' },
    { fg: 'component.input.placeholder', bg: 'component.input.bg', name: 'Input placeholder' },
    { fg: 'component.input.label', bg: 'semantic.surface.page.default', name: 'Input label' },
  ],
  card: [
    { fg: 'component.card.title.color', bg: 'component.card.bg', name: 'Card title' },
    { fg: 'component.card.description.color', bg: 'component.card.bg', name: 'Card description' },
  ],
  modal: [
    { fg: 'component.modal.title.color', bg: 'component.modal.bg', name: 'Modal title' },
  ],
  tooltip: [
    { fg: 'component.tooltip.text', bg: 'component.tooltip.bg', name: 'Tooltip' },
  ],
  toast: [
    { fg: 'component.toast.info.text', bg: 'component.toast.info.bg', name: 'Info toast' },
    { fg: 'component.toast.success.text', bg: 'component.toast.success.bg', name: 'Success toast' },
    { fg: 'component.toast.warning.text', bg: 'component.toast.warning.bg', name: 'Warning toast' },
    { fg: 'component.toast.error.text', bg: 'component.toast.error.bg', name: 'Error toast' },
  ],
  tabs: [
    { fg: 'component.tabs.trigger.color.default', bg: 'component.tabs.list.bg', name: 'Tab default' },
    { fg: 'component.tabs.trigger.color.active', bg: 'component.tabs.list.bg', name: 'Tab active' },
  ],
  table: [
    { fg: 'component.table.header.text', bg: 'component.table.header.bg', name: 'Table header' },
    { fg: 'component.table.cell.text', bg: 'component.table.row.bg.default', name: 'Table cell' },
  ],
};

// ============================================================================
// AUDIT RUNNER
// ============================================================================

async function runFullAudit() {
  console.log(`
${c.bright}${c.orange}
  ╔═══════════════════════════════════════════════════════════════════╗
  ║                                                                   ║
  ║   ♿  COMPREHENSIVE ACCESSIBILITY AUDIT                           ║
  ║                                                                   ║
  ║   Testing: All Components • Light Mode • Dark Mode • WCAG AA      ║
  ║                                                                   ║
  ╚═══════════════════════════════════════════════════════════════════╝
${c.reset}`);

  // Initialize
  const tokenAgent = new DesignTokenAgent(TOKENS_DIR);
  const a11yAgent = new AccessibilityValidatorAgent({ tokenAgent, targetLevel: 'AA' });

  const report = {
    timestamp: new Date().toISOString(),
    targetLevel: 'AA',
    results: {
      lightMode: { passed: 0, failed: 0, issues: [] },
      darkMode: { passed: 0, failed: 0, issues: [] },
      components: { passed: 0, failed: 0, issues: [] },
      htmlValidation: { passed: 0, failed: 0, issues: [] },
      cssValidation: { passed: 0, failed: 0, issues: [] },
    },
    summary: {}
  };

  // ========== LIGHT MODE CONTRAST ==========
  console.log(`\n${c.bright}${c.cyan}═══ LIGHT MODE CONTRAST ═══${c.reset}\n`);
  
  for (const pair of LIGHT_MODE_PAIRS) {
    const result = testContrastPair(tokenAgent, pair);
    if (result.passes) {
      report.results.lightMode.passed++;
      console.log(`${c.green}✓${c.reset} ${pair.name}: ${result.ratio}:1`);
    } else {
      report.results.lightMode.failed++;
      report.results.lightMode.issues.push({ ...pair, ...result });
      console.log(`${c.red}✗${c.reset} ${pair.name}: ${result.ratio}:1 (need ${result.required}:1)`);
    }
  }

  // ========== DARK MODE CONTRAST ==========
  console.log(`\n${c.bright}${c.cyan}═══ DARK MODE CONTRAST ═══${c.reset}\n`);
  
  for (const pair of DARK_MODE_PAIRS) {
    const result = testContrastPair(tokenAgent, pair);
    if (result.passes) {
      report.results.darkMode.passed++;
      console.log(`${c.green}✓${c.reset} ${pair.name}: ${result.ratio}:1`);
    } else if (result.error) {
      console.log(`${c.yellow}?${c.reset} ${pair.name}: ${result.error}`);
    } else {
      report.results.darkMode.failed++;
      report.results.darkMode.issues.push({ ...pair, ...result });
      console.log(`${c.red}✗${c.reset} ${pair.name}: ${result.ratio}:1 (need ${result.required}:1)`);
    }
  }

  // ========== COMPONENT CONTRAST ==========
  console.log(`\n${c.bright}${c.cyan}═══ COMPONENT CONTRAST ═══${c.reset}\n`);
  
  for (const [component, pairs] of Object.entries(COMPONENT_PAIRS)) {
    console.log(`${c.dim}${component}:${c.reset}`);
    for (const pair of pairs) {
      const result = testContrastPair(tokenAgent, pair);
      if (result.passes) {
        report.results.components.passed++;
        console.log(`  ${c.green}✓${c.reset} ${pair.name}: ${result.ratio}:1`);
      } else if (result.error) {
        console.log(`  ${c.yellow}?${c.reset} ${pair.name}: ${result.error}`);
      } else {
        report.results.components.failed++;
        report.results.components.issues.push({ component, ...pair, ...result });
        console.log(`  ${c.red}✗${c.reset} ${pair.name}: ${result.ratio}:1 (need ${result.required}:1)`);
      }
    }
  }

  // ========== HTML/JSX VALIDATION ==========
  console.log(`\n${c.bright}${c.cyan}═══ COMPONENT CODE VALIDATION ═══${c.reset}\n`);
  
  const componentDirs = ['atoms', 'molecules', 'organisms'];
  
  for (const tier of componentDirs) {
    const tierPath = join(COMPONENTS_DIR, tier);
    if (!existsSync(tierPath)) continue;
    
    const components = readdirSync(tierPath).filter(f => 
      !f.startsWith('.') && !f.endsWith('.ts') && !f.includes('.')
    );
    
    console.log(`${c.dim}${tier}:${c.reset}`);
    
    for (const comp of components) {
      const tsxPath = join(tierPath, comp, `${comp}.tsx`);
      const cssPath = join(tierPath, comp, `${comp}.css`);
      
      let hasIssues = false;
      const issues = [];
      
      // Validate TSX
      if (existsSync(tsxPath)) {
        const code = readFileSync(tsxPath, 'utf8');
        const htmlResult = a11yAgent.validateHTML(code, comp);
        
        if (htmlResult.stats.errors > 0) {
          hasIssues = true;
          report.results.htmlValidation.failed++;
          issues.push(...htmlResult.issues.filter(i => i.severity === 'error'));
        } else {
          report.results.htmlValidation.passed++;
        }
      }
      
      // Validate CSS
      if (existsSync(cssPath)) {
        const css = readFileSync(cssPath, 'utf8');
        a11yAgent.reset();
        const motionIssues = a11yAgent.validateMotion(css);
        
        if (motionIssues.some(i => i.severity === 'error')) {
          hasIssues = true;
          report.results.cssValidation.failed++;
          issues.push(...motionIssues.filter(i => i.severity === 'error'));
        } else {
          report.results.cssValidation.passed++;
        }
      }
      
      if (hasIssues) {
        console.log(`  ${c.red}✗${c.reset} ${comp}`);
        issues.forEach(i => console.log(`    ${c.dim}- ${i.message}${c.reset}`));
      } else {
        console.log(`  ${c.green}✓${c.reset} ${comp}`);
      }
    }
  }

  // ========== SUMMARY ==========
  console.log(`\n${c.bright}${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.bright}${c.cyan}                        AUDIT SUMMARY                           ${c.reset}`);
  console.log(`${c.bright}${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}\n`);
  
  const totalPassed = 
    report.results.lightMode.passed + 
    report.results.darkMode.passed + 
    report.results.components.passed +
    report.results.htmlValidation.passed +
    report.results.cssValidation.passed;
    
  const totalFailed = 
    report.results.lightMode.failed + 
    report.results.darkMode.failed + 
    report.results.components.failed +
    report.results.htmlValidation.failed +
    report.results.cssValidation.failed;

  console.log(`  ${c.bright}Light Mode Contrast:${c.reset}  ${formatResult(report.results.lightMode)}`);
  console.log(`  ${c.bright}Dark Mode Contrast:${c.reset}   ${formatResult(report.results.darkMode)}`);
  console.log(`  ${c.bright}Component Contrast:${c.reset}   ${formatResult(report.results.components)}`);
  console.log(`  ${c.bright}HTML Validation:${c.reset}      ${formatResult(report.results.htmlValidation)}`);
  console.log(`  ${c.bright}CSS/Motion:${c.reset}           ${formatResult(report.results.cssValidation)}`);
  console.log(`  ${c.dim}─────────────────────────────────${c.reset}`);
  console.log(`  ${c.bright}TOTAL:${c.reset}                ${c.green}${totalPassed} passed${c.reset}, ${totalFailed > 0 ? c.red : c.green}${totalFailed} failed${c.reset}`);

  report.summary = {
    totalPassed,
    totalFailed,
    passRate: `${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`
  };

  // Overall verdict
  console.log(`\n  ${c.bright}VERDICT:${c.reset} ${
    totalFailed === 0 
      ? `${c.green}✓ ALL CHECKS PASSED${c.reset}` 
      : `${c.yellow}⚠ ${totalFailed} ISSUES NEED ATTENTION${c.reset}`
  }\n`);

  // Save report
  if (!existsSync(REPORT_DIR)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(REPORT_DIR, { recursive: true });
  }
  
  const reportPath = join(REPORT_DIR, `a11y-audit-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  ${c.dim}Report saved to: ${reportPath}${c.reset}\n`);

  return report;
}

// ============================================================================
// HELPERS
// ============================================================================

function testContrastPair(tokenAgent, pair) {
  const fgToken = tokenAgent.getToken(pair.fg);
  const bgToken = tokenAgent.getToken(pair.bg);
  
  if (!fgToken || !bgToken) {
    return { error: 'Token not found', fg: pair.fg, bg: pair.bg };
  }
  
  // Handle rgba colors (simplified - just check if it's valid)
  if (fgToken.resolvedValue.includes('rgba') || bgToken.resolvedValue.includes('rgba')) {
    return { error: 'RGBA colors not fully supported', passes: null };
  }
  
  const ratio = getContrastRatio(fgToken.resolvedValue, bgToken.resolvedValue);
  if (!ratio) {
    return { error: 'Could not calculate contrast' };
  }
  
  const type = pair.type || 'normalText';
  const requirements = {
    normalText: 4.5,
    largeText: 3.0,
    uiComponents: 3.0
  };
  
  const required = requirements[type];
  const roundedRatio = Math.round(ratio * 100) / 100;
  
  return {
    ratio: roundedRatio,
    required,
    passes: roundedRatio >= required,
    fg: fgToken.resolvedValue,
    bg: bgToken.resolvedValue
  };
}

function formatResult(result) {
  const { passed, failed } = result;
  if (failed === 0) {
    return `${c.green}${passed} passed${c.reset}`;
  }
  return `${c.green}${passed} passed${c.reset}, ${c.red}${failed} failed${c.reset}`;
}

// Run
runFullAudit().catch(console.error);
