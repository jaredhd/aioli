/**
 * Component Generator Agent - Comprehensive Test Suite
 *
 * Tests all 31 COMPONENT_TEMPLATES, variant/size generation,
 * natural language parsing, error handling, and full integration
 * via createAgentSystem.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { createAgentSystem } from '../agents/index.js';
import { COMPONENT_TEMPLATES } from '../agents/component-generator-agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensDir = resolve(__dirname, '..', 'tokens');

// ---------------------------------------------------------------------------
// Shared agent system — created once before all tests
// ---------------------------------------------------------------------------

let agents;

beforeAll(() => {
  agents = createAgentSystem(tokensDir);
});

// ===========================================================================
// 1. Every template generates valid output
// ===========================================================================

describe('All 31 component templates generate successfully', () => {
  const templateKeys = Object.keys(COMPONENT_TEMPLATES);

  it('should have exactly 31 templates', () => {
    expect(templateKeys.length).toBe(31);
  });

  describe.each(templateKeys)('template: %s', (key) => {
    it('returns success with valid html, tokens array, and a11y object', () => {
      const response = agents.component.handleRequest({
        action: 'generate',
        componentType: key,
      });

      // response.success === true
      expect(response.success).toBe(true);

      // response.data.html is a non-empty string
      expect(typeof response.data.html).toBe('string');
      expect(response.data.html.length).toBeGreaterThan(0);

      // html does NOT contain the literal string 'undefined'
      expect(response.data.html).not.toContain('undefined');

      // response.data.tokens is an array
      expect(Array.isArray(response.data.tokens)).toBe(true);

      // response.data.a11y is an object
      expect(typeof response.data.a11y).toBe('object');
      expect(response.data.a11y).not.toBeNull();
    });
  });
});

// ===========================================================================
// 2. Variant generation — button variants produce different HTML
// ===========================================================================

describe('Button variant generation', () => {
  const variants = ['primary', 'secondary', 'danger', 'ghost'];

  it('generates different HTML for each variant', () => {
    const outputs = variants.map((variant) => {
      const response = agents.component.handleRequest({
        action: 'generate',
        componentType: 'button',
        props: { variant },
      });
      expect(response.success).toBe(true);
      return response.data.html;
    });

    // Every pair of variants should produce distinct HTML
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(outputs[i]).not.toBe(outputs[j]);
      }
    }
  });

  it.each(variants)('variant "%s" includes the variant class', (variant) => {
    const response = agents.component.handleRequest({
      action: 'generate',
      componentType: 'button',
      props: { variant },
    });
    expect(response.data.html).toContain(`btn--${variant}`);
  });
});

// ===========================================================================
// 3. Size generation — button sizes
// ===========================================================================

describe('Button size generation', () => {
  const sizes = ['sm', 'md', 'lg'];

  it('generates different HTML for each size', () => {
    const outputs = sizes.map((size) => {
      const response = agents.component.handleRequest({
        action: 'generate',
        componentType: 'button',
        props: { size },
      });
      expect(response.success).toBe(true);
      return response.data.html;
    });

    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(outputs[i]).not.toBe(outputs[j]);
      }
    }
  });

  it.each(sizes)('size "%s" includes the size class', (size) => {
    const response = agents.component.handleRequest({
      action: 'generate',
      componentType: 'button',
      props: { size },
    });
    expect(response.data.html).toContain(`btn--${size}`);
  });
});

// ===========================================================================
// 4. parseDescription — natural language parsing
// ===========================================================================

describe('parseDescription — natural language parsing', () => {
  it('"large primary button" -> type: button, variant: primary, size: lg', () => {
    const response = agents.component.handleRequest({
      action: 'parseDescription',
      description: 'large primary button',
    });
    expect(response.success).toBe(true);
    expect(response.data.componentType).toBe('button');
    expect(response.data.props.variant).toBe('primary');
    expect(response.data.props.size).toBe('lg');
  });

  it('"search field with placeholder" -> type: input', () => {
    const response = agents.component.handleRequest({
      action: 'parseDescription',
      description: 'search field with placeholder',
    });
    expect(response.success).toBe(true);
    expect(response.data.componentType).toBe('input');
  });

  it('"danger alert" -> type: alert, variant: danger', () => {
    const response = agents.component.handleRequest({
      action: 'parseDescription',
      description: 'danger alert',
    });
    expect(response.success).toBe(true);
    expect(response.data.componentType).toBe('alert');
    expect(response.data.props.variant).toBe('danger');
  });

  it('"checkbox with label" -> type: checkbox', () => {
    const response = agents.component.handleRequest({
      action: 'parseDescription',
      description: 'checkbox with label',
    });
    expect(response.success).toBe(true);
    expect(response.data.componentType).toBe('checkbox');
  });

  it('"select dropdown" -> type: select (NOT dropdown)', () => {
    const response = agents.component.handleRequest({
      action: 'parseDescription',
      description: 'select dropdown',
    });
    expect(response.success).toBe(true);
    // "select" appears first in the string so earliest-match-position wins
    expect(response.data.componentType).toBe('select');
  });
});

// ===========================================================================
// 5. Error handling — null, undefined, invalid action, unknown type
// ===========================================================================

describe('Error handling', () => {
  it('returns error for null request', () => {
    const response = agents.component.handleRequest(null);
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  it('returns error for undefined request', () => {
    const response = agents.component.handleRequest(undefined);
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  it('returns error for request with no action', () => {
    const response = agents.component.handleRequest({});
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  it('returns error for invalid/unknown action', () => {
    const response = agents.component.handleRequest({ action: 'nonExistentAction' });
    expect(response.success).toBe(false);
    expect(response.error).toContain('Unknown action');
  });

  it('returns error data for unknown component type via generate', () => {
    const response = agents.component.handleRequest({
      action: 'generate',
      componentType: 'unicorn',
    });
    // handleRequest wraps generate() — success is true but data.error is true
    expect(response.success).toBe(true);
    expect(response.data.error).toBe(true);
    expect(response.data.message).toContain('Unknown component type');
    expect(Array.isArray(response.data.availableTypes)).toBe(true);
  });
});

// ===========================================================================
// 6. listComponents — returns all 31 components
// ===========================================================================

describe('listComponents action', () => {
  it('returns exactly 31 components', () => {
    const response = agents.component.handleRequest({ action: 'listComponents' });
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(31);
  });

  it('each listed component has name, category, and description', () => {
    const response = agents.component.handleRequest({ action: 'listComponents' });
    for (const comp of response.data) {
      expect(typeof comp.name).toBe('string');
      expect(comp.name.length).toBeGreaterThan(0);
      expect(typeof comp.category).toBe('string');
      expect(typeof comp.description).toBe('string');
    }
  });

  it('listed component names match COMPONENT_TEMPLATES keys', () => {
    const response = agents.component.handleRequest({ action: 'listComponents' });
    const names = response.data.map((c) => c.name).sort();
    const keys = Object.keys(COMPONENT_TEMPLATES).sort();
    expect(names).toEqual(keys);
  });
});

// ===========================================================================
// 7. Full generate flow via handleRequest — integration check
// ===========================================================================

describe('Full generate flow via handleRequest', () => {
  it('generates a button with specific props and returns complete data', () => {
    const response = agents.component.handleRequest({
      action: 'generate',
      componentType: 'button',
      props: {
        variant: 'danger',
        size: 'lg',
        children: 'Delete',
        disabled: true,
      },
    });

    expect(response.success).toBe(true);

    const { data } = response;
    expect(data.type).toBe('button');
    expect(data.category).toBe('atom');
    expect(data.html).toContain('btn--danger');
    expect(data.html).toContain('btn--lg');
    expect(data.html).toContain('Delete');
    expect(data.html).toContain('disabled');
    expect(data.html).toContain('aria-disabled="true"');
    expect(Array.isArray(data.tokens)).toBe(true);
    expect(data.tokens.length).toBeGreaterThan(0);
    expect(data.a11y.role).toBe('button');
  });

  it('generates a card with title and content', () => {
    const response = agents.component.handleRequest({
      action: 'generate',
      componentType: 'card',
      props: {
        variant: 'elevated',
        title: 'Test Card',
        content: 'Card body text',
      },
    });

    expect(response.success).toBe(true);
    expect(response.data.html).toContain('card--elevated');
    expect(response.data.html).toContain('Test Card');
    expect(response.data.html).toContain('Card body text');
    expect(response.data.a11y.role).toBe('article');
  });

  it('generates an alert with danger variant and assertive live region', () => {
    const response = agents.component.handleRequest({
      action: 'generate',
      componentType: 'alert',
      props: {
        variant: 'danger',
        message: 'Something went wrong',
        dismissible: true,
      },
    });

    expect(response.success).toBe(true);
    expect(response.data.html).toContain('alert--danger');
    expect(response.data.html).toContain('aria-live="assertive"');
    expect(response.data.html).toContain('Something went wrong');
    expect(response.data.html).toContain('Dismiss alert');
  });

  it('generates a modal with proper ARIA attributes', () => {
    const response = agents.component.handleRequest({
      action: 'generate',
      componentType: 'modal',
      props: {
        title: 'Confirm Action',
        content: 'Are you sure?',
        id: 'test-modal',
      },
    });

    expect(response.success).toBe(true);
    expect(response.data.html).toContain('role="dialog"');
    expect(response.data.html).toContain('aria-modal="true"');
    expect(response.data.html).toContain('Confirm Action');
    expect(response.data.html).toContain('Are you sure?');
    expect(response.data.html).toContain('aria-labelledby="test-modal-title"');
  });

  it('generateFromDescription produces a full component', () => {
    const response = agents.component.handleRequest({
      action: 'generateFromDescription',
      description: 'a small ghost button labeled "Cancel"',
    });

    expect(response.success).toBe(true);
    expect(response.data.type).toBe('button');
    expect(response.data.html).toContain('btn--ghost');
    expect(response.data.html).toContain('btn--sm');
  });
});
