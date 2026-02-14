/**
 * 🧄 Aioli Studio - Agent API Service
 * 
 * Backend service that exposes agent functionality via HTTP endpoints.
 * This bridges the Studio UI with the agent system.
 */

import express from 'express';
import cors from 'cors';
import { createAgentSystem } from '../../agents/index.js';
import { createAIComponentGenerator } from '../../agents/ai-component-generator.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = join(__dirname, '../../tokens');

// Initialize agent system
const agents = createAgentSystem(TOKENS_DIR);

// Create AI-powered component generator with validation capabilities
const aiComponentGenerator = createAIComponentGenerator({
  tokenAgent: agents.token,
  motionAgent: agents.motion,
  a11yAgent: agents.a11y,  // Pass a11y agent for validation loop
  apiKey: process.env.ANTHROPIC_API_KEY || null,
  useAI: true,
});

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================================
// DESIGN TOKEN ENDPOINTS
// ============================================================================

/**
 * GET /api/tokens
 * Get all tokens or tokens by prefix
 */
app.get('/api/tokens', (req, res) => {
  try {
    const { prefix, type } = req.query;
    
    if (type) {
      const tokens = agents.token.getTokensByType(type);
      return res.json({ success: true, tokens });
    }
    
    if (prefix) {
      const tokens = agents.token.getTokensByPrefix(prefix);
      return res.json({ success: true, tokens });
    }
    
    // Return all tokens organized by category
    const allTokens = {
      primitive: {
        colors: agents.token.getTokensByPrefix('primitive.color'),
        spacing: agents.token.getTokensByPrefix('primitive.spacing'),
        typography: agents.token.getTokensByPrefix('primitive.font'),
        motion: agents.token.getTokensByPrefix('primitive.motion'),
        radius: agents.token.getTokensByPrefix('primitive.radius'),
      },
      semantic: {
        colors: agents.token.getTokensByPrefix('semantic.color'),
        text: agents.token.getTokensByPrefix('semantic.text'),
        surface: agents.token.getTokensByPrefix('semantic.surface'),
      },
      component: {
        button: agents.token.getTokensByPrefix('component.button'),
        input: agents.token.getTokensByPrefix('component.input'),
        card: agents.token.getTokensByPrefix('component.card'),
      },
    };
    
    res.json({ success: true, tokens: allTokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tokens/get?path=...
 * Get a single token by path (using query param for nested paths)
 */
app.get('/api/tokens/get', (req, res) => {
  try {
    const { path } = req.query;
    if (!path) {
      return res.status(400).json({ success: false, error: 'Path query parameter required' });
    }
    const token = agents.token.getToken(path);
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/tokens/set
 * Update a token value (path in body)
 */
app.put('/api/tokens/set', (req, res) => {
  try {
    const { path, value, type, description } = req.body;
    if (!path) {
      return res.status(400).json({ success: false, error: 'Path required in body' });
    }
    const success = agents.token.setToken(path, value, { type, description });
    
    if (!success) {
      return res.status(400).json({ success: false, error: 'Failed to update token' });
    }
    
    const updated = agents.token.getToken(path);
    res.json({ success: true, token: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tokens/validate
 * Validate all tokens
 */
app.post('/api/tokens/validate', (req, res) => {
  try {
    const result = agents.token.validate();
    res.json({ success: true, validation: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tokens/export/css
 * Export tokens as CSS custom properties
 */
app.get('/api/tokens/export/css', (req, res) => {
  try {
    const css = agents.token.toCSS();
    res.json({ success: true, css });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// COMPONENT GENERATOR ENDPOINTS
// ============================================================================

/**
 * POST /api/components/generate
 * Generate a component using AI or templates
 */
app.post('/api/components/generate', async (req, res) => {
  try {
    const { description, type, props, apiKey } = req.body;
    
    // If API key provided in request, use it temporarily
    if (apiKey) {
      aiComponentGenerator.setApiKey(apiKey);
    }
    
    let result;
    if (description) {
      // Use AI-powered generation
      result = await aiComponentGenerator.generate(description);
    } else if (type) {
      // Use template-based generation
      result = aiComponentGenerator.generateFromTemplate(type);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Provide either description or type' 
      });
    }
    
    res.json({ success: true, component: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/components/fix
 * Fix accessibility issues in a generated component
 */
app.post('/api/components/fix', async (req, res) => {
  try {
    const { html, issues, apiKey } = req.body;
    
    if (!html) {
      return res.status(400).json({ success: false, error: 'HTML required' });
    }
    
    if (!issues || issues.length === 0) {
      return res.json({ success: true, component: { html, note: 'No issues to fix' } });
    }

    // Set API key if provided
    if (apiKey) {
      aiComponentGenerator.setApiKey(apiKey);
    }

    const result = await aiComponentGenerator.fixComponent(html, issues);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({ success: true, component: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/components/set-api-key
 * Set the Anthropic API key for AI generation
 */
app.post('/api/components/set-api-key', (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API key required' });
    }
    aiComponentGenerator.setApiKey(apiKey);
    res.json({ success: true, message: 'API key set successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/components/capabilities
 * Check AI generation capabilities
 */
app.get('/api/components/capabilities', (req, res) => {
  try {
    const capabilities = aiComponentGenerator.getCapabilities();
    res.json({ success: true, capabilities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/components/templates
 * List available component templates
 */
app.get('/api/components/templates', (req, res) => {
  try {
    const templates = agents.component.listComponents();
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ACCESSIBILITY VALIDATOR ENDPOINTS
// ============================================================================

/**
 * POST /api/a11y/check-contrast
 * Check color contrast ratio
 */
app.post('/api/a11y/check-contrast', (req, res) => {
  try {
    const { foreground, background, textType, level } = req.body;
    const result = agents.a11y.checkContrast(foreground, background, { textType, level });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/a11y/validate-html
 * Validate HTML for accessibility issues
 */
app.post('/api/a11y/validate-html', (req, res) => {
  try {
    const { html } = req.body;
    const result = agents.a11y.validateHTML(html);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/a11y/validate-tokens
 * Validate design token contrast pairs
 */
app.post('/api/a11y/validate-tokens', (req, res) => {
  try {
    agents.a11y.reset();
    const results = agents.a11y.validateTokenContrast();
    res.json({ 
      success: true, 
      results,
      issues: agents.a11y.issues 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/a11y/suggest-fixes
 * Get suggested fixes for accessibility issues
 */
app.post('/api/a11y/suggest-fixes', (req, res) => {
  try {
    const { issues } = req.body;
    const fixes = agents.a11y.suggestFixes(issues || agents.a11y.issues);
    res.json({ success: true, fixes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// MOTION AGENT ENDPOINTS
// ============================================================================

/**
 * POST /api/motion/get-duration
 * Get animation duration for interaction type
 */
app.post('/api/motion/get-duration', (req, res) => {
  try {
    const { type, device } = req.body;
    const result = agents.motion.getDuration(type, { device });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/motion/get-easing
 * Get easing curve for direction
 */
app.post('/api/motion/get-easing', (req, res) => {
  try {
    const { direction } = req.body;
    const result = agents.motion.getEasing({ direction });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/motion/validate
 * Validate animation CSS
 */
app.post('/api/motion/validate', (req, res) => {
  try {
    const { css } = req.body;
    const result = agents.motion.validate(css);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CODE REVIEW ENDPOINTS
// ============================================================================

/**
 * POST /api/review
 * Comprehensive code review
 */
app.post('/api/review', (req, res) => {
  try {
    const { code, html, css } = req.body;
    const result = agents.codeReview.review({ code, html, css });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/review/quick
 * Quick validation check
 */
app.post('/api/review/quick', (req, res) => {
  try {
    const { code, html, css } = req.body;
    const result = agents.codeReview.quickCheck({ code, html, css });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ORCHESTRATOR ENDPOINTS
// ============================================================================

/**
 * POST /api/orchestrator/request
 * Handle any request through orchestrator
 */
app.post('/api/orchestrator/request', (req, res) => {
  try {
    const { type, agent, data } = req.body;
    const result = agents.orchestrator.handleRequest({ type, agent, data });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/orchestrator/fix-cycle
 * Run full detect → fix → validate cycle
 */
app.post('/api/orchestrator/fix-cycle', async (req, res) => {
  try {
    const { code, html, css } = req.body;
    const result = await agents.orchestrator.runFixCycle({ code, html, css });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    agents: {
      token: !!agents.token,
      a11y: !!agents.a11y,
      motion: !!agents.motion,
      component: !!agents.component,
      codeReview: !!agents.codeReview,
      orchestrator: !!agents.orchestrator,
    },
    tokenCount: agents.token.countTokens(),
  });
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
🧄 Aioli Studio API Server
==========================
Port: ${PORT}
Tokens: ${agents.token.countTokens()} loaded
Agents: 6 active

Endpoints:
  GET  /api/health
  
  Tokens:
  GET  /api/tokens
  GET  /api/tokens/:path
  PUT  /api/tokens/:path
  POST /api/tokens/validate
  GET  /api/tokens/export/css
  
  Components:
  POST /api/components/generate
  GET  /api/components/templates
  
  Accessibility:
  POST /api/a11y/check-contrast
  POST /api/a11y/validate-html
  POST /api/a11y/validate-tokens
  POST /api/a11y/suggest-fixes
  
  Motion:
  POST /api/motion/get-duration
  POST /api/motion/get-easing
  POST /api/motion/validate
  
  Code Review:
  POST /api/review
  POST /api/review/quick
  
  Orchestrator:
  POST /api/orchestrator/request
  POST /api/orchestrator/fix-cycle
`);
});

export default app;
