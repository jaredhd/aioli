/**
 * SDK Direct Client Tests
 *
 * Tests the SDK in direct mode (no HTTP server needed).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(__dirname, '..', 'tokens');

let client;

beforeAll(async () => {
  const { createDirectClient } = await import('../sdk/direct-client.js');
  client = await createDirectClient({ tokensPath });
});

// ============================================================================
// GENERATION
// ============================================================================

describe('SDK: generateComponent', () => {
  it('generates a button', async () => {
    const result = await client.generateComponent('primary button');
    expect(result.type).toBe('button');
    expect(result.html).toContain('btn');
    expect(result.tokens).toBeInstanceOf(Array);
    expect(result.a11y).toBeDefined();
  });

  it('generates a card with style modifier', async () => {
    const result = await client.generateComponent('glassmorphic card');
    expect(result.html).toBeTruthy();
    expect(result.category).toBeDefined();
  });

  it('throws on missing description', async () => {
    await expect(client.generateComponent()).rejects.toThrow('description');
  });
});

describe('SDK: generatePage', () => {
  it('generates a marketing page', async () => {
    const result = await client.generatePage('marketing landing page');
    expect(result.html).toBeTruthy();
    expect(result.sectionCount).toBeGreaterThan(0);
    expect(result.sections).toBeInstanceOf(Array);
  });
});

// ============================================================================
// DISCOVERY
// ============================================================================

describe('SDK: listComponents', () => {
  it('returns 43 components', async () => {
    const result = await client.listComponents();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(43);
  });
});

describe('SDK: listModifiers', () => {
  it('returns modifiers and compositions', async () => {
    const result = await client.listModifiers();
    expect(result.styleModifiers.length).toBe(8);
    expect(result.pageCompositions.length).toBe(4);
  });
});

describe('SDK: listThemes', () => {
  it('returns 6 themes', async () => {
    const result = await client.listThemes();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(6);
  });
});

// ============================================================================
// THEMES
// ============================================================================

describe('SDK: getThemeCSS', () => {
  it('returns CSS for glass theme', async () => {
    const result = await client.getThemeCSS('glass');
    expect(result.theme).toBe('glass');
    expect(result.css).toContain(':root');
    expect(result.overrideCount).toBeGreaterThan(0);
  });

  it('throws on unknown theme', async () => {
    await expect(client.getThemeCSS('nonexistent')).rejects.toThrow('Unknown theme');
  });
});

describe('SDK: derivePalette', () => {
  it('derives palette from brand color', async () => {
    const result = await client.derivePalette('#2563eb');
    expect(result.sourceColor).toBe('#2563eb');
    expect(result.tokenOverrides).toBeDefined();
    expect(result.css).toContain(':root');
    expect(result.tokenCount).toBeGreaterThan(0);
  });

  it('throws on invalid hex', async () => {
    await expect(client.derivePalette('red')).rejects.toThrow('hex');
  });
});

// ============================================================================
// TOKENS
// ============================================================================

describe('SDK: getTokens', () => {
  it('returns summary by default', async () => {
    const result = await client.getTokens();
    expect(result.totalTokens).toBe(1561);
    expect(result.topLevelCategories).toBeInstanceOf(Array);
  });

  it('returns token by path', async () => {
    const result = await client.getTokens({ path: 'semantic.color.primary.default' });
    expect(result).toBeDefined();
  });
});

describe('SDK: resolveToken', () => {
  it('resolves a token reference', async () => {
    const result = await client.resolveToken('semantic.color.primary.default');
    expect(result).toBeTruthy();
  });
});

// ============================================================================
// VALIDATION
// ============================================================================

describe('SDK: checkContrast', () => {
  it('checks contrast between two colors', async () => {
    const result = await client.checkContrast('#000000', '#ffffff');
    expect(result).toBeDefined();
  });
});

describe('SDK: validateAccessibility', () => {
  it('validates accessible HTML', async () => {
    const result = await client.validateAccessibility('<button type="button">Click me</button>');
    expect(result).toBeDefined();
  });
});

describe('SDK: reviewCode', () => {
  it('reviews code and returns score', async () => {
    const result = await client.reviewCode('<button type="button" class="btn">Click me</button>');
    expect(result.score).toBeTypeOf('number');
    expect(result.grade).toBeTypeOf('string');
    expect(result).toHaveProperty('approved');
  });
});
