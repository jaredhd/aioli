/**
 * Token Validation Script
 * Validates DTCG token files for structural correctness
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const VALID_TYPES = [
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'number',
  'strokeStyle',
  'border',
  'transition',
  'shadow',
  'gradient',
  'typography'
];

const errors = [];
const warnings = [];

function validateToken(token, path) {
  // Check for $value
  if (token.$value === undefined && !hasNestedTokens(token)) {
    errors.push(`${path}: Missing $value`);
  }
  
  // Check $type if present
  if (token.$type && !VALID_TYPES.includes(token.$type)) {
    warnings.push(`${path}: Unknown $type "${token.$type}"`);
  }
  
  // Check reference format
  if (typeof token.$value === 'string' && token.$value.includes('{')) {
    const refMatch = token.$value.match(/\{([^}]+)\}/g);
    if (refMatch) {
      refMatch.forEach(ref => {
        if (!ref.match(/^\{[a-zA-Z0-9._-]+\}$/)) {
          errors.push(`${path}: Invalid reference format "${ref}"`);
        }
      });
    }
  }
}

function hasNestedTokens(obj) {
  return Object.keys(obj).some(key => 
    !key.startsWith('$') && typeof obj[key] === 'object'
  );
}

function walkTokens(obj, path = '') {
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      if (value.$value !== undefined || value.$type !== undefined) {
        validateToken(value, currentPath);
      }
      walkTokens(value, currentPath);
    }
  }
}

function validateFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const tokens = JSON.parse(content);
    walkTokens(tokens, filePath);
  } catch (e) {
    errors.push(`${filePath}: ${e.message}`);
  }
}

function walkDirectory(dir) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.json')) {
      validateFile(filePath);
    }
  }
}

// Run validation
console.log('🔍 Validating tokens...\n');
walkDirectory('./tokens');

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(e => console.log(`   ${e}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(w => console.log(`   ${w}`));
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All tokens valid!\n');
}

process.exit(errors.length > 0 ? 1 : 0);
