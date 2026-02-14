/**
 * 🎨 Design Token Agent
 * Core agent for the Aioli Design System
 * 
 * Responsibilities:
 * - Read tokens (single, by path, by category)
 * - Write tokens (add, update, delete)
 * - Resolve aliases (follow {references})
 * - Validate token structure
 * - Generate CSS/Tailwind output
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

// ============================================================================
// TYPES
// ============================================================================

/**
 * @typedef {Object} Token
 * @property {string} $value - The token value (can be a reference like "{primitive.color.blue.500}")
 * @property {string} [$type] - DTCG type (color, dimension, etc.)
 * @property {string} [$description] - Human-readable description
 */

/**
 * @typedef {Object} ResolvedToken
 * @property {string} path - Full dot-notation path (e.g., "primitive.color.blue.500")
 * @property {string} rawValue - The $value as written (may include references)
 * @property {string} resolvedValue - Final resolved value (references replaced)
 * @property {string} [type] - DTCG type
 * @property {string} [description] - Description
 * @property {string[]} referenceChain - Path of references followed
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {Array<{path: string, error: string, severity: 'error'|'warning'}>} issues
 */

// ============================================================================
// VALID DTCG TYPES
// ============================================================================

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

// ============================================================================
// DESIGN TOKEN AGENT CLASS
// ============================================================================

export class DesignTokenAgent {
  constructor(tokensDir) {
    this.tokensDir = tokensDir;
    this.cache = new Map();
    this.allTokens = null;
    this.loadAllTokens();
  }

  // ==========================================================================
  // LOADING
  // ==========================================================================

  /**
   * Load all token files into memory
   */
  loadAllTokens() {
    this.allTokens = {};
    this.cache.clear();
    this.walkDirectory(this.tokensDir, this.allTokens);
    console.log(`🎨 Design Token Agent: Loaded ${this.countTokens()} tokens`);
  }

  walkDirectory(dir, target) {
    if (!existsSync(dir)) return;

    let files;
    try {
      files = readdirSync(dir);
    } catch (e) {
      console.error(`Cannot read directory ${dir}: ${e.message}`);
      return;
    }

    for (const file of files) {
      const filePath = join(dir, file);
      try {
        const stat = statSync(filePath);
        if (stat.isDirectory()) {
          this.walkDirectory(filePath, target);
        } else if (file.endsWith('.json')) {
          try {
            const content = JSON.parse(readFileSync(filePath, 'utf8'));
            this.mergeDeep(target, content);
          } catch (e) {
            console.error(`Error loading ${filePath}: ${e.message}`);
          }
        }
      } catch (e) {
        console.error(`Cannot stat ${filePath}: ${e.message}`);
      }
    }
  }

  mergeDeep(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  countTokens() {
    let count = 0;
    const walk = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) continue;
        if (value && typeof value === 'object') {
          if (value.$value !== undefined) count++;
          walk(value);
        }
      }
    };
    walk(this.allTokens);
    return count;
  }

  // ==========================================================================
  // READ OPERATIONS
  // ==========================================================================

  /**
   * Get a token by its dot-notation path
   * @param {string} path - e.g., "primitive.color.blue.500"
   * @param {Object} options
   * @param {boolean} [options.resolve=true] - Whether to resolve references
   * @returns {ResolvedToken|null}
   */
  getToken(path, { resolve = true } = {}) {
    // Check cache first
    const cacheKey = `${path}:${resolve}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const parts = path.split('.');
    let current = this.allTokens;

    for (const part of parts) {
      if (!current || typeof current !== 'object') return null;
      current = current[part];
    }

    if (!current || current.$value === undefined) return null;

    const result = {
      path,
      rawValue: current.$value,
      resolvedValue: resolve ? this.resolveValue(current.$value) : current.$value,
      type: current.$type,
      description: current.$description,
      referenceChain: resolve ? this.getReferenceChain(current.$value) : []
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get all tokens matching a path prefix
   * @param {string} prefix - e.g., "primitive.color" or "component.button"
   * @returns {ResolvedToken[]}
   */
  getTokensByPrefix(prefix) {
    const results = [];
    const parts = prefix.split('.');
    let current = this.allTokens;

    for (const part of parts) {
      if (!current || typeof current !== 'object') return [];
      current = current[part];
    }

    if (!current) return [];

    const walk = (obj, pathParts) => {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) continue;
        const newPath = [...pathParts, key];
        
        if (value && typeof value === 'object') {
          if (value.$value !== undefined) {
            results.push(this.getToken(newPath.join('.')));
          }
          walk(value, newPath);
        }
      }
    };

    walk(current, parts);
    return results.filter(Boolean);
  }

  /**
   * Get all tokens of a specific type
   * @param {string} type - DTCG type (color, dimension, etc.)
   * @returns {ResolvedToken[]}
   */
  getTokensByType(type) {
    const results = [];
    
    const walk = (obj, pathParts) => {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) continue;
        const newPath = [...pathParts, key];
        
        if (value && typeof value === 'object') {
          // Check inherited type or explicit type
          const tokenType = value.$type || this.findInheritedType(obj);
          if (value.$value !== undefined && tokenType === type) {
            results.push(this.getToken(newPath.join('.')));
          }
          walk(value, newPath);
        }
      }
    };

    walk(this.allTokens, []);
    return results.filter(Boolean);
  }

  findInheritedType(obj) {
    if (obj.$type) return obj.$type;
    return null;
  }

  // ==========================================================================
  // REFERENCE RESOLUTION
  // ==========================================================================

  /**
   * Resolve a value, following any references
   * @param {string} value - Raw value (may contain {references})
   * @param {Set} [visited] - Tracks visited paths to detect circular refs
   * @returns {string}
   */
  resolveValue(value, visited = new Set()) {
    if (typeof value !== 'string') return value;
    
    // Check for reference pattern {path.to.token}
    const refMatch = value.match(/^\{([^}]+)\}$/);
    if (!refMatch) return value;

    const refPath = refMatch[1];
    
    // Circular reference check
    if (visited.has(refPath)) {
      console.warn(`⚠️ Circular reference detected: ${refPath}`);
      return value;
    }
    visited.add(refPath);

    const referencedToken = this.getToken(refPath, { resolve: false });
    if (!referencedToken) {
      console.warn(`⚠️ Unresolved reference: ${refPath}`);
      return value;
    }

    return this.resolveValue(referencedToken.rawValue, visited);
  }

  /**
   * Get the chain of references followed to resolve a value
   * @param {string} value
   * @returns {string[]}
   */
  getReferenceChain(value, chain = []) {
    if (typeof value !== 'string') return chain;
    
    const refMatch = value.match(/^\{([^}]+)\}$/);
    if (!refMatch) return chain;

    const refPath = refMatch[1];
    chain.push(refPath);

    // Prevent infinite loop
    if (chain.filter(p => p === refPath).length > 1) return chain;

    const referencedToken = this.getToken(refPath, { resolve: false });
    if (!referencedToken) return chain;

    return this.getReferenceChain(referencedToken.rawValue, chain);
  }

  // ==========================================================================
  // WRITE OPERATIONS
  // ==========================================================================

  /**
   * Set a token value
   * @param {string} path - Dot notation path
   * @param {string} value - New value
   * @param {Object} [options]
   * @param {string} [options.type] - DTCG type
   * @param {string} [options.description] - Description
   * @returns {boolean} Success
   */
  setToken(path, value, { type, description } = {}) {
    if (!path || value === undefined) {
      console.error('setToken requires a path and value');
      return false;
    }

    // Determine which file this belongs to
    const parts = path.split('.');
    if (parts.length < 2) {
      console.error(`Invalid token path: ${path}`);
      return false;
    }

    const tier = parts[0];
    const category = parts[1];

    const filePath = this.getFilePathForToken(tier, category);
    if (!filePath) {
      console.error(`Cannot determine file path for token: ${path}`);
      return false;
    }

    try {
      // Load the specific file
      let fileContent = {};
      if (existsSync(filePath)) {
        fileContent = JSON.parse(readFileSync(filePath, 'utf8'));
      }

      // Navigate/create the path
      let current = fileContent;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) current[part] = {};
        current = current[part];
      }

      // Set the value
      const lastPart = parts[parts.length - 1];
      current[lastPart] = { $value: value };
      if (type) current[lastPart].$type = type;
      if (description) current[lastPart].$description = description;

      // Write back
      writeFileSync(filePath, JSON.stringify(fileContent, null, 2) + '\n');

      // Clear cache and reload
      this.loadAllTokens();

      console.log(`✅ Token set: ${path} = ${value}`);
      return true;
    } catch (err) {
      console.error(`Failed to set token ${path}: ${err.message}`);
      return false;
    }
  }

  /**
   * Delete a token
   * @param {string} path
   * @returns {boolean}
   */
  deleteToken(path) {
    if (!path) return false;

    const parts = path.split('.');
    if (parts.length < 2) return false;

    const tier = parts[0];
    const category = parts[1];
    const filePath = this.getFilePathForToken(tier, category);

    if (!filePath || !existsSync(filePath)) return false;

    try {
      const fileContent = JSON.parse(readFileSync(filePath, 'utf8'));
      let current = fileContent;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) return false;
        current = current[parts[i]];
      }

      const lastPart = parts[parts.length - 1];
      if (!current[lastPart]) return false;

      delete current[lastPart];
      writeFileSync(filePath, JSON.stringify(fileContent, null, 2) + '\n');
      this.loadAllTokens();

      console.log(`🗑️ Token deleted: ${path}`);
      return true;
    } catch (err) {
      console.error(`Failed to delete token ${path}: ${err.message}`);
      return false;
    }
  }

  getFilePathForToken(tier, category) {
    const tierMap = {
      primitive: 'primitives',
      semantic: 'semantic',
      component: 'components'
    };

    const dir = tierMap[tier];
    if (!dir) return null;

    // Map category to file
    const categoryFileMap = {
      // Primitives
      color: 'colors.json',
      spacing: 'spacing.json',
      font: 'typography.json',
      radius: 'radius.json',
      motion: 'motion.json',
      border: 'borders.json',
      // Semantic
      surface: 'surfaces.json',
      text: 'surfaces.json',
      typography: 'typography.json',
      elevation: 'elevation.json',
      zIndex: 'z-index.json',
      focus: 'focus.json',
      opacity: 'opacity.json',
      // Components - use category name directly
    };

    const fileName = categoryFileMap[category] || `${category}.json`;
    return join(this.tokensDir, dir, fileName);
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /**
   * Validate all tokens
   * @returns {ValidationResult}
   */
  validate() {
    const issues = [];

    const walk = (obj, pathParts) => {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) continue;
        const currentPath = [...pathParts, key].join('.');

        if (value && typeof value === 'object') {
          // Check if this is a token (has $value)
          if (value.$value !== undefined) {
            // Validate type
            if (value.$type && !VALID_TYPES.includes(value.$type)) {
              issues.push({
                path: currentPath,
                error: `Unknown type: ${value.$type}`,
                severity: 'warning'
              });
            }

            // Validate references
            if (typeof value.$value === 'string' && value.$value.includes('{')) {
              const refMatch = value.$value.match(/^\{([^}]+)\}$/);
              if (refMatch) {
                const refPath = refMatch[1];
                const referenced = this.getToken(refPath, { resolve: false });
                if (!referenced) {
                  issues.push({
                    path: currentPath,
                    error: `Broken reference: ${refPath}`,
                    severity: 'error'
                  });
                }
              }
            }
          }
          
          walk(value, [...pathParts, key]);
        }
      }
    };

    walk(this.allTokens, []);

    // Check for circular references
    const allPaths = this.getAllTokenPaths();
    for (const path of allPaths) {
      const chain = this.getReferenceChain(this.getToken(path, { resolve: false })?.rawValue || '');
      const uniqueChain = new Set(chain);
      if (chain.length !== uniqueChain.size) {
        issues.push({
          path,
          error: `Circular reference detected in chain: ${chain.join(' → ')}`,
          severity: 'error'
        });
      }
    }

    return {
      valid: !issues.some(i => i.severity === 'error'),
      issues
    };
  }

  getAllTokenPaths() {
    const paths = [];
    const walk = (obj, pathParts) => {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) continue;
        const newPath = [...pathParts, key];
        if (value && typeof value === 'object') {
          if (value.$value !== undefined) {
            paths.push(newPath.join('.'));
          }
          walk(value, newPath);
        }
      }
    };
    walk(this.allTokens, []);
    return paths;
  }

  // ==========================================================================
  // OUTPUT GENERATION
  // ==========================================================================

  /**
   * Generate CSS custom properties from all tokens
   * @returns {string}
   */
  toCSS() {
    const lines = [':root {'];
    const tokens = this.getAllTokenPaths().map(p => this.getToken(p));

    for (const token of tokens) {
      if (!token) continue;
      const cssVar = `--${token.path.replace(/\./g, '-')}`;
      lines.push(`  ${cssVar}: ${token.resolvedValue};`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Generate a flat JSON object of all resolved tokens
   * @returns {Object}
   */
  toFlatJSON() {
    const result = {};
    const tokens = this.getAllTokenPaths().map(p => this.getToken(p));

    for (const token of tokens) {
      if (!token) continue;
      result[token.path] = {
        value: token.resolvedValue,
        type: token.type,
        description: token.description
      };
    }

    return result;
  }

  // ==========================================================================
  // FIX APPLICATION (receives fixes from Orchestrator)
  // ==========================================================================

  /**
   * Apply a fix request from the Orchestrator
   * @param {Object} fix - Fix request object
   * @returns {Object} Result with success status and changes made
   */
  applyFix(fix) {
    if (!fix || !fix.fix) {
      return { success: false, error: 'Invalid fix request' };
    }

    const { action, tokenPath, newValue } = fix.fix;
    const issue = fix.issue || {};

    try {
      switch (action) {
        case 'updateToken': {
          // Get current value for logging
          const current = this.getToken(tokenPath);
          const oldValue = current?.resolvedValue;

          // Apply the fix
          const success = this.setToken(tokenPath, newValue, {
            description: `Auto-fixed: ${fix.description || 'Accessibility improvement'}`
          });

          if (success) {
            console.log(`🔧 Token fixed: ${tokenPath}`);
            console.log(`   Old: ${oldValue}`);
            console.log(`   New: ${newValue}`);
            
            return {
              success: true,
              changes: {
                tokenPath,
                oldValue,
                newValue,
                reason: issue.context || fix.description
              },
              needsValidation: true
            };
          } else {
            return { success: false, error: 'Failed to update token' };
          }
        }

        case 'createToken': {
          const success = this.setToken(tokenPath, newValue, {
            type: fix.fix.type,
            description: fix.description
          });
          
          return {
            success,
            changes: success ? { tokenPath, newValue, action: 'created' } : null,
            error: success ? null : 'Failed to create token',
            needsValidation: true
          };
        }

        case 'deleteToken': {
          const success = this.deleteToken(tokenPath);
          return {
            success,
            changes: success ? { tokenPath, action: 'deleted' } : null,
            error: success ? null : 'Failed to delete token',
            needsValidation: true
          };
        }

        default:
          return { success: false, error: `Unknown fix action: ${action}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ==========================================================================
  // AGENT INTERFACE (for other agents to call)
  // ==========================================================================

  /**
   * Handle a request from another agent
   * @param {Object} request
   * @param {string} request.action - get, set, delete, validate, resolve, list
   * @param {string} [request.path] - Token path
   * @param {string} [request.value] - Value for set operations
   * @param {string} [request.prefix] - Prefix for list operations
   * @param {string} [request.type] - Type for filtering
   * @returns {Object} Response
   */
  handleRequest(request) {
    if (!request || !request.action) {
      return { success: false, error: 'Request must include an action' };
    }

    const { action, path, value, prefix, type, reference } = request;

    try {
      switch (action) {
        case 'get':
        case 'getToken':
          if (!path) return { success: false, error: 'Missing required parameter: path' };
          return { success: true, data: this.getToken(path) };

        case 'set':
        case 'setToken':
          if (!path) return { success: false, error: 'Missing required parameter: path' };
          return { success: this.setToken(path, value, { type: request.tokenType }) };

        case 'delete':
        case 'deleteToken':
          if (!path) return { success: false, error: 'Missing required parameter: path' };
          return { success: this.deleteToken(path) };

        case 'validate':
          return { success: true, data: this.validate() };

        case 'resolve':
          return { success: true, data: this.resolveValue(reference || value) };

        case 'list':
          if (prefix) {
            return { success: true, data: this.getTokensByPrefix(prefix) };
          } else if (type) {
            return { success: true, data: this.getTokensByType(type) };
          } else {
            return { success: true, data: this.getAllTokenPaths() };
          }

        case 'css':
          return { success: true, data: this.toCSS() };

        case 'json':
          return { success: true, data: this.toFlatJSON() };

        case 'applyFix':
          return this.applyFix(request.fix);

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

export function createDesignTokenAgent(tokensDir) {
  return new DesignTokenAgent(tokensDir);
}

export default DesignTokenAgent;
