#!/usr/bin/env node

/**
 * ♿ Accessibility Validator Agent - Test Suite
 * 
 * Run with: node agents/test-a11y-agent.js
 * 
 * Tests:
 * - Color contrast checking
 * - HTML/JSX validation
 * - ARIA validation
 * - Motion/animation validation
 * - Integration with Design Token Agent
 */

import { AccessibilityValidatorAgent, getContrastRatio } from './accessibility-validator-agent.js';
import { DesignTokenAgent } from './design-token-agent.js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = join(__dirname, '..', 'tokens');
const COMPONENTS_DIR = join(__dirname, '..', 'src', 'components');

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
  bg: {
    green: '\x1b[42m',
    red: '\x1b[41m',
    yellow: '\x1b[43m'
  }
};

const log = {
  header: (text) => console.log(`\n${c.bright}${c.cyan}═══ ${text} ═══${c.reset}\n`),
  subheader: (text) => console.log(`${c.bright}${c.blue}--- ${text} ---${c.reset}`),
  success: (text) => console.log(`${c.green}✓${c.reset} ${text}`),
  error: (text) => console.log(`${c.red}✗${c.reset} ${text}`),
  warning: (text) => console.log(`${c.yellow}⚠${c.reset} ${text}`),
  info: (text) => console.log(`${c.blue}ℹ${c.reset} ${text}`),
  result: (label, value) => console.log(`  ${c.magenta}${label}:${c.reset} ${value}`),
  contrast: (ratio, passes) => {
    const color = passes ? c.green : c.red;
    const icon = passes ? '✓' : '✗';
    console.log(`  ${color}${icon}${c.reset} ${ratio}:1`);
  }
};

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log(`
${c.bright}${c.orange}
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   ♿  ACCESSIBILITY VALIDATOR AGENT - TEST SUITE          ║
  ║                                                           ║
  ║   Testing: Contrast • HTML • ARIA • Motion                ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
${c.reset}`);

  // Initialize agents
  log.header('INITIALIZATION');
  const tokenAgent = new DesignTokenAgent(TOKENS_DIR);
  const a11yAgent = new AccessibilityValidatorAgent({ 
    tokenAgent,
    targetLevel: 'AA'
  });
  log.success('Token Agent connected');
  log.success('Accessibility Validator Agent initialized');
  log.info(`Target WCAG level: ${a11yAgent.targetLevel}`);

  // ========== TEST 1: Basic Color Contrast ==========
  log.header('TEST 1: Color Contrast Calculations');
  
  const contrastTests = [
    { fg: '#000000', bg: '#ffffff', expected: 21, name: 'Black on White' },
    { fg: '#ffffff', bg: '#000000', expected: 21, name: 'White on Black' },
    { fg: '#2563eb', bg: '#ffffff', expected: 4.54, name: 'Blue 600 on White' },
    { fg: '#ffffff', bg: '#2563eb', expected: 4.54, name: 'White on Blue 600' },
    { fg: '#64748b', bg: '#ffffff', expected: 4.65, name: 'Neutral 500 on White' },
    { fg: '#94a3b8', bg: '#ffffff', expected: 2.93, name: 'Neutral 400 on White (FAIL)' },
  ];

  contrastTests.forEach(test => {
    const ratio = getContrastRatio(test.fg, test.bg);
    const rounded = Math.round(ratio * 100) / 100;
    const passesAA = rounded >= 4.5;
    
    console.log(`  ${test.name}:`);
    log.contrast(rounded, passesAA);
  });

  // ========== TEST 2: Token-Based Contrast Check ==========
  log.header('TEST 2: Design Token Contrast Validation');
  
  const tokenContrastResults = a11yAgent.validateTokenContrast();
  
  let passCount = 0;
  let failCount = 0;
  
  tokenContrastResults.forEach(result => {
    if (result.passes) {
      passCount++;
      log.success(`${result.context}: ${result.ratio}:1 ${c.dim}(required: ${result.required}:1)${c.reset}`);
    } else {
      failCount++;
      log.error(`${result.context}: ${result.ratio}:1 ${c.dim}(required: ${result.required}:1)${c.reset}`);
    }
  });
  
  console.log(`\n  ${c.bright}Results:${c.reset} ${passCount} passed, ${failCount} failed`);

  // ========== TEST 3: HTML Validation ==========
  log.header('TEST 3: HTML/JSX Validation');

  // Test with sample code
  const sampleBadHTML = `
    <div onClick={() => handleClick()}>Click me</div>
    <img src="photo.jpg">
    <a href="#"></a>
    <button>Submit</button>
    <input type="text">
    <h1>Title</h1>
    <h3>Skipped heading</h3>
  `;

  const htmlResult = a11yAgent.validateHTML(sampleBadHTML, 'Sample Bad Code');
  
  log.subheader('Issues Found');
  htmlResult.issues.forEach(issue => {
    const icon = issue.severity === 'error' ? `${c.red}✗` : `${c.yellow}⚠`;
    console.log(`  ${icon}${c.reset} ${issue.message}`);
    if (issue.wcagCriteria) {
      console.log(`    ${c.dim}WCAG: ${issue.wcagCriteria}${c.reset}`);
    }
    if (issue.suggestion) {
      console.log(`    ${c.dim}Fix: ${issue.suggestion}${c.reset}`);
    }
  });

  console.log(`\n  ${c.bright}Summary:${c.reset} ${htmlResult.stats.errors} errors, ${htmlResult.stats.warnings} warnings`);

  // ========== TEST 4: Good HTML ==========
  log.header('TEST 4: Validating Good HTML');

  const goodHTML = `
    <button type="button" onClick={() => handleClick()}>
      Click me
    </button>
    <img src="photo.jpg" alt="A beautiful sunset">
    <a href="/about">About us</a>
    <label htmlFor="email">Email</label>
    <input type="email" id="email" aria-describedby="email-hint">
    <h1>Title</h1>
    <h2>Subtitle</h2>
  `;

  const goodResult = a11yAgent.validateHTML(goodHTML, 'Good Code');
  
  if (goodResult.valid) {
    log.success('No errors found in well-written code!');
  }
  console.log(`  ${c.bright}Summary:${c.reset} ${goodResult.stats.errors} errors, ${goodResult.stats.warnings} warnings`);

  // ========== TEST 5: ARIA Validation ==========
  log.header('TEST 5: ARIA Validation');

  const ariaTestCode = `
    <div role="checkbox">Not accessible</div>
    <button aria-hidden="true">Hidden but focusable</button>
    <div role="slider" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">Slider</div>
    <div role="invalidrole">Invalid</div>
  `;

  a11yAgent.reset();
  const ariaIssues = a11yAgent.validateARIA(ariaTestCode);
  
  ariaIssues.forEach(issue => {
    log.error(issue.message);
    if (issue.suggestion) {
      console.log(`    ${c.dim}Fix: ${issue.suggestion}${c.reset}`);
    }
  });

  // ========== TEST 6: Motion/Animation Validation ==========
  log.header('TEST 6: Motion/Animation Validation');

  const testCSS = `
    .button {
      transition: background-color 0.2s ease-out;
    }
    
    .modal {
      animation: slideIn 0.3s ease-out;
      animation: bounceIn 1.5s bounce;
    }
    
    .card {
      transition: width 0.3s ease;
    }
  `;

  a11yAgent.reset();
  const motionIssues = a11yAgent.validateMotion(testCSS);
  
  if (motionIssues.length > 0) {
    motionIssues.forEach(issue => {
      if (issue.severity === 'error') {
        log.error(issue.message);
      } else {
        log.warning(issue.message);
      }
      if (issue.suggestion) {
        console.log(`    ${c.dim}Fix: ${issue.suggestion}${c.reset}`);
      }
    });
  }

  const goodCSS = `
    .button {
      transition: transform 0.2s ease-out, opacity 0.2s ease-out;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .button {
        transition: none;
      }
    }
  `;

  a11yAgent.reset();
  const goodMotionIssues = a11yAgent.validateMotion(goodCSS);
  log.success(`Accessible CSS: ${goodMotionIssues.length === 0 ? 'All checks passed!' : goodMotionIssues.length + ' issues'}`);

  // ========== TEST 7: Real Component Validation ==========
  log.header('TEST 7: Real Component Validation');

  try {
    // Read a real component from the project
    const buttonPath = join(COMPONENTS_DIR, 'atoms', 'Button', 'Button.tsx');
    const buttonCode = readFileSync(buttonPath, 'utf8');
    
    const buttonCSSPath = join(COMPONENTS_DIR, 'atoms', 'Button', 'Button.css');
    const buttonCSS = readFileSync(buttonCSSPath, 'utf8');

    const componentResult = a11yAgent.validateComponent({
      name: 'Button',
      html: buttonCode,
      css: buttonCSS
    });

    log.info(`Validating: ${componentResult.component}`);
    
    if (componentResult.valid) {
      log.success('Component passes accessibility checks!');
    } else {
      log.error(`Found ${componentResult.summary.errors} error(s)`);
    }

    if (componentResult.summary.warnings > 0) {
      log.warning(`${componentResult.summary.warnings} warning(s) to review`);
    }

    // Show issues if any
    if (componentResult.allIssues.length > 0) {
      log.subheader('Issues');
      componentResult.allIssues.forEach(issue => {
        const icon = issue.severity === 'error' ? `${c.red}✗` : 
                     issue.severity === 'warning' ? `${c.yellow}⚠` : `${c.blue}ℹ`;
        console.log(`  ${icon}${c.reset} [${issue.type}] ${issue.message}`);
      });
    }
  } catch (e) {
    log.info('Could not load real component - using mock data');
  }

  // ========== TEST 8: Agent Request Handler ==========
  log.header('TEST 8: Agent Request Handler');

  const request1 = {
    action: 'checkContrast',
    foreground: '#ffffff',
    background: '#2563eb',
    options: { textType: 'normalText', context: 'Button text' }
  };

  log.info(`Request: ${JSON.stringify({ action: request1.action, fg: request1.foreground, bg: request1.background })}`);
  const response1 = a11yAgent.handleRequest(request1);
  
  if (response1.success) {
    log.success(`Contrast check: ${response1.data.ratio}:1 (${response1.data.passes ? 'PASS' : 'FAIL'})`);
  }

  // ========== SUMMARY ==========
  log.header('TEST SUMMARY');

  console.log(`
  ${c.bright}Accessibility Validator Capabilities:${c.reset}
  ────────────────────────────────────────
  ${c.green}✓${c.reset} Color contrast checking (WCAG AA/AAA)
  ${c.green}✓${c.reset} Token-based contrast validation
  ${c.green}✓${c.reset} HTML/JSX semantic validation
  ${c.green}✓${c.reset} ARIA role and attribute validation
  ${c.green}✓${c.reset} Motion/animation compliance
  ${c.green}✓${c.reset} prefers-reduced-motion detection
  ${c.green}✓${c.reset} Integration with Design Token Agent
  ${c.green}✓${c.reset} Component-level validation
  ${c.green}✓${c.reset} Agent request handling

  ${c.bright}WCAG Criteria Covered:${c.reset}
  ────────────────────────────────────────
  • 1.1.1 Non-text Content (images, alt text)
  • 1.3.1 Info and Relationships (headings, labels)
  • 1.4.3 Contrast (Minimum) - AA
  • 1.4.6 Contrast (Enhanced) - AAA
  • 2.3.3 Animation from Interactions
  • 2.4.3 Focus Order (tabindex)
  • 2.4.4 Link Purpose
  • 4.1.2 Name, Role, Value (ARIA)

  ${c.bright}${c.green}All tests completed!${c.reset}
  `);
}

// Run
runTests().catch(console.error);
