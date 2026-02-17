/**
 * Aioli Framework Adapters — Shared HTML Parser
 *
 * Lightweight parser for Aioli's predictable BEM HTML output.
 * No external deps — regex-based since we control the HTML structure.
 */

// ============================================================================
// HTML → AST PARSER
// ============================================================================

/**
 * Parse an HTML string into a lightweight AST.
 * Handles Aioli's BEM output: tags, attributes, children, text nodes.
 *
 * @param {string} html - HTML string from component generator
 * @returns {Object[]} Array of AST nodes
 */
export function parseHTML(html) {
  const nodes = [];
  let pos = 0;
  const src = html.trim();

  while (pos < src.length) {
    if (src[pos] === '<') {
      // Comment node
      if (src.startsWith('<!--', pos)) {
        const end = src.indexOf('-->', pos);
        if (end === -1) break;
        nodes.push({ type: 'comment', value: src.slice(pos + 4, end).trim() });
        pos = end + 3;
        continue;
      }

      // Closing tag — skip (handled by recursion)
      if (src[pos + 1] === '/') break;

      // Opening tag
      const tagMatch = src.slice(pos).match(/^<(\w[\w-]*)([\s\S]*?)(\/)?\s*>/);
      if (!tagMatch) { pos++; continue; }

      const tag = tagMatch[1];
      const attrString = tagMatch[2];
      const selfClosing = !!tagMatch[3] || VOID_ELEMENTS.has(tag);
      const attrs = parseAttributes(attrString);

      pos += tagMatch[0].length;

      if (selfClosing) {
        nodes.push({ type: 'element', tag, attrs, children: [], selfClosing: true });
        continue;
      }

      // Parse children until closing tag
      const { children, endPos } = parseChildren(src, pos, tag);
      pos = endPos;
      nodes.push({ type: 'element', tag, attrs, children, selfClosing: false });
    } else {
      // Text node
      const nextTag = src.indexOf('<', pos);
      const text = nextTag === -1 ? src.slice(pos) : src.slice(pos, nextTag);
      const trimmed = text.trim();
      if (trimmed) {
        nodes.push({ type: 'text', value: trimmed });
      }
      pos = nextTag === -1 ? src.length : nextTag;
    }
  }

  return nodes;
}

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Parse an attribute string into a key-value map.
 * Handles: key="value", key='value', key (boolean), key="${expr}"
 */
export function parseAttributes(attrString) {
  const attrs = {};
  if (!attrString) return attrs;

  const re = /([a-zA-Z][\w:.-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m;
  while ((m = re.exec(attrString)) !== null) {
    const key = m[1];
    const value = m[2] ?? m[3] ?? m[4] ?? true; // boolean attr if no value
    attrs[key] = value;
  }
  return attrs;
}

/**
 * Recursively parse children until we hit the closing tag for `parentTag`.
 */
function parseChildren(src, startPos, parentTag) {
  const children = [];
  let pos = startPos;

  while (pos < src.length) {
    if (src[pos] === '<') {
      // Closing tag for parent?
      const closeMatch = src.slice(pos).match(new RegExp(`^</${parentTag}\\s*>`));
      if (closeMatch) {
        return { children, endPos: pos + closeMatch[0].length };
      }

      // Comment
      if (src.startsWith('<!--', pos)) {
        const end = src.indexOf('-->', pos);
        if (end === -1) break;
        children.push({ type: 'comment', value: src.slice(pos + 4, end).trim() });
        pos = end + 3;
        continue;
      }

      // Closing tag for something else (shouldn't happen in well-formed HTML)
      if (src[pos + 1] === '/') {
        const skip = src.indexOf('>', pos);
        pos = skip === -1 ? src.length : skip + 1;
        continue;
      }

      // Opening tag
      const tagMatch = src.slice(pos).match(/^<(\w[\w-]*)([\s\S]*?)(\/)?\s*>/);
      if (!tagMatch) { pos++; continue; }

      const tag = tagMatch[1];
      const attrString = tagMatch[2];
      const selfClosing = !!tagMatch[3] || VOID_ELEMENTS.has(tag);
      const attrs = parseAttributes(attrString);

      pos += tagMatch[0].length;

      if (selfClosing) {
        children.push({ type: 'element', tag, attrs, children: [], selfClosing: true });
        continue;
      }

      const nested = parseChildren(src, pos, tag);
      pos = nested.endPos;
      children.push({ type: 'element', tag, attrs, children: nested.children, selfClosing: false });
    } else {
      // Text
      const nextTag = src.indexOf('<', pos);
      const text = nextTag === -1 ? src.slice(pos) : src.slice(pos, nextTag);
      const trimmed = text.trim();
      if (trimmed) {
        children.push({ type: 'text', value: trimmed });
      }
      pos = nextTag === -1 ? src.length : nextTag;
    }
  }

  return { children, endPos: pos };
}

// ============================================================================
// PROP EXTRACTION
// ============================================================================

/**
 * Extract prop definitions from a COMPONENT_TEMPLATES entry.
 * Parses the template function's parameter defaults.
 *
 * @param {string} componentType - e.g. 'button', 'card'
 * @param {Object} templateDef - The COMPONENT_TEMPLATES[type] object
 * @returns {{ name: string, type: string, default: any }[]}
 */
export function extractProps(componentType, templateDef) {
  if (!templateDef?.template) return [];

  // Get the function source to extract default param names
  const fnSrc = templateDef.template.toString();

  // Match destructured params: { variant = 'primary', size = 'md', ... }
  const paramMatch = fnSrc.match(/\(\s*\{([^}]*)\}/);
  if (!paramMatch) return [];

  const paramStr = paramMatch[1];
  const props = [];

  // Parse each param: name = defaultValue
  const paramRe = /(\w+)\s*=\s*('[^']*'|"[^"]*"|\d+(?:\.\d+)?|true|false|null|\[[^\]]*\]|\{[^}]*\})/g;
  let m;
  while ((m = paramRe.exec(paramStr)) !== null) {
    const name = m[1];
    const rawDefault = m[2];

    // Skip internal props
    if (name.startsWith('_')) continue;

    let defaultVal;
    let propType = 'String';

    try {
      // eslint-disable-next-line no-eval
      defaultVal = JSON.parse(rawDefault.replace(/'/g, '"'));
    } catch {
      defaultVal = rawDefault.replace(/^['"]|['"]$/g, '');
    }

    if (typeof defaultVal === 'boolean') propType = 'Boolean';
    else if (typeof defaultVal === 'number') propType = 'Number';
    else if (defaultVal === null) propType = 'String'; // nullable
    else if (Array.isArray(defaultVal)) propType = 'Array';
    else if (typeof defaultVal === 'object') propType = 'Object';

    props.push({ name, type: propType, default: defaultVal });
  }

  // Also capture params without defaults (just name)
  const bareParamRe = /(\w+)\s*(?:,|\})/g;
  const allNames = new Set(props.map(p => p.name));
  while ((m = bareParamRe.exec(paramStr)) !== null) {
    if (!allNames.has(m[1]) && !m[1].startsWith('_')) {
      // Param without default — check if it's not part of a default value
      const before = paramStr.slice(0, m.index);
      if (!before.endsWith('= ') && !before.endsWith('=')) {
        props.push({ name: m[1], type: 'String', default: undefined });
      }
    }
  }

  return props;
}

// ============================================================================
// COMPONENT NAME UTILITIES
// ============================================================================

/**
 * Convert a component type to PascalCase name.
 * 'button' → 'AioliButton', 'card-product' → 'AioliCardProduct'
 */
export function toPascalCase(type) {
  const base = type
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return `Aioli${base}`;
}

/**
 * Convert a component type to kebab-case filename.
 * 'button' → 'aioli-button', 'cardProduct' → 'aioli-card-product'
 */
export function toKebabCase(type) {
  return `aioli-${type.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
}

// ============================================================================
// AST → HTML STRING (for re-serialization)
// ============================================================================

/**
 * Serialize an AST node back to an HTML string.
 * Used internally to reconstruct modified HTML.
 */
export function serializeNode(node, indent = 0) {
  const pad = '  '.repeat(indent);

  if (node.type === 'text') return `${pad}${node.value}`;
  if (node.type === 'comment') return `${pad}<!-- ${node.value} -->`;

  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => (v === true ? k : `${k}="${v}"`))
    .join(' ');

  const open = attrs ? `<${node.tag} ${attrs}>` : `<${node.tag}>`;

  if (node.selfClosing) return `${pad}${attrs ? `<${node.tag} ${attrs} />` : `<${node.tag} />`}`;

  if (node.children.length === 0) {
    return `${pad}${open}</${node.tag}>`;
  }

  if (node.children.length === 1 && node.children[0].type === 'text') {
    return `${pad}${open}${node.children[0].value}</${node.tag}>`;
  }

  const childStr = node.children.map(c => serializeNode(c, indent + 1)).join('\n');
  return `${pad}${open}\n${childStr}\n${pad}</${node.tag}>`;
}
