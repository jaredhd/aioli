/**
 * @aioli/sdk — Direct Client Backend
 *
 * Wraps createAgentSystem() for local Node.js usage without a server.
 * Same agent calls as api-server/index.js, minus HTTP.
 */

export async function createDirectClient(options = {}) {
  // Import Aioli — try peer dependency first, then monorepo fallback
  let createAgentSystem, listPresets, getPresetOverrides, derivePalette, createTheme;

  try {
    const aioli = await import('aioli-design');
    createAgentSystem = aioli.createAgentSystem;
    listPresets = aioli.listPresets;
    getPresetOverrides = aioli.getPresetOverrides;
    derivePalette = aioli.derivePalette;
    createTheme = aioli.createTheme;
  } catch (_) {
    try {
      // Monorepo fallback — resolve relative to sdk/
      const agents = await import('../agents/index.js');
      const presets = await import('../lib/theme-presets.js');
      const theme = await import('../lib/theme.js');
      createAgentSystem = agents.createAgentSystem;
      listPresets = presets.listPresets;
      getPresetOverrides = presets.getPresetOverrides;
      derivePalette = presets.derivePalette;
      createTheme = theme.createTheme;
    } catch (e2) {
      throw new Error(
        '@aioli/sdk direct mode requires aioli-design to be installed or ' +
        'the SDK to be located within the Aioli monorepo.\n' +
        'Run: npm install aioli-design\n' + e2.message
      );
    }
  }

  const tokensPath = options.tokensPath;
  if (!tokensPath) {
    throw new Error('Direct mode requires tokensPath option, e.g. createAioli({ mode: "direct", tokensPath: "./tokens" })');
  }

  const agents = createAgentSystem(tokensPath);

  const VALID_THEMES = ['default', 'glass', 'neumorphic', 'brutalist', 'gradient', 'darkLuxury'];

  return {
    async generateComponent(description) {
      if (!description) throw new Error('description is required');
      const result = agents.component.handleRequest({
        action: 'generateFromDescription',
        description,
      });
      if (!result.success) throw new Error(result.error || 'Generation failed');
      return {
        type: result.data.type,
        category: result.data.category,
        html: result.data.html,
        tokens: result.data.tokens,
        a11y: result.data.a11y,
      };
    },

    async generatePage(description) {
      if (!description) throw new Error('description is required');
      const result = agents.component.handleRequest({
        action: 'generatePageComposition',
        description,
      });
      if (!result.success) throw new Error(result.error || 'Page generation failed');
      return {
        type: result.data.type,
        pageType: result.data.pageType,
        html: result.data.html,
        sectionCount: result.data.sectionCount,
        sections: result.data.sections?.map(s => s.type),
        tokens: result.data.tokens,
        a11y: result.data.a11y,
      };
    },

    async listComponents() {
      const result = agents.component.handleRequest({ action: 'listComponents' });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },

    async listModifiers() {
      const modifiers = agents.component.handleRequest({ action: 'listStyleModifiers' });
      const compositions = agents.component.handleRequest({ action: 'listPageCompositions' });
      return {
        styleModifiers: modifiers.success ? modifiers.data : [],
        pageCompositions: compositions.success ? compositions.data : [],
      };
    },

    async listThemes() {
      return listPresets();
    },

    async getThemeCSS(name, customOverrides) {
      if (!VALID_THEMES.includes(name)) {
        throw new Error(`Unknown theme: ${name}. Available: ${VALID_THEMES.join(', ')}`);
      }
      const overrides = getPresetOverrides(name, customOverrides || {});
      const themeObj = createTheme(overrides);
      return {
        theme: name,
        css: themeObj.toCSS(),
        overrideCount: Object.keys(overrides).length,
      };
    },

    async derivePalette(color) {
      if (!color) throw new Error('color is required');
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        throw new Error('color must be a 6-digit hex string, e.g. "#2563eb"');
      }
      const palette = derivePalette(color);
      const themeObj = createTheme(palette);
      return {
        sourceColor: color,
        tokenOverrides: palette,
        css: themeObj.toCSS(),
        tokenCount: Object.keys(palette).length,
      };
    },

    async getTokens(opts = {}) {
      const { path, prefix, format } = opts;

      if (path) {
        const result = agents.token.handleRequest({ action: 'get', path });
        if (!result.success) throw new Error(result.error || `Token not found: ${path}`);
        return result.data;
      }
      if (prefix) {
        const result = agents.token.handleRequest({ action: 'list', prefix });
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      if (format === 'css') {
        const result = agents.token.handleRequest({ action: 'css' });
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      if (format === 'json') {
        const result = agents.token.handleRequest({ action: 'json' });
        if (!result.success) throw new Error(result.error);
        return result.data;
      }

      const count = agents.token.countTokens();
      const paths = agents.token.getAllTokenPaths();
      const prefixes = [...new Set(paths.map(p => p.split('.').slice(0, 2).join('.')))].sort();
      return {
        totalTokens: count,
        topLevelCategories: prefixes,
        hint: 'Use "path" for a single token, "prefix" to filter, or "format" to export all.',
      };
    },

    async resolveToken(reference) {
      if (!reference) throw new Error('reference is required');
      const ref = reference.startsWith('{') ? reference : `{${reference}}`;
      const result = agents.token.handleRequest({ action: 'resolve', reference: ref });
      if (!result.success) throw new Error(result.error || `Could not resolve: ${reference}`);
      return result.data;
    },

    async checkContrast(foreground, background, level) {
      if (!foreground || !background) throw new Error('foreground and background are required');
      const result = agents.a11y.handleRequest({
        action: 'checkContrast',
        foreground,
        background,
        options: { level: level || 'AA' },
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },

    async validateAccessibility(html, css, componentName) {
      if (!html) throw new Error('html is required');
      if (css) {
        const result = agents.a11y.handleRequest({
          action: 'validateComponent',
          component: { name: componentName || 'Component', html, css },
        });
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      const result = agents.a11y.handleRequest({
        action: 'validateHTML',
        code: html,
        componentName: componentName || 'Component',
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },

    async reviewCode(html, css) {
      if (!html) throw new Error('html is required');
      const result = agents.codeReview.handleRequest({
        action: 'review',
        code: { html, css: css || '' },
      });
      if (!result.success) throw new Error(result.error);
      const data = result.result || result.data;
      return {
        approved: data.approved,
        score: data.score,
        grade: data.grade,
        summary: data.summary,
        issueCount: data.issues?.length || 0,
        issues: data.issues,
        suggestions: data.suggestions,
      };
    },
  };
}
