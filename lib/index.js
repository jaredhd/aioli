/**
 * Aioli Design System - Public API
 *
 * The primary entry point for programmatic usage of the Aioli engine.
 * Import agents, utilities, and constants for building accessible,
 * token-driven websites and applications.
 */

// Agent system factory — creates and connects all agents
export { createAgentSystem } from '../agents/index.js';

// Individual agent factories
export { DesignTokenAgent, createDesignTokenAgent } from '../agents/design-token-agent.js';
export {
  AccessibilityValidatorAgent,
  createAccessibilityValidator,
  getContrastRatio,
  parseColor,
  WCAG_CONTRAST_RATIOS,
} from '../agents/accessibility-validator-agent.js';
export {
  MotionAgent,
  createMotionAgent,
  DURATION,
  EASING,
  ANIMATION_TYPES,
  ALLOWED_PROPERTIES,
  PROHIBITED_PROPERTIES,
} from '../agents/motion-agent.js';
export {
  ComponentGeneratorAgent,
  createComponentGenerator,
  COMPONENT_TEMPLATES,
} from '../agents/component-generator-agent.js';
export {
  CodeReviewAgent,
  createCodeReviewAgent,
  REVIEW_CATEGORIES,
  SEVERITY,
} from '../agents/code-review-agent.js';
export {
  OrchestratorAgent,
  createOrchestrator,
} from '../agents/orchestrator-agent.js';

// AI-powered component generator (requires ANTHROPIC_API_KEY)
export { AIComponentGenerator } from '../agents/ai-component-generator.js';

// Theme API
export { createTheme, applyTheme, serializeTheme, createDarkTheme, tokenPathToVar, varToTokenPath } from './theme.js';

// Theme presets & color utilities
export {
  THEME_PRESETS,
  THEME_CONTRAST_PAIRS,
  getPreset,
  listPresets,
  getPresetOverrides,
  derivePalette,
  deriveBrandTheme,
  generateColorScale,
  suggestHarmonies,
  validateTheme,
  auditTheme,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  adjustLightness,
  adjustSaturation,
  mixColors,
  getComplementary,
  getAnalogous,
  getSplitComplementary,
  getTriadic,
  getTetradic,
  contrastRatio,
  passesAA,
} from './theme-presets.js';

// Theme file I/O
export {
  THEME_FILE_VERSION,
  validateThemeFile,
  importThemeFile,
  exportThemeFile,
} from './theme-file.js';

// Protocol constants
export { AGENTS } from '../agents/agent-protocol.js';
