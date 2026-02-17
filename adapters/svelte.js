/**
 * Aioli Framework Adapters — Svelte
 *
 * Transforms Aioli's generated HTML into Svelte components
 * with export let props, event forwarding, and reactive declarations.
 */

import { parseHTML, toPascalCase, toKebabCase } from './html-parser.js';

// Components that need Svelte state
const STATEFUL_COMPONENTS = {
  modal: { var: 'isOpen', type: 'boolean', default: 'false' },
  tabs: { var: 'activeTab', type: 'number', default: '0' },
  accordion: { var: 'expandedItems', type: 'Set', default: 'new Set()' },
  dropdown: { var: 'isOpen', type: 'boolean', default: 'false' },
  toast: { var: 'visible', type: 'boolean', default: 'true' },
};

// Event dispatches for components
const EVENT_DISPATCHES = {
  button: ['click'],
  input: ['input', 'change', 'blur', 'focus'],
  toggle: ['change'],
  checkbox: ['change'],
  radio: ['change'],
  select: ['change'],
  modal: ['close'],
  dropdown: ['select'],
  tabs: ['change'],
  alert: ['dismiss'],
  textarea: ['input'],
};

/**
 * Convert Aioli generation result to a Svelte component.
 *
 * @param {Object} result - Generation result from component generator
 * @param {Object} options - Adapter options
 * @returns {{ code: string, componentName: string, language: string, framework: string, cssImport: string }}
 */
export function toSvelte(result, options = {}) {
  const { type, html } = result;
  const componentName = options.componentName || toPascalCase(type);
  const cssImport = options.cssImport || 'aioli/css/aioli.css';

  const propDefs = buildSvelteProps(type);
  const stateInfo = STATEFUL_COMPONENTS[type];
  const events = EVENT_DISPATCHES[type] || ['click'];

  // Build <script> block
  const scriptLines = [];
  scriptLines.push(`  import '${cssImport}';`);

  if (events.length > 0 && needsDispatch(type)) {
    scriptLines.push("  import { createEventDispatcher } from 'svelte';");
    scriptLines.push('  const dispatch = createEventDispatcher();');
  }

  scriptLines.push('');

  // Props
  for (const prop of propDefs) {
    if (prop.default !== undefined && prop.default !== null) {
      if (typeof prop.default === 'string') {
        scriptLines.push(`  export let ${prop.name} = '${prop.default}';`);
      } else if (typeof prop.default === 'boolean' || typeof prop.default === 'number') {
        scriptLines.push(`  export let ${prop.name} = ${prop.default};`);
      } else {
        scriptLines.push(`  export let ${prop.name} = ${JSON.stringify(prop.default)};`);
      }
    } else {
      scriptLines.push(`  export let ${prop.name} = undefined;`);
    }
  }

  // State
  if (stateInfo) {
    scriptLines.push('');
    scriptLines.push(`  let ${stateInfo.var} = ${stateInfo.default};`);
  }

  // Reactive class computation for variant/size components
  const block = getBlockName(type);
  if (propDefs.some(p => p.name === 'variant')) {
    const hasSize = propDefs.some(p => p.name === 'size');
    scriptLines.push('');
    if (hasSize) {
      scriptLines.push(`  $: classes = \`${block} ${block}--\${variant} ${block}--\${size}\`;`);
    } else {
      scriptLines.push(`  $: classes = \`${block} ${block}--\${variant}\`;`);
    }
  }

  // Transform HTML to Svelte template
  const templateHTML = htmlToSvelteTemplate(html, type, 0);

  // Assemble component
  const lines = [];
  lines.push('<script>');
  lines.push(...scriptLines);
  lines.push('</script>');
  lines.push('');
  lines.push(templateHTML);
  lines.push('');

  return {
    code: lines.join('\n'),
    componentName,
    language: 'svelte',
    framework: 'svelte',
    cssImport,
  };
}

// ============================================================================
// SVELTE PROP BUILDER
// ============================================================================

function buildSvelteProps(type) {
  const PROP_DEFS = {
    button: [
      { name: 'variant', default: 'primary' },
      { name: 'size', default: 'md' },
      { name: 'disabled', default: false },
      { name: 'icon', default: null },
    ],
    input: [
      { name: 'type', default: 'text' },
      { name: 'label', default: 'Label' },
      { name: 'placeholder', default: 'Enter value...' },
      { name: 'required', default: false },
      { name: 'error', default: null },
      { name: 'value', default: '' },
    ],
    card: [
      { name: 'variant', default: 'default' },
      { name: 'title', default: 'Card Title' },
      { name: 'image', default: null },
    ],
    modal: [
      { name: 'title', default: 'Dialog Title' },
      { name: 'open', default: false },
    ],
    alert: [
      { name: 'variant', default: 'info' },
      { name: 'title', default: null },
      { name: 'message', default: 'This is an alert message.' },
      { name: 'dismissible', default: false },
    ],
    tabs: [
      { name: 'tabs', default: null },
      { name: 'activeIndex', default: 0 },
    ],
    accordion: [
      { name: 'items', default: null },
      { name: 'allowMultiple', default: false },
    ],
    dropdown: [
      { name: 'trigger', default: 'Menu' },
      { name: 'items', default: null },
    ],
    toggle: [
      { name: 'label', default: 'Toggle' },
      { name: 'checked', default: false },
    ],
    select: [
      { name: 'label', default: 'Select' },
      { name: 'options', default: null },
      { name: 'value', default: null },
    ],
    badge: [
      { name: 'variant', default: 'default' },
      { name: 'label', default: 'Badge' },
    ],
    avatar: [
      { name: 'src', default: null },
      { name: 'alt', default: '' },
      { name: 'size', default: 'md' },
      { name: 'initials', default: null },
    ],
    tooltip: [
      { name: 'content', default: 'Tooltip text' },
      { name: 'position', default: 'top' },
    ],
    spinner: [
      { name: 'size', default: 'md' },
      { name: 'label', default: 'Loading' },
    ],
    progress: [
      { name: 'value', default: 0 },
      { name: 'max', default: 100 },
      { name: 'label', default: 'Progress' },
    ],
    checkbox: [
      { name: 'label', default: 'Option' },
      { name: 'checked', default: false },
    ],
    radio: [
      { name: 'name', default: 'Group' },
      { name: 'options', default: null },
      { name: 'value', default: null },
    ],
  };

  return PROP_DEFS[type] || [{ name: 'label', default: 'Content' }];
}

function needsDispatch(type) {
  // Components that use dispatch() instead of on:event forwarding
  return ['dropdown', 'tabs', 'alert'].includes(type);
}

function getBlockName(type) {
  const blockMap = {
    button: 'btn',
    input: 'form-field',
    card: 'card',
    modal: 'modal',
    alert: 'alert',
    tabs: 'tabs',
    accordion: 'accordion',
    dropdown: 'dropdown',
    toggle: 'toggle',
    select: 'select',
    badge: 'badge',
    avatar: 'avatar',
    tooltip: 'tooltip',
    spinner: 'spinner',
    progress: 'progress',
    checkbox: 'checkbox',
    radio: 'radio',
    chip: 'chip',
    link: 'link',
    navigation: 'nav',
    table: 'table',
    hero: 'hero',
  };
  return blockMap[type] || type;
}

// ============================================================================
// HTML → SVELTE TEMPLATE TRANSFORMER
// ============================================================================

/**
 * Convert HTML to Svelte template syntax.
 */
function htmlToSvelteTemplate(html, componentType, baseIndent) {
  const nodes = parseHTML(html);
  return nodes.map(n => nodeToSvelte(n, baseIndent, componentType)).join('\n');
}

/**
 * Convert a single AST node to Svelte template syntax.
 */
function nodeToSvelte(node, indent, componentType) {
  const pad = '  '.repeat(indent);

  if (node.type === 'text') return `${pad}${node.value}`;
  if (node.type === 'comment') return `${pad}<!-- ${node.value} -->`;

  // Build Svelte-style attributes
  const attrs = buildSvelteAttrs(node.attrs, node.tag, componentType);
  const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';

  if (node.selfClosing || (node.children.length === 0 && isVoidElement(node.tag))) {
    return `${pad}<${node.tag}${attrStr} />`;
  }

  if (node.children.length === 0) {
    return `${pad}<${node.tag}${attrStr}></${node.tag}>`;
  }

  // Single text child — inline
  if (node.children.length === 1 && node.children[0].type === 'text') {
    return `${pad}<${node.tag}${attrStr}>${node.children[0].value}</${node.tag}>`;
  }

  // Multiple children
  const childSvelte = node.children.map(c => nodeToSvelte(c, indent + 1, componentType)).join('\n');
  return `${pad}<${node.tag}${attrStr}>\n${childSvelte}\n${pad}</${node.tag}>`;
}

function isVoidElement(tag) {
  return new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']).has(tag);
}

/**
 * Build Svelte-idiomatic attribute list.
 */
function buildSvelteAttrs(attrs, tag, componentType) {
  if (!attrs || Object.keys(attrs).length === 0) return [];

  const parts = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === true) {
      parts.push(key);
      continue;
    }

    if (key === 'style' && typeof value === 'string') {
      parts.push(`style="${value}"`);
    } else {
      parts.push(`${key}="${value}"`);
    }
  }

  // Add event forwarding for interactive elements
  if (tag === 'button' && !attrs['role']?.includes('tab')) {
    parts.push('on:click');
  }

  return parts;
}

export default toSvelte;
