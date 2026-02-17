/**
 * Aioli Framework Adapters — Entry Point
 *
 * Routes generation results to the appropriate framework adapter.
 * Supports: html (default/passthrough), react, vue, svelte.
 */

import { toReact } from './react.js';
import { toVue } from './vue.js';
import { toSvelte } from './svelte.js';

export { toReact } from './react.js';
export { toVue } from './vue.js';
export { toSvelte } from './svelte.js';
export { parseHTML, extractProps, toPascalCase, toKebabCase } from './html-parser.js';

/**
 * Supported output formats.
 */
export const SUPPORTED_FORMATS = ['html', 'react', 'vue', 'svelte'];

/**
 * Adapt a single component generation result to a specific framework format.
 *
 * @param {Object} result - Component generation result (must have .type and .html)
 * @param {string} format - Target format: 'html' | 'react' | 'vue' | 'svelte'
 * @param {Object} options - Adapter options (componentName, cssImport, etc.)
 * @returns {Object} Original result with added framework fields (code, componentName, language, framework, cssImport)
 */
export function adaptComponent(result, format = 'html', options = {}) {
  if (!format || format === 'html') {
    return result; // Passthrough — backward compatible
  }

  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(
      `Unknown format: "${format}". Supported: ${SUPPORTED_FORMATS.join(', ')}`
    );
  }

  if (!result || !result.html) {
    throw new Error('Cannot adapt: generation result must include html');
  }

  let adapted;
  switch (format) {
    case 'react':
      adapted = toReact(result, options);
      break;
    case 'vue':
      adapted = toVue(result, options);
      break;
    case 'svelte':
      adapted = toSvelte(result, options);
      break;
    default:
      return result;
  }

  // Merge adapted fields onto the original result
  return {
    ...result,
    ...adapted,
  };
}

/**
 * Adapt a page composition result to a specific framework format.
 * Adapts each section individually and wraps them in a page component.
 *
 * @param {Object} pageResult - Page composition result (must have .sections and .html)
 * @param {string} format - Target format
 * @param {Object} options - Adapter options
 * @returns {Object} Page result with added framework code
 */
export function adaptPage(pageResult, format = 'html', options = {}) {
  if (!format || format === 'html') {
    return pageResult;
  }

  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(
      `Unknown format: "${format}". Supported: ${SUPPORTED_FORMATS.join(', ')}`
    );
  }

  if (!pageResult || !pageResult.html) {
    throw new Error('Cannot adapt: page result must include html');
  }

  // Adapt the full page HTML as a single component
  const pageAsComponent = {
    type: pageResult.pageType || 'page',
    html: pageResult.html,
    category: 'template',
  };

  let adapted;
  switch (format) {
    case 'react':
      adapted = toReact(pageAsComponent, {
        ...options,
        componentName: options.componentName || 'AioliPage',
      });
      break;
    case 'vue':
      adapted = toVue(pageAsComponent, {
        ...options,
        componentName: options.componentName || 'AioliPage',
      });
      break;
    case 'svelte':
      adapted = toSvelte(pageAsComponent, {
        ...options,
        componentName: options.componentName || 'AioliPage',
      });
      break;
    default:
      return pageResult;
  }

  // Also adapt each section if available
  let adaptedSections;
  if (pageResult.sections && Array.isArray(pageResult.sections)) {
    adaptedSections = pageResult.sections.map(section => {
      if (!section.html) return section;
      return adaptComponent(section, format, options);
    });
  }

  return {
    ...pageResult,
    ...adapted,
    sections: adaptedSections || pageResult.sections,
  };
}
