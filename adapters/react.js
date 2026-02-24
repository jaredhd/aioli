/**
 * Aioli Framework Adapters — React/JSX
 *
 * Transforms Aioli's generated HTML into idiomatic React functional components.
 * Produces copy-paste ready JSX with proper props, state hooks, and event handlers.
 */

import { parseHTML, extractProps, toPascalCase, serializeNode } from './html-parser.js';

// Components that need React state management
const STATEFUL_COMPONENTS = {
  modal: { state: 'isOpen', setter: 'setIsOpen', type: 'boolean', default: false },
  tabs: { state: 'activeTab', setter: 'setActiveTab', type: 'number', default: 0 },
  accordion: { state: 'expandedItems', setter: 'setExpandedItems', type: 'set', default: 'new Set()' },
  dropdown: { state: 'isOpen', setter: 'setIsOpen', type: 'boolean', default: false },
  toast: { state: 'visible', setter: 'setVisible', type: 'boolean', default: true },
  // AI-Native Components
  'prompt-input': { state: 'value', setter: 'setValue', type: 'string', default: "''" },
  'model-selector': { state: 'isOpen', setter: 'setIsOpen', type: 'boolean', default: false },
  'tool-call-card': { state: 'isExpanded', setter: 'setIsExpanded', type: 'boolean', default: false },
  'thumbs-rating': { state: 'rating', setter: 'setRating', type: 'string', default: null },
};

// HTML attr → JSX attr mapping
const ATTR_MAP = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autofocus: 'autoFocus',
  autocomplete: 'autoComplete',
  'aria-labelledby': 'aria-labelledby',
  'aria-describedby': 'aria-describedby',
  'aria-controls': 'aria-controls',
  'aria-expanded': 'aria-expanded',
  'aria-selected': 'aria-selected',
  'aria-hidden': 'aria-hidden',
  'aria-live': 'aria-live',
  'aria-modal': 'aria-modal',
  'aria-haspopup': 'aria-haspopup',
  'aria-disabled': 'aria-disabled',
  'aria-invalid': 'aria-invalid',
  'aria-required': 'aria-required',
  'data-allow-multiple': 'data-allow-multiple',
};

/**
 * Convert Aioli generation result to a React component.
 *
 * @param {Object} result - Generation result from component generator
 * @param {Object} options - Adapter options
 * @returns {{ code: string, componentName: string, language: string, framework: string, cssImport: string }}
 */
export function toReact(result, options = {}) {
  const { type, html, props: genProps } = result;
  const componentName = options.componentName || toPascalCase(type);
  const cssImport = options.cssImport || 'aioli/css/aioli.css';

  // Build the component
  const stateInfo = STATEFUL_COMPONENTS[type];
  const imports = [`import '${cssImport}';`];
  const hooks = [];

  if (stateInfo) {
    imports.unshift("import { useState } from 'react';");
    if (stateInfo.type === 'set') {
      hooks.push(`const [${stateInfo.state}, ${stateInfo.setter}] = useState(${stateInfo.default});`);
    } else {
      hooks.push(`const [${stateInfo.state}, ${stateInfo.setter}] = useState(${JSON.stringify(stateInfo.default === 'false' ? false : stateInfo.default)});`);
    }
  }

  // Extract props from the template definition (if available via genProps)
  const propDefs = buildPropSignature(type, genProps);

  // Transform HTML to JSX
  const jsx = htmlToJSX(html, type, 1);

  // Build the complete component
  const lines = [];
  lines.push(...imports);
  lines.push('');
  lines.push(`export default function ${componentName}(${propDefs.signature}) {`);
  if (hooks.length > 0) {
    hooks.forEach(h => lines.push(`  ${h}`));
    lines.push('');
  }
  if (propDefs.computedClass) {
    lines.push(`  ${propDefs.computedClass}`);
    lines.push('');
  }
  lines.push('  return (');
  lines.push(jsx);
  lines.push('  );');
  lines.push('}');
  lines.push('');

  return {
    code: lines.join('\n'),
    componentName,
    language: 'jsx',
    framework: 'react',
    cssImport,
  };
}

// ============================================================================
// PROP SIGNATURE BUILDER
// ============================================================================

/**
 * Build a React function component prop signature from the component type.
 */
function buildPropSignature(type, genProps) {
  // Map component types to their standard props
  const PROP_DEFS = {
    button: [
      { name: 'variant', default: "'primary'" },
      { name: 'size', default: "'md'" },
      { name: 'children', default: "'Button'" },
      { name: 'disabled', default: 'false' },
      { name: 'icon', default: 'null' },
      { name: 'onClick', default: null },
    ],
    input: [
      { name: 'type', default: "'text'" },
      { name: 'label', default: "'Label'" },
      { name: 'placeholder', default: "'Enter value...'" },
      { name: 'required', default: 'false' },
      { name: 'error', default: 'null' },
      { name: 'id', default: null },
      { name: 'value', default: null },
      { name: 'onChange', default: null },
    ],
    card: [
      { name: 'variant', default: "'default'" },
      { name: 'title', default: "'Card Title'" },
      { name: 'children', default: 'null' },
      { name: 'image', default: 'null' },
      { name: 'actions', default: 'null' },
    ],
    modal: [
      { name: 'title', default: "'Dialog Title'" },
      { name: 'children', default: 'null' },
      { name: 'isOpen', default: 'false' },
      { name: 'onClose', default: null },
      { name: 'actions', default: 'null' },
    ],
    alert: [
      { name: 'variant', default: "'info'" },
      { name: 'title', default: 'null' },
      { name: 'message', default: "'This is an alert message.'" },
      { name: 'dismissible', default: 'false' },
      { name: 'onDismiss', default: null },
    ],
    tabs: [
      { name: 'tabs', default: null },
      { name: 'activeIndex', default: '0' },
      { name: 'onChange', default: null },
    ],
    accordion: [
      { name: 'items', default: null },
      { name: 'allowMultiple', default: 'false' },
    ],
    dropdown: [
      { name: 'trigger', default: "'Menu'" },
      { name: 'items', default: null },
      { name: 'onSelect', default: null },
    ],
    toggle: [
      { name: 'label', default: "'Toggle'" },
      { name: 'checked', default: 'false' },
      { name: 'onChange', default: null },
    ],
    select: [
      { name: 'label', default: "'Select'" },
      { name: 'options', default: null },
      { name: 'value', default: 'null' },
      { name: 'onChange', default: null },
    ],
    badge: [
      { name: 'variant', default: "'default'" },
      { name: 'children', default: "'Badge'" },
    ],
    avatar: [
      { name: 'src', default: 'null' },
      { name: 'alt', default: "''" },
      { name: 'size', default: "'md'" },
      { name: 'initials', default: 'null' },
    ],
    tooltip: [
      { name: 'content', default: "'Tooltip text'" },
      { name: 'position', default: "'top'" },
      { name: 'children', default: 'null' },
    ],
    spinner: [
      { name: 'size', default: "'md'" },
      { name: 'label', default: "'Loading'" },
    ],
    progress: [
      { name: 'value', default: '0' },
      { name: 'max', default: '100' },
      { name: 'label', default: "'Progress'" },
    ],
    checkbox: [
      { name: 'label', default: "'Option'" },
      { name: 'checked', default: 'false' },
      { name: 'onChange', default: null },
    ],
    radio: [
      { name: 'name', default: "'Group'" },
      { name: 'options', default: null },
      { name: 'value', default: 'null' },
      { name: 'onChange', default: null },
    ],
  };

  const defs = PROP_DEFS[type];
  let computedClass = null;

  if (!defs) {
    // Fallback: generic props
    return { signature: '{ children, className, ...props }', computedClass: null };
  }

  const params = defs
    .map(d => d.default !== null ? `${d.name} = ${d.default}` : d.name)
    .join(', ');

  // Generate computed className for components with variant/size
  if (defs.some(d => d.name === 'variant') && type !== 'alert') {
    const block = getBlockName(type);
    const hasSizeParam = defs.some(d => d.name === 'size');
    if (hasSizeParam) {
      computedClass = `const className = \`${block} ${block}--\${variant} ${block}--\${size}\`;`;
    } else {
      computedClass = `const className = \`${block} ${block}--\${variant}\`;`;
    }
  }

  return { signature: `{ ${params} }`, computedClass };
}

/**
 * Get the BEM block name for a component type.
 */
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
    divider: 'divider',
    skeleton: 'skeleton',
    rating: 'rating',
    breadcrumb: 'breadcrumb',
    pagination: 'pagination',
    stepper: 'stepper',
    popover: 'popover',
    toast: 'toast',
    textarea: 'textarea',
    navigation: 'nav',
    table: 'table',
    hero: 'hero',
  };
  return blockMap[type] || type;
}

// ============================================================================
// HTML → JSX TRANSFORMER
// ============================================================================

/**
 * Convert an HTML string to JSX string with proper indentation.
 */
function htmlToJSX(html, componentType, baseIndent) {
  const nodes = parseHTML(html);
  return nodes.map(n => nodeToJSX(n, baseIndent + 1, componentType)).join('\n');
}

/**
 * Convert a single AST node to JSX.
 */
function nodeToJSX(node, indent, componentType) {
  const pad = '  '.repeat(indent);

  if (node.type === 'text') {
    return `${pad}${escapeJSXText(node.value)}`;
  }

  if (node.type === 'comment') {
    return `${pad}{/* ${node.value} */}`;
  }

  // Build JSX attributes
  const attrs = buildJSXAttrs(node.attrs, componentType);

  if (node.selfClosing || node.children.length === 0) {
    return `${pad}<${node.tag}${attrs} />`;
  }

  // Single text child — inline
  if (node.children.length === 1 && node.children[0].type === 'text') {
    const text = escapeJSXText(node.children[0].value);
    return `${pad}<${node.tag}${attrs}>${text}</${node.tag}>`;
  }

  // Multiple children
  const childJSX = node.children.map(c => nodeToJSX(c, indent + 1, componentType)).join('\n');
  return `${pad}<${node.tag}${attrs}>\n${childJSX}\n${pad}</${node.tag}>`;
}

/**
 * Build JSX attribute string from an attrs object.
 */
function buildJSXAttrs(attrs, componentType) {
  if (!attrs || Object.keys(attrs).length === 0) return '';

  const parts = [];
  for (const [key, value] of Object.entries(attrs)) {
    const jsxKey = ATTR_MAP[key] || key;

    if (value === true) {
      // Boolean attribute
      parts.push(jsxKey);
      continue;
    }

    // Handle special JSX patterns
    if (jsxKey === 'className') {
      parts.push(`className="${value}"`);
    } else if (key === 'style' && typeof value === 'string') {
      // Convert inline style string to JSX style object
      const styleObj = parseStyleString(value);
      parts.push(`style={${JSON.stringify(styleObj)}}`);
    } else if (value === 'true' || value === 'false') {
      parts.push(`${jsxKey}={${value}}`);
    } else {
      parts.push(`${jsxKey}="${value}"`);
    }
  }

  return parts.length ? ' ' + parts.join(' ') : '';
}

/**
 * Parse a CSS inline style string into a React style object.
 * 'background-color: red; font-size: 16px;' → { backgroundColor: 'red', fontSize: '16px' }
 */
function parseStyleString(styleStr) {
  const obj = {};
  const declarations = styleStr.split(';').filter(s => s.trim());
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim();
    const val = decl.slice(colonIdx + 1).trim();
    // CSS prop to camelCase
    const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    obj[camelProp] = val;
  }
  return obj;
}

/**
 * Escape special characters in JSX text content.
 */
function escapeJSXText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default toReact;
