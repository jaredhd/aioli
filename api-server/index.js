#!/usr/bin/env node
/**
 * Aioli Design System — REST API Server
 *
 * Exposes Aioli's design system intelligence via HTTP.
 * No API keys. No auth wall. Self-hostable.
 *
 * Start: npm run api
 * Default: http://localhost:3456/api/v1/health
 */

import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { createAgentSystem } from '../agents/index.js';
import { listPresets, getPresetOverrides, derivePalette } from '../lib/theme-presets.js';
import { createTheme } from '../lib/theme.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(__dirname, '..', 'tokens');

// Create agent system once at startup — reused across all requests
const agents = createAgentSystem(tokensPath);

// Load community components if registry exists
const projectRoot = resolve(__dirname, '..');
if (existsSync(resolve(projectRoot, '.aioli', 'registry.json'))) {
  agents.loadCommunityComponents(projectRoot).catch(() => {
    // Silently continue — community loading is optional
  });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

function sendError(res, message, statusCode = 400) {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/v1/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    version: '1.0.0',
    tokenCount: agents.token.countTokens(),
    componentCount: agents.component.handleRequest({ action: 'listComponents' }).data.length,
    themeCount: 6,
    endpoints: 13,
  });
});

// ============================================================================
// GENERATION
// ============================================================================

/**
 * POST /api/v1/generate/component
 * Generate an accessible UI component from a natural language description.
 * Body: { description: string, format?: 'html'|'react'|'vue'|'svelte' }
 */
app.post('/api/v1/generate/component', (req, res) => {
  try {
    const { description, format } = req.body;
    if (!description) return sendError(res, 'description is required');

    const result = agents.component.handleRequest({
      action: 'generateFromDescription',
      description,
      format: format || 'html',
    });
    if (!result.success) return sendError(res, result.error || 'Generation failed');

    const responseData = {
      type: result.data.type,
      category: result.data.category,
      html: result.data.html,
      tokens: result.data.tokens,
      a11y: result.data.a11y,
    };

    // Include framework adapter fields when format is not html
    if (format && format !== 'html') {
      responseData.code = result.data.code;
      responseData.framework = result.data.framework;
      responseData.language = result.data.language;
      responseData.componentName = result.data.componentName;
      responseData.cssImport = result.data.cssImport;
    }

    sendSuccess(res, responseData);
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

/**
 * POST /api/v1/generate/page
 * Generate a full multi-section page layout from a description.
 * Body: { description: string, format?: 'html'|'react'|'vue'|'svelte' }
 */
app.post('/api/v1/generate/page', (req, res) => {
  try {
    const { description, format } = req.body;
    if (!description) return sendError(res, 'description is required');

    const result = agents.component.handleRequest({
      action: 'generatePageComposition',
      description,
      format: format || 'html',
    });
    if (!result.success) return sendError(res, result.error || 'Page generation failed');

    const responseData = {
      type: result.data.type,
      pageType: result.data.pageType,
      html: result.data.html,
      sectionCount: result.data.sectionCount,
      sections: result.data.sections?.map(s => (format && format !== 'html') ? ({ type: s.type, code: s.code }) : s.type),
      tokens: result.data.tokens,
      a11y: result.data.a11y,
    };

    // Include framework adapter fields when format is not html
    if (format && format !== 'html') {
      responseData.code = result.data.code;
      responseData.framework = result.data.framework;
      responseData.language = result.data.language;
      responseData.componentName = result.data.componentName;
      responseData.cssImport = result.data.cssImport;
    }

    sendSuccess(res, responseData);
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

// ============================================================================
// DISCOVERY
// ============================================================================

/**
 * GET /api/v1/components
 * List all 55 available component templates.
 */
app.get('/api/v1/components', (_req, res) => {
  try {
    const result = agents.component.handleRequest({ action: 'listComponents' });
    if (!result.success) return sendError(res, result.error, 500);
    sendSuccess(res, result.data);
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

/**
 * GET /api/v1/modifiers
 * List all style modifiers and page composition types.
 */
app.get('/api/v1/modifiers', (_req, res) => {
  try {
    const modifiers = agents.component.handleRequest({ action: 'listStyleModifiers' });
    const compositions = agents.component.handleRequest({ action: 'listPageCompositions' });
    sendSuccess(res, {
      styleModifiers: modifiers.success ? modifiers.data : [],
      pageCompositions: compositions.success ? compositions.data : [],
    });
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

// ============================================================================
// THEMES
// ============================================================================

const VALID_THEMES = ['default', 'glass', 'neumorphic', 'brutalist', 'gradient', 'darkLuxury'];

/**
 * GET /api/v1/themes
 * List all 6 available theme presets.
 */
app.get('/api/v1/themes', (_req, res) => {
  try {
    sendSuccess(res, listPresets());
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

/**
 * GET /api/v1/themes/:name/css
 * Get CSS custom properties for a theme preset.
 * Query: ?overrides={"token.path":"value"} (optional JSON)
 */
app.get('/api/v1/themes/:name/css', (req, res) => {
  try {
    const { name } = req.params;
    if (!VALID_THEMES.includes(name)) {
      return sendError(res, `Unknown theme: ${name}. Available: ${VALID_THEMES.join(', ')}`);
    }

    let customOverrides = {};
    if (req.query.overrides) {
      try {
        customOverrides = JSON.parse(req.query.overrides);
      } catch (_) {
        return sendError(res, 'Invalid JSON in overrides query parameter');
      }
    }

    const overrides = getPresetOverrides(name, customOverrides);
    const themeObj = createTheme(overrides);
    sendSuccess(res, {
      theme: name,
      css: themeObj.toCSS(),
      overrideCount: Object.keys(overrides).length,
    });
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

// ============================================================================
// PALETTE
// ============================================================================

/**
 * POST /api/v1/palette
 * Generate a full accessible color palette from a brand color.
 * Body: { color: "#rrggbb" }
 */
app.post('/api/v1/palette', (req, res) => {
  try {
    const { color } = req.body;
    if (!color) return sendError(res, 'color is required');
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return sendError(res, 'color must be a 6-digit hex string, e.g. "#2563eb"');
    }

    const palette = derivePalette(color);
    const themeObj = createTheme(palette);
    sendSuccess(res, {
      sourceColor: color,
      tokenOverrides: palette,
      css: themeObj.toCSS(),
      tokenCount: Object.keys(palette).length,
    });
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

// ============================================================================
// TOKENS
// ============================================================================

/**
 * GET /api/v1/tokens
 * Query design tokens. Supports path, prefix, and format query params.
 * Query: ?path=semantic.color.primary.default
 *        ?prefix=semantic.color
 *        ?format=json|css
 */
app.get('/api/v1/tokens', (req, res) => {
  try {
    const { path, prefix, format } = req.query;

    // Single token lookup
    if (path) {
      const result = agents.token.handleRequest({ action: 'get', path });
      if (!result.success) return sendError(res, result.error || `Token not found: ${path}`, 404);
      return sendSuccess(res, result.data);
    }

    // Filtered list
    if (prefix) {
      const result = agents.token.handleRequest({ action: 'list', prefix });
      if (!result.success) return sendError(res, result.error, 500);
      return sendSuccess(res, result.data);
    }

    // Full export
    if (format === 'css') {
      const result = agents.token.handleRequest({ action: 'css' });
      if (!result.success) return sendError(res, result.error, 500);
      return sendSuccess(res, result.data);
    }
    if (format === 'json') {
      const result = agents.token.handleRequest({ action: 'json' });
      if (!result.success) return sendError(res, result.error, 500);
      return sendSuccess(res, result.data);
    }

    // Default: summary
    const count = agents.token.countTokens();
    const paths = agents.token.getAllTokenPaths();
    const prefixes = [...new Set(paths.map(p => p.split('.').slice(0, 2).join('.')))].sort();
    sendSuccess(res, {
      totalTokens: count,
      topLevelCategories: prefixes,
      hint: 'Use "path" for a single token, "prefix" to filter, or "format" to export all.',
    });
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

/**
 * POST /api/v1/tokens/resolve
 * Resolve a design token reference to its final computed value.
 * Body: { reference: "semantic.color.primary.default" }
 */
app.post('/api/v1/tokens/resolve', (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return sendError(res, 'reference is required');

    // Normalize: add braces if not present
    const ref = reference.startsWith('{') ? reference : `{${reference}}`;
    const result = agents.token.handleRequest({ action: 'resolve', reference: ref });
    if (!result.success) return sendError(res, result.error || `Could not resolve: ${reference}`);
    sendSuccess(res, result.data);
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * POST /api/v1/validate/contrast
 * Check WCAG contrast ratio between two colors.
 * Body: { foreground: "#hex", background: "#hex", level?: "AA"|"AAA" }
 */
app.post('/api/v1/validate/contrast', (req, res) => {
  try {
    const { foreground, background, level } = req.body;
    if (!foreground || !background) {
      return sendError(res, 'foreground and background are required');
    }

    const result = agents.a11y.handleRequest({
      action: 'checkContrast',
      foreground,
      background,
      options: { level: level || 'AA' },
    });
    if (!result.success) return sendError(res, result.error, 500);
    sendSuccess(res, result.data);
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

/**
 * POST /api/v1/validate/accessibility
 * Run a full WCAG accessibility audit on HTML code.
 * Body: { html: string, css?: string, componentName?: string }
 */
app.post('/api/v1/validate/accessibility', (req, res) => {
  try {
    const { html, css, componentName } = req.body;
    if (!html) return sendError(res, 'html is required');

    if (css) {
      const result = agents.a11y.handleRequest({
        action: 'validateComponent',
        component: { name: componentName || 'Component', html, css },
      });
      if (!result.success) return sendError(res, result.error, 500);
      return sendSuccess(res, result.data);
    }

    const result = agents.a11y.handleRequest({
      action: 'validateHTML',
      code: html,
      componentName: componentName || 'Component',
    });
    if (!result.success) return sendError(res, result.error, 500);
    sendSuccess(res, result.data);
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

/**
 * POST /api/v1/validate/code
 * Get a comprehensive code quality review.
 * Body: { html: string, css?: string }
 */
app.post('/api/v1/validate/code', (req, res) => {
  try {
    const { html, css } = req.body;
    if (!html) return sendError(res, 'html is required');

    const result = agents.codeReview.handleRequest({
      action: 'review',
      code: { html, css: css || '' },
    });
    if (!result.success) return sendError(res, result.error, 500);

    const data = result.result || result.data;
    sendSuccess(res, {
      approved: data.approved,
      score: data.score,
      grade: data.grade,
      summary: data.summary,
      issueCount: data.issues?.length || 0,
      issues: data.issues,
      suggestions: data.suggestions,
    });
  } catch (e) {
    sendError(res, e.message, 500);
  }
});

// ============================================================================
// START SERVER (conditional — allows supertest to import without auto-start)
// ============================================================================

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  const PORT = process.env.AIOLI_PORT || process.env.PORT || 3456;
  app.listen(PORT, () => {
    console.log(`
🧄 Aioli REST API Server
=========================
http://localhost:${PORT}/api/v1/health

Tokens: ${agents.token.countTokens()} | Components: 55 | Themes: 6

Endpoints:
  GET  /api/v1/health
  POST /api/v1/generate/component
  POST /api/v1/generate/page
  GET  /api/v1/components
  GET  /api/v1/modifiers
  GET  /api/v1/themes
  GET  /api/v1/themes/:name/css
  POST /api/v1/palette
  GET  /api/v1/tokens
  POST /api/v1/tokens/resolve
  POST /api/v1/validate/contrast
  POST /api/v1/validate/accessibility
  POST /api/v1/validate/code
`);
  });
}

export default app;
