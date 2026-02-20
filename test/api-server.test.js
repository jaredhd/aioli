/**
 * REST API Server Tests
 *
 * Uses supertest to test all 13 endpoints without starting a real server.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../api-server/index.js';

// ============================================================================
// HEALTH
// ============================================================================

describe('GET /api/v1/health', () => {
  it('returns status ok with correct counts', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.tokenCount).toBe(1561);
    expect(res.body.data.componentCount).toBe(43);
    expect(res.body.data.themeCount).toBe(6);
    expect(res.body.data.endpoints).toBe(13);
  });
});

// ============================================================================
// GENERATION
// ============================================================================

describe('POST /api/v1/generate/component', () => {
  it('generates a button from description', async () => {
    const res = await request(app)
      .post('/api/v1/generate/component')
      .send({ description: 'primary button' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('button');
    expect(res.body.data.html).toContain('btn');
    expect(res.body.data.tokens).toBeInstanceOf(Array);
    expect(res.body.data.a11y).toBeDefined();
  });

  it('generates a card from description', async () => {
    const res = await request(app)
      .post('/api/v1/generate/component')
      .send({ description: 'card with title' });
    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe('card');
    expect(res.body.data.html).toContain('card');
  });

  it('generates a glassmorphic component with style modifier', async () => {
    const res = await request(app)
      .post('/api/v1/generate/component')
      .send({ description: 'glassmorphic card' });
    expect(res.status).toBe(200);
    expect(res.body.data.html).toBeTruthy();
  });

  it('returns 400 without description', async () => {
    const res = await request(app)
      .post('/api/v1/generate/component')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('description');
  });
});

describe('POST /api/v1/generate/page', () => {
  it('generates a marketing page', async () => {
    const res = await request(app)
      .post('/api/v1/generate/page')
      .send({ description: 'marketing landing page' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.html).toBeTruthy();
    expect(res.body.data.sectionCount).toBeGreaterThan(0);
    expect(res.body.data.sections).toBeInstanceOf(Array);
  });

  it('returns 400 without description', async () => {
    const res = await request(app)
      .post('/api/v1/generate/page')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// DISCOVERY
// ============================================================================

describe('GET /api/v1/components', () => {
  it('lists all 43 component templates', async () => {
    const res = await request(app).get('/api/v1/components');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(43);
  });

  it('each component has name and category', async () => {
    const res = await request(app).get('/api/v1/components');
    const first = res.body.data[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('category');
  });
});

describe('GET /api/v1/modifiers', () => {
  it('returns style modifiers and page compositions', async () => {
    const res = await request(app).get('/api/v1/modifiers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.styleModifiers).toBeInstanceOf(Array);
    expect(res.body.data.pageCompositions).toBeInstanceOf(Array);
    expect(res.body.data.styleModifiers.length).toBe(8);
    expect(res.body.data.pageCompositions.length).toBe(4);
  });
});

// ============================================================================
// THEMES
// ============================================================================

describe('GET /api/v1/themes', () => {
  it('lists all 6 theme presets', async () => {
    const res = await request(app).get('/api/v1/themes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(6);
  });
});

describe('GET /api/v1/themes/:name/css', () => {
  it('returns CSS for a valid theme', async () => {
    const res = await request(app).get('/api/v1/themes/glass/css');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.theme).toBe('glass');
    expect(res.body.data.css).toContain(':root');
    expect(res.body.data.overrideCount).toBeGreaterThan(0);
  });

  it('supports custom overrides via query param', async () => {
    const overrides = JSON.stringify({ 'semantic.color.primary.default': '#8b5cf6' });
    const res = await request(app).get(`/api/v1/themes/default/css?overrides=${encodeURIComponent(overrides)}`);
    expect(res.status).toBe(200);
    expect(res.body.data.css).toContain('#8b5cf6');
  });

  it('returns 400 for unknown theme', async () => {
    const res = await request(app).get('/api/v1/themes/nonexistent/css');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Unknown theme');
  });

  it('returns 400 for invalid JSON overrides', async () => {
    const res = await request(app).get('/api/v1/themes/default/css?overrides=not-json');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid JSON');
  });
});

// ============================================================================
// PALETTE
// ============================================================================

describe('POST /api/v1/palette', () => {
  it('derives a palette from a brand color', async () => {
    const res = await request(app)
      .post('/api/v1/palette')
      .send({ color: '#2563eb' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sourceColor).toBe('#2563eb');
    expect(res.body.data.tokenOverrides).toBeDefined();
    expect(res.body.data.css).toContain(':root');
    expect(res.body.data.tokenCount).toBeGreaterThan(0);
  });

  it('returns 400 without color', async () => {
    const res = await request(app)
      .post('/api/v1/palette')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid hex', async () => {
    const res = await request(app)
      .post('/api/v1/palette')
      .send({ color: 'not-a-hex' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('hex');
  });
});

// ============================================================================
// TOKENS
// ============================================================================

describe('GET /api/v1/tokens', () => {
  it('returns summary when no params given', async () => {
    const res = await request(app).get('/api/v1/tokens');
    expect(res.status).toBe(200);
    expect(res.body.data.totalTokens).toBe(1561);
    expect(res.body.data.topLevelCategories).toBeInstanceOf(Array);
    expect(res.body.data.hint).toBeTruthy();
  });

  it('returns a single token by path', async () => {
    const res = await request(app).get('/api/v1/tokens?path=semantic.color.primary.default');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns tokens by prefix', async () => {
    const res = await request(app).get('/api/v1/tokens?prefix=component.button');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('exports tokens as CSS', async () => {
    const res = await request(app).get('/api/v1/tokens?format=css');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('exports tokens as JSON', async () => {
    const res = await request(app).get('/api/v1/tokens?format=json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/v1/tokens/resolve', () => {
  it('resolves a token reference', async () => {
    const res = await request(app)
      .post('/api/v1/tokens/resolve')
      .send({ reference: 'semantic.color.primary.default' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
  });

  it('handles braces in reference', async () => {
    const res = await request(app)
      .post('/api/v1/tokens/resolve')
      .send({ reference: '{semantic.color.primary.default}' });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
  });

  it('returns 400 without reference', async () => {
    const res = await request(app)
      .post('/api/v1/tokens/resolve')
      .send({});
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// VALIDATION
// ============================================================================

describe('POST /api/v1/validate/contrast', () => {
  it('checks passing contrast', async () => {
    const res = await request(app)
      .post('/api/v1/validate/contrast')
      .send({ foreground: '#000000', background: '#ffffff' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('checks failing contrast', async () => {
    const res = await request(app)
      .post('/api/v1/validate/contrast')
      .send({ foreground: '#cccccc', background: '#ffffff' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 without required params', async () => {
    const res = await request(app)
      .post('/api/v1/validate/contrast')
      .send({ foreground: '#000000' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/validate/accessibility', () => {
  it('validates accessible HTML', async () => {
    const res = await request(app)
      .post('/api/v1/validate/accessibility')
      .send({ html: '<button type="button">Click me</button>' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('validates HTML with CSS', async () => {
    const res = await request(app)
      .post('/api/v1/validate/accessibility')
      .send({
        html: '<button type="button">Click</button>',
        css: '.btn { transition: opacity 0.2s ease; }',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 without html', async () => {
    const res = await request(app)
      .post('/api/v1/validate/accessibility')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/validate/code', () => {
  it('reviews code and returns score/grade', async () => {
    const res = await request(app)
      .post('/api/v1/validate/code')
      .send({ html: '<button type="button" class="btn">Click me</button>' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBeTypeOf('number');
    expect(res.body.data.grade).toBeTypeOf('string');
    expect(res.body.data).toHaveProperty('approved');
    expect(res.body.data).toHaveProperty('issues');
  });

  it('returns 400 without html', async () => {
    const res = await request(app)
      .post('/api/v1/validate/code')
      .send({});
    expect(res.status).toBe(400);
  });
});
