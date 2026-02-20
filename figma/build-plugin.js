#!/usr/bin/env node

/**
 * Aioli Figma Plugin Build Script
 *
 * 1. Runs transform-tokens.js to produce figma-tokens.json
 * 2. Reads figma-tokens.json and embeds it into plugin/code.js
 *    by replacing `const BUNDLED_TOKENS = null;` with the actual data
 *
 * This produces a self-contained plugin that works without any
 * manual JSON pasting — required for Figma Community publishing.
 *
 * Usage: node figma/build-plugin.js
 *   (or: npm run figma:build)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TOKENS_PATH = join(__dirname, 'figma-tokens.json');
const CODE_PATH = join(__dirname, 'plugin', 'code.js');

// Step 1: Run the token transformer
console.log('Step 1: Generating figma-tokens.json...');
try {
  execSync(`node ${join(__dirname, 'transform-tokens.js')}`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('Failed to run transform-tokens.js');
  process.exit(1);
}

// Step 2: Read the generated tokens
if (!existsSync(TOKENS_PATH)) {
  console.error(`Error: ${TOKENS_PATH} not found after transform`);
  process.exit(1);
}

const tokensJson = readFileSync(TOKENS_PATH, 'utf8');
const tokensData = JSON.parse(tokensJson);
console.log(`\nStep 2: Read ${tokensData.meta.stats.totalVars} variables from figma-tokens.json`);

// Step 3: Read code.js and replace the BUNDLED_TOKENS placeholder
const codeSource = readFileSync(CODE_PATH, 'utf8');
const PLACEHOLDER = 'const BUNDLED_TOKENS = null;';

if (!codeSource.includes(PLACEHOLDER)) {
  console.error(`Error: Could not find "${PLACEHOLDER}" in code.js`);
  console.error('Make sure code.js has the placeholder line. It may have already been bundled.');
  process.exit(1);
}

// Minify the JSON slightly (no pretty-printing) to reduce file size
const minifiedJson = JSON.stringify(tokensData);
const bundledLine = `const BUNDLED_TOKENS = ${minifiedJson};`;

const bundledCode = codeSource.replace(PLACEHOLDER, bundledLine);

// Step 4: Write the bundled code.js
writeFileSync(CODE_PATH, bundledCode);

const originalSize = (codeSource.length / 1024).toFixed(1);
const bundledSize = (bundledCode.length / 1024).toFixed(1);

console.log(`\nStep 3: Bundled tokens into plugin/code.js`);
console.log(`  Original: ${originalSize} KB`);
console.log(`  Bundled:  ${bundledSize} KB`);
console.log(`\nDone! Plugin is ready for Figma Community publishing.`);
console.log(`\nTo restore dev mode (unbundled), run:`);
console.log(`  git checkout figma/plugin/code.js`);
