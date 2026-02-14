#!/usr/bin/env node

/**
 * 🎨 Design Token Agent - CLI Test Runner
 * 
 * Run with: node agents/test-token-agent.js
 * 
 * Tests all core functionality:
 * - Loading tokens
 * - Reading tokens
 * - Resolving references
 * - Validation
 * - CSS output
 */

import { DesignTokenAgent } from './design-token-agent.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = join(__dirname, '..', 'tokens');

// ANSI colors for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  dim: '\x1b[2m'
};

const log = {
  header: (text) => console.log(`\n${colors.bright}${colors.cyan}═══ ${text} ═══${colors.reset}\n`),
  success: (text) => console.log(`${colors.green}✓${colors.reset} ${text}`),
  info: (text) => console.log(`${colors.blue}ℹ${colors.reset} ${text}`),
  warn: (text) => console.log(`${colors.yellow}⚠${colors.reset} ${text}`),
  error: (text) => console.log(`${colors.red}✗${colors.reset} ${text}`),
  code: (text) => console.log(`  ${colors.dim}${text}${colors.reset}`),
  result: (label, value) => console.log(`  ${colors.magenta}${label}:${colors.reset} ${value}`)
};

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log(`
${colors.bright}${colors.magenta}
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🎨  DESIGN TOKEN AGENT - TEST SUITE                     ║
  ║                                                           ║
  ║   Testing: Read • Resolve • Validate • Output             ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Initialize agent
  log.header('INITIALIZATION');
  const agent = new DesignTokenAgent(TOKENS_DIR);
  log.success('Agent initialized');
  
  // Test 1: Read a primitive token
  log.header('TEST 1: Read Primitive Token');
  const blueToken = agent.getToken('primitive.color.blue.500');
  if (blueToken) {
    log.success('Retrieved primitive.color.blue.500');
    log.result('Path', blueToken.path);
    log.result('Raw Value', blueToken.rawValue);
    log.result('Resolved', blueToken.resolvedValue);
    log.result('Type', blueToken.type || '(inherited)');
  } else {
    log.error('Failed to retrieve token');
  }

  // Test 2: Read a semantic token (with reference)
  log.header('TEST 2: Read Semantic Token (Reference)');
  const primaryToken = agent.getToken('semantic.color.primary.default');
  if (primaryToken) {
    log.success('Retrieved semantic.color.primary.default');
    log.result('Path', primaryToken.path);
    log.result('Raw Value', primaryToken.rawValue);
    log.result('Resolved', primaryToken.resolvedValue);
    log.result('Ref Chain', primaryToken.referenceChain.join(' → ') || 'none');
  } else {
    log.error('Failed to retrieve token');
  }

  // Test 3: Read a component token (multi-level reference)
  log.header('TEST 3: Read Component Token (Multi-Level Ref)');
  const buttonBg = agent.getToken('component.button.primary.bg');
  if (buttonBg) {
    log.success('Retrieved component.button.primary.bg');
    log.result('Path', buttonBg.path);
    log.result('Raw Value', buttonBg.rawValue);
    log.result('Resolved', buttonBg.resolvedValue);
    log.result('Ref Chain', buttonBg.referenceChain.join(' → ') || 'none');
  } else {
    log.error('Failed to retrieve token');
  }

  // Test 4: Get tokens by prefix
  log.header('TEST 4: Get Tokens by Prefix');
  const buttonTokens = agent.getTokensByPrefix('component.button');
  log.success(`Found ${buttonTokens.length} tokens under component.button`);
  buttonTokens.slice(0, 5).forEach(t => {
    log.code(`${t.path} → ${t.resolvedValue}`);
  });
  if (buttonTokens.length > 5) {
    log.info(`... and ${buttonTokens.length - 5} more`);
  }

  // Test 5: Get tokens by type
  log.header('TEST 5: Get Tokens by Type');
  const colorTokens = agent.getTokensByType('color');
  log.success(`Found ${colorTokens.length} color tokens`);
  log.info('Sample:');
  colorTokens.slice(0, 3).forEach(t => {
    log.code(`${t.path} → ${t.resolvedValue}`);
  });

  // Test 6: Validation
  log.header('TEST 6: Validation');
  const validation = agent.validate();
  if (validation.valid) {
    log.success('All tokens are valid!');
  } else {
    log.error('Validation found issues:');
    validation.issues.forEach(issue => {
      if (issue.severity === 'error') {
        log.error(`${issue.path}: ${issue.error}`);
      } else {
        log.warn(`${issue.path}: ${issue.error}`);
      }
    });
  }
  log.info(`Errors: ${validation.issues.filter(i => i.severity === 'error').length}`);
  log.info(`Warnings: ${validation.issues.filter(i => i.severity === 'warning').length}`);

  // Test 7: CSS Output
  log.header('TEST 7: CSS Output (Sample)');
  const css = agent.toCSS();
  const cssLines = css.split('\n');
  log.success(`Generated ${cssLines.length} lines of CSS`);
  log.info('Preview (first 10 vars):');
  cssLines.slice(0, 12).forEach(line => log.code(line));

  // Test 8: Agent Request Handler
  log.header('TEST 8: Agent Request Handler');
  const request = { action: 'get', path: 'primitive.spacing.4' };
  log.info(`Sending request: ${JSON.stringify(request)}`);
  const response = agent.handleRequest(request);
  if (response.success) {
    log.success('Request handled successfully');
    log.result('Value', response.data?.resolvedValue);
  } else {
    log.error(`Request failed: ${response.error}`);
  }

  // Summary
  log.header('TEST SUMMARY');
  const allPaths = agent.getAllTokenPaths();
  console.log(`
  ${colors.bright}Token Statistics:${colors.reset}
  ─────────────────────────────────────
  Total tokens:     ${colors.cyan}${allPaths.length}${colors.reset}
  Primitives:       ${colors.blue}${allPaths.filter(p => p.startsWith('primitive')).length}${colors.reset}
  Semantic:         ${colors.yellow}${allPaths.filter(p => p.startsWith('semantic')).length}${colors.reset}
  Components:       ${colors.green}${allPaths.filter(p => p.startsWith('component')).length}${colors.reset}
  
  ${colors.bright}${colors.green}All tests completed!${colors.reset}
  `);
}

// Run
runTests().catch(console.error);
