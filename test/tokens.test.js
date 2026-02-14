/**
 * Design Token Agent — Comprehensive Tests
 *
 * Tests the DesignTokenAgent from agents/design-token-agent.js against
 * the real token files in tokens/.  Covers loading, resolution,
 * validation, querying, and output generation.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createDesignTokenAgent } from '../agents/design-token-agent.js';

// ---------------------------------------------------------------------------
// Setup — resolve the tokens directory relative to project root
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensDir = resolve(__dirname, '..', 'tokens');

let agent;

beforeAll(() => {
  agent = createDesignTokenAgent(tokensDir);
});

// ---------------------------------------------------------------------------
// 1. Token loading
// ---------------------------------------------------------------------------

describe('Token loading', () => {
  it('loads all token files and counts more than 1000 tokens', () => {
    const count = agent.countTokens();
    expect(count).toBeGreaterThan(1000);
  });

  it('returns a non-empty list from getAllTokenPaths()', () => {
    const paths = agent.getAllTokenPaths();
    expect(paths.length).toBeGreaterThan(0);
    // Every entry should be a dot-delimited string
    for (const p of paths) {
      expect(typeof p).toBe('string');
      expect(p).toContain('.');
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Token resolution — known paths
// ---------------------------------------------------------------------------

describe('Token resolution', () => {
  it.each([
    'primitive.color.blue.600',
    'semantic.color.primary.default',
    'component.button.primary.bg',
  ])('getToken("%s") returns a fully-resolved object', (path) => {
    const token = agent.getToken(path);
    expect(token).not.toBeNull();
    expect(token).toHaveProperty('resolvedValue');
    expect(token).toHaveProperty('rawValue');
    expect(token).toHaveProperty('path', path);
    expect(token).toHaveProperty('referenceChain');
    expect(Array.isArray(token.referenceChain)).toBe(true);
  });

  it('resolves semantic.color.primary.default to a hex color', () => {
    const token = agent.getToken('semantic.color.primary.default');
    expect(token).not.toBeNull();
    // The resolved value should be a raw hex color, not a reference
    expect(token.resolvedValue).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    // It should have followed at least one reference
    expect(token.referenceChain.length).toBeGreaterThanOrEqual(1);
  });

  it('primitive.color.blue.600 resolvedValue equals rawValue (no reference)', () => {
    const token = agent.getToken('primitive.color.blue.600');
    expect(token).not.toBeNull();
    expect(token.resolvedValue).toBe(token.rawValue);
    expect(token.referenceChain.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. All references resolve — no broken references
// ---------------------------------------------------------------------------

describe('Reference integrity', () => {
  it('every token resolves without leftover { } references', () => {
    const paths = agent.getAllTokenPaths();
    const broken = [];

    for (const p of paths) {
      const token = agent.getToken(p);
      if (
        token &&
        typeof token.resolvedValue === 'string' &&
        token.resolvedValue.includes('{')
      ) {
        broken.push({ path: p, resolvedValue: token.resolvedValue });
      }
    }

    expect(broken).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. validate()
// ---------------------------------------------------------------------------

describe('validate()', () => {
  it('returns valid: true with zero errors', () => {
    const result = agent.validate();
    expect(result).toHaveProperty('valid', true);

    const errors = result.issues.filter((i) => i.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('issues array exists and contains only objects with path, error, severity', () => {
    const result = agent.validate();
    expect(Array.isArray(result.issues)).toBe(true);

    for (const issue of result.issues) {
      expect(issue).toHaveProperty('path');
      expect(issue).toHaveProperty('error');
      expect(issue).toHaveProperty('severity');
      expect(['error', 'warning']).toContain(issue.severity);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. getTokensByPrefix()
// ---------------------------------------------------------------------------

describe('getTokensByPrefix()', () => {
  it('returns many tokens for "primitive.color"', () => {
    const tokens = agent.getTokensByPrefix('primitive.color');
    expect(tokens.length).toBeGreaterThan(10);
    // Every returned token path should start with the prefix
    for (const t of tokens) {
      expect(t.path.startsWith('primitive.color.')).toBe(true);
    }
  });

  it('returns tokens for "component.button"', () => {
    const tokens = agent.getTokensByPrefix('component.button');
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('returns an empty array for a nonexistent prefix', () => {
    const tokens = agent.getTokensByPrefix('nonexistent.prefix.here');
    expect(tokens).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 6. getTokensByType()
// ---------------------------------------------------------------------------

describe('getTokensByType()', () => {
  it('returns tokens for type "color"', () => {
    const tokens = agent.getTokensByType('color');
    expect(tokens.length).toBeGreaterThan(0);
    // Spot-check that at least one token has a hex value
    const hasHex = tokens.some(
      (t) =>
        typeof t.resolvedValue === 'string' &&
        t.resolvedValue.startsWith('#'),
    );
    expect(hasHex).toBe(true);
  });

  it('returns tokens for type "dimension"', () => {
    const tokens = agent.getTokensByType('dimension');
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('returns an empty array for a nonexistent type', () => {
    const tokens = agent.getTokensByType('madeUpType');
    expect(tokens).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 7. toCSS()
// ---------------------------------------------------------------------------

describe('toCSS()', () => {
  it('starts with :root { and ends with }', () => {
    const css = agent.toCSS();
    expect(css.startsWith(':root {')).toBe(true);
    expect(css.trimEnd().endsWith('}')).toBe(true);
  });

  it('contains the expected CSS custom property for primitive.color.blue.600', () => {
    const css = agent.toCSS();
    expect(css).toContain('--primitive-color-blue-600:');
  });

  it('contains no unresolved references in CSS output', () => {
    const css = agent.toCSS();
    // References look like {some.path} — none should remain in CSS output
    expect(css).not.toMatch(/\{[a-z]+\.[a-z]/i);
  });
});

// ---------------------------------------------------------------------------
// 8. toFlatJSON()
// ---------------------------------------------------------------------------

describe('toFlatJSON()', () => {
  it('returns a plain object with dot-notation keys', () => {
    const json = agent.toFlatJSON();
    expect(typeof json).toBe('object');
    expect(json).not.toBeNull();

    const keys = Object.keys(json);
    expect(keys.length).toBeGreaterThan(0);

    // Every key should be dot-notation
    for (const key of keys) {
      expect(key).toContain('.');
    }
  });

  it('each entry has value, type, and description fields', () => {
    const json = agent.toFlatJSON();
    const keys = Object.keys(json);

    // Spot-check the first 20 entries
    for (const key of keys.slice(0, 20)) {
      expect(json[key]).toHaveProperty('value');
      // type and description may be undefined but the keys should exist
      expect('type' in json[key]).toBe(true);
      expect('description' in json[key]).toBe(true);
    }
  });

  it('contains the key "primitive.color.blue.600"', () => {
    const json = agent.toFlatJSON();
    expect(json).toHaveProperty('primitive.color.blue.600');
    expect(json['primitive.color.blue.600'].value).toMatch(/^#/);
  });
});
