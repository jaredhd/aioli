/**
 * Aioli Framework Adapters — Vue 3 SFC
 *
 * Transforms Aioli's generated HTML into Vue 3 Single File Components
 * using <script setup> composition API.
 */

import { parseHTML, toPascalCase, toKebabCase } from './html-parser.js';

// Components that need Vue state (ref)
const STATEFUL_COMPONENTS = {
  modal: { ref: 'isOpen', type: 'Boolean', default: false },
  tabs: { ref: 'activeTab', type: 'Number', default: 0 },
  accordion: { ref: 'expandedItems', type: 'Set', default: 'new Set()' },
  dropdown: { ref: 'isOpen', type: 'Boolean', default: false },
  toast: { ref: 'visible', type: 'Boolean', default: true },
};

// Components that emit events
const EVENT_EMITTERS = {
  button: ['click'],
  input: ['update:modelValue', 'input', 'blur', 'focus'],
  toggle: ['update:modelValue', 'change'],
  checkbox: ['update:modelValue', 'change'],
  radio: ['update:modelValue', 'change'],
  select: ['update:modelValue', 'change'],
  modal: ['close'],
  dropdown: ['select'],
  tabs: ['update:activeIndex'],
  alert: ['dismiss'],
  textarea: ['update:modelValue', 'input'],
};

/**
 * Convert Aioli generation result to a Vue 3 SFC.
 *
 * @param {Object} result - Generation result from component generator
 * @param {Object} options - Adapter options
 * @returns {{ code: string, componentName: string, language: string, framework: string, cssImport: string }}
 */
export function toVue(result, options = {}) {
  const { type, html } = result;
  const componentName = options.componentName || toPascalCase(type);
  const cssImport = options.cssImport || 'aioli/css/aioli.css';

  const propDefs = buildVueProps(type);
  const emits = EVENT_EMITTERS[type] || ['click'];
  const stateInfo = STATEFUL_COMPONENTS[type];

  // Transform HTML to Vue template
  const templateHTML = htmlToVueTemplate(html, type, 1);

  // Build <script setup>
  const scriptLines = [];
  const vueImports = [];

  if (stateInfo) {
    vueImports.push('ref');
  }
  if (propDefs.needsComputed) {
    vueImports.push('computed');
  }

  if (vueImports.length > 0) {
    scriptLines.push(`import { ${vueImports.join(', ')} } from 'vue';`);
  }
  scriptLines.push(`import '${cssImport}';`);
  scriptLines.push('');
  scriptLines.push(`const props = defineProps(${formatVueProps(propDefs.props)});`);

  if (emits.length > 0) {
    scriptLines.push(`defineEmits([${emits.map(e => `'${e}'`).join(', ')}]);`);
  }

  if (stateInfo) {
    scriptLines.push('');
    if (stateInfo.type === 'Set') {
      scriptLines.push(`const ${stateInfo.ref} = ref(${stateInfo.default});`);
    } else {
      scriptLines.push(`const ${stateInfo.ref} = ref(${JSON.stringify(stateInfo.default)});`);
    }
  }

  if (propDefs.computedClass) {
    scriptLines.push('');
    scriptLines.push(propDefs.computedClass);
  }

  // Assemble SFC
  const lines = [];
  lines.push('<template>');
  lines.push(templateHTML);
  lines.push('</template>');
  lines.push('');
  lines.push('<script setup>');
  lines.push(...scriptLines);
  lines.push('</script>');
  lines.push('');

  return {
    code: lines.join('\n'),
    componentName,
    language: 'vue',
    framework: 'vue',
    cssImport,
  };
}

// ============================================================================
// VUE PROP BUILDER
// ============================================================================

function buildVueProps(type) {
  const PROP_DEFS = {
    button: [
      { name: 'variant', type: 'String', default: 'primary' },
      { name: 'size', type: 'String', default: 'md' },
      { name: 'label', type: 'String', default: 'Button' },
      { name: 'disabled', type: 'Boolean', default: false },
      { name: 'icon', type: 'String', default: null },
    ],
    input: [
      { name: 'type', type: 'String', default: 'text' },
      { name: 'label', type: 'String', default: 'Label' },
      { name: 'placeholder', type: 'String', default: 'Enter value...' },
      { name: 'required', type: 'Boolean', default: false },
      { name: 'error', type: 'String', default: null },
      { name: 'modelValue', type: 'String', default: '' },
    ],
    card: [
      { name: 'variant', type: 'String', default: 'default' },
      { name: 'title', type: 'String', default: 'Card Title' },
      { name: 'image', type: 'String', default: null },
    ],
    modal: [
      { name: 'title', type: 'String', default: 'Dialog Title' },
      { name: 'modelValue', type: 'Boolean', default: false },
    ],
    alert: [
      { name: 'variant', type: 'String', default: 'info' },
      { name: 'title', type: 'String', default: null },
      { name: 'message', type: 'String', default: 'This is an alert message.' },
      { name: 'dismissible', type: 'Boolean', default: false },
    ],
    tabs: [
      { name: 'tabs', type: 'Array', default: null },
      { name: 'activeIndex', type: 'Number', default: 0 },
    ],
    accordion: [
      { name: 'items', type: 'Array', default: null },
      { name: 'allowMultiple', type: 'Boolean', default: false },
    ],
    dropdown: [
      { name: 'trigger', type: 'String', default: 'Menu' },
      { name: 'items', type: 'Array', default: null },
    ],
    toggle: [
      { name: 'label', type: 'String', default: 'Toggle' },
      { name: 'modelValue', type: 'Boolean', default: false },
    ],
    select: [
      { name: 'label', type: 'String', default: 'Select' },
      { name: 'options', type: 'Array', default: null },
      { name: 'modelValue', type: 'String', default: null },
    ],
    badge: [
      { name: 'variant', type: 'String', default: 'default' },
      { name: 'label', type: 'String', default: 'Badge' },
    ],
    avatar: [
      { name: 'src', type: 'String', default: null },
      { name: 'alt', type: 'String', default: '' },
      { name: 'size', type: 'String', default: 'md' },
      { name: 'initials', type: 'String', default: null },
    ],
    tooltip: [
      { name: 'content', type: 'String', default: 'Tooltip text' },
      { name: 'position', type: 'String', default: 'top' },
    ],
    spinner: [
      { name: 'size', type: 'String', default: 'md' },
      { name: 'label', type: 'String', default: 'Loading' },
    ],
    progress: [
      { name: 'value', type: 'Number', default: 0 },
      { name: 'max', type: 'Number', default: 100 },
      { name: 'label', type: 'String', default: 'Progress' },
    ],
    checkbox: [
      { name: 'label', type: 'String', default: 'Option' },
      { name: 'modelValue', type: 'Boolean', default: false },
    ],
    radio: [
      { name: 'name', type: 'String', default: 'Group' },
      { name: 'options', type: 'Array', default: null },
      { name: 'modelValue', type: 'String', default: null },
    ],
  };

  const defs = PROP_DEFS[type];
  let computedClass = null;
  let needsComputed = false;

  if (!defs) {
    return {
      props: [{ name: 'label', type: 'String', default: 'Content' }],
      computedClass: null,
      needsComputed: false,
    };
  }

  // Generate computed class for components with variant/size
  if (defs.some(d => d.name === 'variant')) {
    const block = getBlockName(type);
    const hasSize = defs.some(d => d.name === 'size');
    needsComputed = true;
    if (hasSize) {
      computedClass = `const classes = computed(() => ['${block}', \`${block}--\${props.variant}\`, \`${block}--\${props.size}\`]);`;
    } else {
      computedClass = `const classes = computed(() => ['${block}', \`${block}--\${props.variant}\`]);`;
    }
  }

  return { props: defs, computedClass, needsComputed };
}

/**
 * Format Vue props into defineProps() syntax.
 */
function formatVueProps(props) {
  const entries = props.map(p => {
    const parts = [`type: ${p.type}`];
    if (p.default !== null && p.default !== undefined) {
      if (typeof p.default === 'string') {
        parts.push(`default: '${p.default}'`);
      } else {
        parts.push(`default: ${JSON.stringify(p.default)}`);
      }
    }
    return `  ${p.name}: { ${parts.join(', ')} }`;
  });
  return `{\n${entries.join(',\n')}\n}`;
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
// HTML → VUE TEMPLATE TRANSFORMER
// ============================================================================

/**
 * Convert HTML to Vue template syntax.
 */
function htmlToVueTemplate(html, componentType, baseIndent) {
  const nodes = parseHTML(html);
  return nodes.map(n => nodeToVue(n, baseIndent, componentType)).join('\n');
}

/**
 * Convert a single AST node to Vue template syntax.
 */
function nodeToVue(node, indent, componentType) {
  const pad = '  '.repeat(indent);

  if (node.type === 'text') return `${pad}${node.value}`;
  if (node.type === 'comment') return `${pad}<!-- ${node.value} -->`;

  // Build Vue-style attributes
  const attrs = buildVueAttrs(node.attrs, componentType);
  const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';

  if (node.selfClosing || (node.children.length === 0 && canSelfClose(node.tag))) {
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
  const childVue = node.children.map(c => nodeToVue(c, indent + 1, componentType)).join('\n');
  return `${pad}<${node.tag}${attrStr}>\n${childVue}\n${pad}</${node.tag}>`;
}

function canSelfClose(tag) {
  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  return voidElements.has(tag);
}

/**
 * Build Vue-idiomatic attribute list from attrs object.
 */
function buildVueAttrs(attrs, componentType) {
  if (!attrs || Object.keys(attrs).length === 0) return [];

  const parts = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === true) {
      parts.push(key);
      continue;
    }

    if (key === 'style' && typeof value === 'string') {
      // Keep inline style as-is for Vue (Vue handles style strings)
      parts.push(`style="${value}"`);
    } else if (key === 'hidden' && value === true) {
      parts.push('v-show="false"');
    } else {
      parts.push(`${key}="${value}"`);
    }
  }

  return parts;
}

export default toVue;
