/**
 * 🔌 Agent Communication Protocol
 * 
 * Shared types and formats for inter-agent communication.
 * All agents use these standardized formats to communicate.
 */

// ============================================================================
// AGENT IDENTIFIERS
// ============================================================================

export const AGENTS = {
  TOKEN: 'design-token',
  A11Y: 'accessibility-validator',
  MOTION: 'motion-animation',
  COMPONENT: 'component-generator',
  REVIEW: 'code-review',
  ORCHESTRATOR: 'orchestrator',
  HUMAN: 'human', // Manual intervention required
};

// ============================================================================
// FIX TYPES & ROUTING
// ============================================================================

/**
 * Fix types mapped to the agent responsible for applying them
 */
export const FIX_ROUTING = {
  // Token Agent handles
  'token.contrast': AGENTS.TOKEN,
  'token.update': AGENTS.TOKEN,
  'token.create': AGENTS.TOKEN,
  
  // Component Generator handles
  'component.semantic': AGENTS.COMPONENT,
  'component.aria': AGENTS.COMPONENT,
  'component.structure': AGENTS.COMPONENT,
  
  // Motion Agent handles
  'motion.duration': AGENTS.MOTION,
  'motion.easing': AGENTS.MOTION,
  'motion.reduced': AGENTS.MOTION,
  
  // Requires human review
  'manual.review': AGENTS.HUMAN,
};

// ============================================================================
// FIX REQUEST STRUCTURE
// ============================================================================

/**
 * Create a standardized fix request
 * 
 * @param {Object} params
 * @param {string} params.type - Fix type (e.g., 'token.contrast')
 * @param {string} params.severity - 'critical' | 'error' | 'warning' | 'info'
 * @param {string} params.source - Agent that detected the issue
 * @param {Object} params.issue - Original issue details
 * @param {Object} params.fix - Proposed fix details
 * @param {string} [params.description] - Human-readable description
 * @param {boolean} [params.autoFixable] - Can be fixed without human review
 * @returns {Object} Fix request object
 */
export function createFixRequest({
  type,
  severity = 'warning',
  source,
  issue,
  fix,
  description = '',
  autoFixable = true,
}) {
  const target = FIX_ROUTING[type] || AGENTS.HUMAN;
  
  return {
    id: `fix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    severity,
    source,
    target,
    issue,
    fix,
    description,
    autoFixable: target !== AGENTS.HUMAN && autoFixable,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// FIX RESULT STRUCTURE
// ============================================================================

/**
 * Create a fix result (response after attempting to apply a fix)
 */
export function createFixResult({
  requestId,
  success,
  error = null,
  changes = null,
  needsValidation = true,
}) {
  return {
    requestId,
    success,
    error,
    changes,
    needsValidation,
    completedAt: new Date().toISOString(),
  };
}

// ============================================================================
// CONTRAST FIX HELPERS
// ============================================================================

/**
 * Create a contrast fix request
 */
export function createContrastFixRequest({
  tokenPath,
  currentValue,
  suggestedValue,
  currentRatio,
  requiredRatio,
  context = '',
}) {
  return createFixRequest({
    type: 'token.contrast',
    severity: currentRatio < 3 ? 'critical' : 'error',
    source: AGENTS.A11Y,
    issue: {
      tokenPath,
      currentValue,
      currentRatio,
      requiredRatio,
      context,
      wcag: requiredRatio >= 7 ? '1.4.6' : '1.4.3',
    },
    fix: {
      action: 'updateToken',
      tokenPath,
      newValue: suggestedValue,
    },
    description: `Update ${tokenPath} from ${currentValue} to ${suggestedValue} to achieve ${requiredRatio}:1 contrast`,
    autoFixable: true,
  });
}

/**
 * Create a semantic HTML fix request
 */
export function createSemanticFixRequest({
  element,
  issue,
  fixAction,
  fixParams,
  file = null,
  line = null,
}) {
  return createFixRequest({
    type: 'component.semantic',
    severity: 'error',
    source: AGENTS.A11Y,
    issue: {
      element,
      problem: issue,
      file,
      line,
      wcag: '4.1.2',
    },
    fix: {
      action: fixAction,
      params: fixParams,
    },
    description: issue,
    autoFixable: fixAction !== 'manual',
  });
}

/**
 * Create a motion/animation fix request
 */
export function createMotionFixRequest({
  property,
  currentValue,
  suggestedValue,
  reason,
}) {
  return createFixRequest({
    type: `motion.${property}`,
    severity: 'warning',
    source: AGENTS.A11Y,
    issue: {
      property,
      currentValue,
      wcag: '2.3.3',
    },
    fix: {
      action: 'update',
      property,
      newValue: suggestedValue,
    },
    description: reason,
    autoFixable: true,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Group fix requests by target agent
 */
export function groupFixesByAgent(fixes) {
  return fixes.reduce((groups, fix) => {
    const target = fix.target;
    if (!groups[target]) groups[target] = [];
    groups[target].push(fix);
    return groups;
  }, {});
}

/**
 * Filter fixes that can be auto-applied
 */
export function getAutoFixable(fixes) {
  return fixes.filter(fix => fix.autoFixable && fix.target !== AGENTS.HUMAN);
}

/**
 * Filter fixes that need human review
 */
export function getNeedsReview(fixes) {
  return fixes.filter(fix => !fix.autoFixable || fix.target === AGENTS.HUMAN);
}

export default {
  AGENTS,
  FIX_ROUTING,
  createFixRequest,
  createFixResult,
  createContrastFixRequest,
  createSemanticFixRequest,
  createMotionFixRequest,
  groupFixesByAgent,
  getAutoFixable,
  getNeedsReview,
};
