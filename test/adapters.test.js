/**
 * Framework Adapter Tests
 *
 * Tests React, Vue, and Svelte adapters for component and page generation.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { toReact } from '../adapters/react.js';
import { toVue } from '../adapters/vue.js';
import { toSvelte } from '../adapters/svelte.js';
import { adaptComponent, adaptPage, SUPPORTED_FORMATS } from '../adapters/index.js';
import { parseHTML, parseAttributes, toPascalCase, toKebabCase } from '../adapters/html-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(__dirname, '..', 'tokens');

let client;

beforeAll(async () => {
  const { createDirectClient } = await import('../sdk/direct-client.js');
  client = await createDirectClient({ tokensPath });
});

// ============================================================================
// HTML PARSER
// ============================================================================

describe('HTML Parser', () => {
  it('parses a simple element', () => {
    const nodes = parseHTML('<button type="button" class="btn">Click</button>');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('element');
    expect(nodes[0].tag).toBe('button');
    expect(nodes[0].attrs.type).toBe('button');
    expect(nodes[0].attrs.class).toBe('btn');
    expect(nodes[0].children[0].value).toBe('Click');
  });

  it('parses nested elements', () => {
    const nodes = parseHTML('<div class="card"><h3 class="card__title">Title</h3></div>');
    expect(nodes[0].tag).toBe('div');
    expect(nodes[0].children[0].tag).toBe('h3');
    expect(nodes[0].children[0].children[0].value).toBe('Title');
  });

  it('parses self-closing elements', () => {
    const nodes = parseHTML('<img src="test.jpg" alt="test" />');
    expect(nodes[0].tag).toBe('img');
    expect(nodes[0].selfClosing).toBe(true);
    expect(nodes[0].attrs.src).toBe('test.jpg');
  });

  it('parses void elements without explicit self-close', () => {
    const nodes = parseHTML('<input type="text" class="form-field__input">');
    expect(nodes[0].tag).toBe('input');
    expect(nodes[0].selfClosing).toBe(true);
  });

  it('parses boolean attributes', () => {
    const attrs = parseAttributes(' disabled aria-hidden="true" required');
    expect(attrs.disabled).toBe(true);
    expect(attrs['aria-hidden']).toBe('true');
    expect(attrs.required).toBe(true);
  });

  it('parses comments', () => {
    const nodes = parseHTML('<!-- Section divider --><div>Content</div>');
    expect(nodes[0].type).toBe('comment');
    expect(nodes[0].value).toBe('Section divider');
    expect(nodes[1].tag).toBe('div');
  });
});

describe('Name Utilities', () => {
  it('converts to PascalCase', () => {
    expect(toPascalCase('button')).toBe('AioliButton');
    expect(toPascalCase('card-product')).toBe('AioliCardProduct');
    expect(toPascalCase('form-wizard')).toBe('AioliFormWizard');
  });

  it('converts to kebab-case', () => {
    expect(toKebabCase('button')).toBe('aioli-button');
    expect(toKebabCase('card-product')).toBe('aioli-card-product');
  });
});

// ============================================================================
// SUPPORTED FORMATS
// ============================================================================

describe('SUPPORTED_FORMATS', () => {
  it('lists all four formats', () => {
    expect(SUPPORTED_FORMATS).toEqual(['html', 'react', 'vue', 'svelte']);
  });
});

// ============================================================================
// REACT ADAPTER
// ============================================================================

describe('React Adapter', () => {
  it('converts a button to React JSX', () => {
    const result = toReact({
      type: 'button',
      html: '<button type="button" class="btn btn--primary btn--md"><span class="btn__text">Click Me</span></button>',
    });

    expect(result.framework).toBe('react');
    expect(result.language).toBe('jsx');
    expect(result.componentName).toBe('AioliButton');
    expect(result.code).toContain('export default function AioliButton');
    expect(result.code).toContain('className=');
    expect(result.code).toContain("import 'aioli/css/aioli.css'");
  });

  it('converts a card to React JSX', () => {
    const result = toReact({
      type: 'card',
      html: '<article class="card card--default"><div class="card__body"><h3 class="card__title">Title</h3><div class="card__content">Content</div></div></article>',
    });

    expect(result.componentName).toBe('AioliCard');
    expect(result.code).toContain('export default function AioliCard');
    expect(result.code).toContain('className=');
  });

  it('converts inline styles to React style object', () => {
    const result = toReact({
      type: 'card',
      html: '<article class="card" style="backdrop-filter: blur(10px); background: rgba(255,255,255,0.1);"><div class="card__body">Content</div></article>',
    });

    expect(result.code).toContain('style={');
  });

  it('handles self-closing elements in JSX', () => {
    const result = toReact({
      type: 'input',
      html: '<div class="form-field"><label for="test" class="form-field__label">Label</label><input type="text" id="test" class="form-field__input" placeholder="Enter..." /></div>',
    });

    expect(result.code).toContain('<input');
    expect(result.code).toContain('/>');
  });

  it('handles comments in JSX', () => {
    const result = toReact({
      type: 'card',
      html: '<!-- Section divider --><article class="card"><div class="card__body">Content</div></article>',
    });

    expect(result.code).toContain('{/*');
  });

  it('uses custom component name', () => {
    const result = toReact(
      { type: 'button', html: '<button class="btn">Click</button>' },
      { componentName: 'MyButton' }
    );

    expect(result.componentName).toBe('MyButton');
    expect(result.code).toContain('export default function MyButton');
  });
});

// ============================================================================
// VUE ADAPTER
// ============================================================================

describe('Vue Adapter', () => {
  it('converts a button to Vue SFC', () => {
    const result = toVue({
      type: 'button',
      html: '<button type="button" class="btn btn--primary btn--md"><span class="btn__text">Click Me</span></button>',
    });

    expect(result.framework).toBe('vue');
    expect(result.language).toBe('vue');
    expect(result.componentName).toBe('AioliButton');
    expect(result.code).toContain('<template>');
    expect(result.code).toContain('<script setup>');
    expect(result.code).toContain('defineProps');
    expect(result.code).toContain('defineEmits');
    expect(result.code).toContain("import 'aioli/css/aioli.css'");
  });

  it('converts a card to Vue SFC', () => {
    const result = toVue({
      type: 'card',
      html: '<article class="card card--default"><div class="card__body"><h3 class="card__title">Title</h3></div></article>',
    });

    expect(result.componentName).toBe('AioliCard');
    expect(result.code).toContain('<template>');
    expect(result.code).toContain('defineProps');
  });

  it('includes computed class for variant components', () => {
    const result = toVue({
      type: 'button',
      html: '<button class="btn btn--primary btn--md"><span class="btn__text">Click</span></button>',
    });

    expect(result.code).toContain('computed');
    expect(result.code).toContain('classes');
  });

  it('emits events for interactive components', () => {
    const result = toVue({
      type: 'button',
      html: '<button class="btn"><span class="btn__text">Click</span></button>',
    });

    expect(result.code).toContain("defineEmits([");
    expect(result.code).toContain("'click'");
  });
});

// ============================================================================
// SVELTE ADAPTER
// ============================================================================

describe('Svelte Adapter', () => {
  it('converts a button to Svelte', () => {
    const result = toSvelte({
      type: 'button',
      html: '<button type="button" class="btn btn--primary btn--md"><span class="btn__text">Click Me</span></button>',
    });

    expect(result.framework).toBe('svelte');
    expect(result.language).toBe('svelte');
    expect(result.componentName).toBe('AioliButton');
    expect(result.code).toContain('<script>');
    expect(result.code).toContain('export let variant');
    expect(result.code).toContain('export let size');
    expect(result.code).toContain("import 'aioli/css/aioli.css'");
  });

  it('converts a card to Svelte', () => {
    const result = toSvelte({
      type: 'card',
      html: '<article class="card card--default"><div class="card__body"><h3 class="card__title">Title</h3></div></article>',
    });

    expect(result.componentName).toBe('AioliCard');
    expect(result.code).toContain('export let variant');
    expect(result.code).toContain('export let title');
  });

  it('includes reactive class declaration', () => {
    const result = toSvelte({
      type: 'button',
      html: '<button class="btn btn--primary btn--md"><span class="btn__text">Click</span></button>',
    });

    expect(result.code).toContain('$: classes');
  });

  it('adds event forwarding on buttons', () => {
    const result = toSvelte({
      type: 'button',
      html: '<button type="button" class="btn"><span class="btn__text">Click</span></button>',
    });

    expect(result.code).toContain('on:click');
  });
});

// ============================================================================
// ADAPTER ROUTER (adaptComponent)
// ============================================================================

describe('adaptComponent', () => {
  it('passes through for html format', () => {
    const input = { type: 'button', html: '<button>Click</button>', tokens: [] };
    const result = adaptComponent(input, 'html');
    expect(result).toBe(input); // Same reference — passthrough
  });

  it('passes through when no format specified', () => {
    const input = { type: 'button', html: '<button>Click</button>', tokens: [] };
    const result = adaptComponent(input);
    expect(result).toBe(input);
  });

  it('adapts to react', () => {
    const result = adaptComponent(
      { type: 'button', html: '<button class="btn"><span class="btn__text">Click</span></button>' },
      'react'
    );
    expect(result.code).toBeDefined();
    expect(result.framework).toBe('react');
    expect(result.html).toBeDefined(); // Original HTML preserved
  });

  it('adapts to vue', () => {
    const result = adaptComponent(
      { type: 'button', html: '<button class="btn"><span class="btn__text">Click</span></button>' },
      'vue'
    );
    expect(result.code).toBeDefined();
    expect(result.framework).toBe('vue');
  });

  it('adapts to svelte', () => {
    const result = adaptComponent(
      { type: 'button', html: '<button class="btn"><span class="btn__text">Click</span></button>' },
      'svelte'
    );
    expect(result.code).toBeDefined();
    expect(result.framework).toBe('svelte');
  });

  it('throws on unknown format', () => {
    expect(() =>
      adaptComponent({ type: 'button', html: '<button>Click</button>' }, 'angular')
    ).toThrow('Unknown format');
  });

  it('throws when result has no html', () => {
    expect(() =>
      adaptComponent({ type: 'button' }, 'react')
    ).toThrow('must include html');
  });
});

// ============================================================================
// ADAPTER ROUTER (adaptPage)
// ============================================================================

describe('adaptPage', () => {
  it('passes through for html format', () => {
    const input = { type: 'page-composition', html: '<div>Page</div>', sections: [] };
    const result = adaptPage(input, 'html');
    expect(result).toBe(input);
  });

  it('adapts page to react', () => {
    const result = adaptPage(
      {
        type: 'page-composition',
        pageType: 'marketing-page',
        html: '<div class="page-composition"><section class="hero">Hero</section></div>',
        sections: [{ type: 'hero', html: '<section class="hero">Hero</section>' }],
      },
      'react'
    );
    expect(result.code).toBeDefined();
    expect(result.framework).toBe('react');
    expect(result.sections).toBeInstanceOf(Array);
  });

  it('throws on unknown format', () => {
    expect(() =>
      adaptPage({ html: '<div>Page</div>', sections: [] }, 'angular')
    ).toThrow('Unknown format');
  });
});

// ============================================================================
// SDK INTEGRATION — Direct Client with Format
// ============================================================================

describe('SDK: generateComponent with format', () => {
  it('returns html by default (backward compat)', async () => {
    const result = await client.generateComponent('primary button');
    expect(result.html).toContain('btn');
    expect(result.code).toBeUndefined();
    expect(result.framework).toBeUndefined();
  });

  it('returns React code when format=react', async () => {
    const result = await client.generateComponent('primary button', { format: 'react' });
    expect(result.html).toBeDefined(); // HTML always included
    expect(result.code).toBeDefined();
    expect(result.framework).toBe('react');
    expect(result.language).toBe('jsx');
    expect(result.componentName).toBeDefined();
    expect(result.code).toContain('export default function');
    expect(result.code).toContain('className=');
  });

  it('returns Vue code when format=vue', async () => {
    const result = await client.generateComponent('card with title', { format: 'vue' });
    expect(result.code).toBeDefined();
    expect(result.framework).toBe('vue');
    expect(result.code).toContain('<template>');
    expect(result.code).toContain('<script setup>');
  });

  it('returns Svelte code when format=svelte', async () => {
    const result = await client.generateComponent('alert message', { format: 'svelte' });
    expect(result.code).toBeDefined();
    expect(result.framework).toBe('svelte');
    expect(result.code).toContain('<script>');
    expect(result.code).toContain('export let');
  });
});

describe('SDK: generatePage with format', () => {
  it('returns html by default (backward compat)', async () => {
    const result = await client.generatePage('marketing landing page');
    expect(result.html).toBeDefined();
    expect(result.code).toBeUndefined();
  });

  it('returns React code when format=react', async () => {
    const result = await client.generatePage('marketing landing page', { format: 'react' });
    expect(result.html).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.framework).toBe('react');
    expect(result.code).toContain('export default function');
  });
});

// ============================================================================
// REST API INTEGRATION (supertest)
// ============================================================================

import request from 'supertest';
import app from '../api-server/index.js';

describe('POST /api/v1/generate/component with format', () => {
  it('returns html by default', async () => {
    const res = await request(app)
      .post('/api/v1/generate/component')
      .send({ description: 'primary button' });
    expect(res.status).toBe(200);
    expect(res.body.data.html).toContain('btn');
    expect(res.body.data.code).toBeUndefined();
  });

  it('returns React code with format=react', async () => {
    const res = await request(app)
      .post('/api/v1/generate/component')
      .send({ description: 'primary button', format: 'react' });
    expect(res.status).toBe(200);
    expect(res.body.data.html).toBeDefined();
    expect(res.body.data.code).toBeDefined();
    expect(res.body.data.framework).toBe('react');
    expect(res.body.data.componentName).toBeDefined();
  });

  it('returns Vue code with format=vue', async () => {
    const res = await request(app)
      .post('/api/v1/generate/component')
      .send({ description: 'card with title', format: 'vue' });
    expect(res.status).toBe(200);
    expect(res.body.data.code).toBeDefined();
    expect(res.body.data.framework).toBe('vue');
  });

  it('returns Svelte code with format=svelte', async () => {
    const res = await request(app)
      .post('/api/v1/generate/component')
      .send({ description: 'alert message', format: 'svelte' });
    expect(res.status).toBe(200);
    expect(res.body.data.code).toBeDefined();
    expect(res.body.data.framework).toBe('svelte');
  });
});

describe('POST /api/v1/generate/page with format', () => {
  it('returns React code with format=react', async () => {
    const res = await request(app)
      .post('/api/v1/generate/page')
      .send({ description: 'marketing landing page', format: 'react' });
    expect(res.status).toBe(200);
    expect(res.body.data.code).toBeDefined();
    expect(res.body.data.framework).toBe('react');
  });
});
