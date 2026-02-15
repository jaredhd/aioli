/**
 * Aioli Design System - Agent Layer
 * 
 * Export all agents for use by other parts of the system
 */

import { DesignTokenAgent, createDesignTokenAgent as _createDesignTokenAgent } from './design-token-agent.js';
import { 
  AccessibilityValidatorAgent, 
  createAccessibilityValidator as _createAccessibilityValidator,
  getContrastRatio,
  parseColor,
  WCAG_CONTRAST_RATIOS,
  MOTION_RULES
} from './accessibility-validator-agent.js';
import { OrchestratorAgent, createOrchestrator as _createOrchestrator } from './orchestrator-agent.js';
import { 
  MotionAgent, 
  createMotionAgent as _createMotionAgent,
  DURATION,
  EASING,
  ANIMATION_TYPES,
  ALLOWED_PROPERTIES,
  PROHIBITED_PROPERTIES,
} from './motion-agent.js';
import {
  ComponentGeneratorAgent,
  createComponentGenerator as _createComponentGenerator,
  COMPONENT_TEMPLATES,
  STYLE_MODIFIERS,
  PAGE_COMPOSITIONS,
} from './component-generator-agent.js';
import {
  CodeReviewAgent,
  createCodeReviewAgent as _createCodeReviewAgent,
  REVIEW_CATEGORIES,
  SEVERITY,
} from './code-review-agent.js';
import { AGENTS, createFixResult, groupFixesByAgent, getAutoFixable, getNeedsReview } from './agent-protocol.js';

// Re-export everything
export { DesignTokenAgent };
export const createDesignTokenAgent = _createDesignTokenAgent;
export { AccessibilityValidatorAgent, getContrastRatio, parseColor, WCAG_CONTRAST_RATIOS, MOTION_RULES };
export const createAccessibilityValidator = _createAccessibilityValidator;
export { OrchestratorAgent };
export const createOrchestrator = _createOrchestrator;
export { MotionAgent, DURATION, EASING, ANIMATION_TYPES, ALLOWED_PROPERTIES, PROHIBITED_PROPERTIES };
export const createMotionAgent = _createMotionAgent;
export { ComponentGeneratorAgent, COMPONENT_TEMPLATES, STYLE_MODIFIERS, PAGE_COMPOSITIONS };
export const createComponentGenerator = _createComponentGenerator;
export { CodeReviewAgent, REVIEW_CATEGORIES, SEVERITY };
export const createCodeReviewAgent = _createCodeReviewAgent;
export { AGENTS, createFixResult, groupFixesByAgent, getAutoFixable, getNeedsReview };

// Agent status
export const AGENT_STATUS = {
  'design-token': { version: '1.0.0', status: 'active' },
  'accessibility-validator': { version: '1.1.0', status: 'active', features: ['suggestFixes'] },
  'orchestrator': { version: '1.0.0', status: 'active' },
  'motion-animation': { version: '1.0.0', status: 'active', features: ['presets', 'validation', 'applyFix'] },
  'component-generator': { version: '2.0.0', status: 'active', features: ['generate', 'nlParsing', 'applyFix', 'styleModifiers', 'pageCompositions'] },
  'code-review': { version: '1.0.0', status: 'active', features: ['review', 'quickCheck', 'suggestFixes'] },
};

/**
 * Create and connect all agents with orchestrator
 * @param {string} tokensDir - Path to tokens directory
 * @returns {Object} Connected agents and orchestrator
 */
export function createAgentSystem(tokensDir) {
  const tokenAgent = _createDesignTokenAgent(tokensDir);
  const a11yAgent = _createAccessibilityValidator({ tokenAgent, targetLevel: 'AA' });
  const motionAgent = _createMotionAgent({ tokenAgent });
  const componentAgent = _createComponentGenerator({ tokenAgent, motionAgent });
  const codeReviewAgent = _createCodeReviewAgent({ 
    tokenAgent, 
    a11yAgent, 
    motionAgent, 
    componentAgent 
  });
  
  const orchestrator = _createOrchestrator({
    'design-token': tokenAgent,
    'accessibility-validator': a11yAgent,
    'motion-animation': motionAgent,
    'component-generator': componentAgent,
    'code-review': codeReviewAgent,
  });
  
  return {
    token: tokenAgent,
    a11y: a11yAgent,
    motion: motionAgent,
    component: componentAgent,
    codeReview: codeReviewAgent,
    orchestrator,
  };
}
