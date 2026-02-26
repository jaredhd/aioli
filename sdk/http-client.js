/**
 * @aioli/sdk — HTTP Client Backend
 *
 * Wraps the Aioli REST API with typed methods.
 * Uses native fetch() (Node 18+, all modern browsers).
 * Zero dependencies.
 */

export function createHttpClient(options = {}) {
  const baseUrl = (options.baseUrl || 'http://localhost:3456').replace(/\/$/, '');
  const prefix = `${baseUrl}/api/v1`;

  async function request(method, path, body) {
    const url = `${prefix}${path}`;
    const init = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body && method !== 'GET') {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);
    const json = await res.json();

    if (!json.success) {
      const err = new Error(json.error || `Request failed: ${method} ${path}`);
      err.status = res.status;
      throw err;
    }
    return json.data;
  }

  return {
    generateComponent(description, opts = {}) {
      const body = { description };
      if (opts.format) body.format = opts.format;
      return request('POST', '/generate/component', body);
    },

    generatePage(description, opts = {}) {
      const body = { description };
      if (opts.format) body.format = opts.format;
      return request('POST', '/generate/page', body);
    },

    listComponents() {
      return request('GET', '/components');
    },

    listModifiers() {
      return request('GET', '/modifiers');
    },

    listThemes() {
      return request('GET', '/themes');
    },

    getThemeCSS(name, overrides) {
      let path = `/themes/${encodeURIComponent(name)}/css`;
      if (overrides && Object.keys(overrides).length > 0) {
        path += `?overrides=${encodeURIComponent(JSON.stringify(overrides))}`;
      }
      return request('GET', path);
    },

    derivePalette(color) {
      return request('POST', '/palette', { color });
    },

    getTokens(opts = {}) {
      const params = new URLSearchParams();
      if (opts.path) params.set('path', opts.path);
      if (opts.prefix) params.set('prefix', opts.prefix);
      if (opts.format) params.set('format', opts.format);
      const qs = params.toString();
      return request('GET', `/tokens${qs ? '?' + qs : ''}`);
    },

    resolveToken(reference) {
      return request('POST', '/tokens/resolve', { reference });
    },

    checkContrast(foreground, background, level) {
      return request('POST', '/validate/contrast', { foreground, background, level });
    },

    validateAccessibility(html, css, componentName) {
      return request('POST', '/validate/accessibility', { html, css, componentName });
    },

    reviewCode(html, css) {
      return request('POST', '/validate/code', { html, css });
    },

    deriveBrandTheme(brand, options) {
      return request('POST', '/brand-theme', { brand, options });
    },

    suggestHarmonies(color) {
      const hex = color.replace('#', '');
      return request('GET', `/harmonies/${encodeURIComponent(hex)}`);
    },

    validateTheme(overrides, opts = {}) {
      return request('POST', '/validate/theme', { overrides, audit: opts.audit });
    },

    importTheme(themeFileJSON) {
      return request('POST', '/theme/import', themeFileJSON);
    },

    exportTheme(config) {
      return request('POST', '/theme/export', config);
    },
  };
}
