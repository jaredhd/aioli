/**
 * 🔍 CODE REVIEW AGENT
 * 
 * The final quality gate before output. Reviews generated code against
 * all design system rules: tokens, accessibility, motion, and components.
 * 
 * Responsibilities:
 * - Validate code against all rules
 * - Check token usage consistency
 * - Verify accessibility compliance
 * - Audit motion/animation standards
 * - Ensure component patterns are followed
 * - Generate quality score and report
 * - Suggest improvements
 * 
 * Part of: Aioli Design System Agent Layer
 * Agent #6 of 6 - Completes Phase 3
 */

import { AGENTS, createFixResult } from './agent-protocol.js';

// =============================================================================
// REVIEW CATEGORIES & RULES
// =============================================================================

export const REVIEW_CATEGORIES = {
  TOKENS: 'tokens',
  ACCESSIBILITY: 'accessibility',
  MOTION: 'motion',
  STRUCTURE: 'structure',
  PATTERNS: 'patterns',
  PERFORMANCE: 'performance',
};

export const SEVERITY = {
  ERROR: 'error',      // Must fix - blocks approval
  WARNING: 'warning',  // Should fix - doesn't block
  INFO: 'info',        // Suggestion - nice to have
};

// =============================================================================
// CODE REVIEW AGENT
// =============================================================================

export class CodeReviewAgent {
  constructor(options = {}) {
    this.name = AGENTS.REVIEW;
    this.version = '1.0.0';
    
    // Connected agents for delegated checks
    this.tokenAgent = options.tokenAgent || null;
    this.a11yAgent = options.a11yAgent || null;
    this.motionAgent = options.motionAgent || null;
    this.componentAgent = options.componentAgent || null;
    
    // Review state
    this.issues = [];
    this.suggestions = [];
    this.checkedRules = new Set();
    
    // Configuration
    this.strictMode = options.strictMode || false;
    this.categories = options.categories || Object.values(REVIEW_CATEGORIES);
    
    console.log('🔍 Code Review Agent: Initialized');
  }

  /**
   * Connect other agents for delegation
   */
  setAgents(agents) {
    if (agents.token) this.tokenAgent = agents.token;
    if (agents.a11y) this.a11yAgent = agents.a11y;
    if (agents.motion) this.motionAgent = agents.motion;
    if (agents.component) this.componentAgent = agents.component;
  }

  /**
   * Reset review state
   */
  reset() {
    this.issues = [];
    this.suggestions = [];
    this.checkedRules = new Set();
  }

  /**
   * Add an issue to the review
   */
  addIssue(issue) {
    this.issues.push({
      id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...issue,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add a suggestion for improvement
   */
  addSuggestion(suggestion) {
    this.suggestions.push({
      id: `suggestion-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...suggestion,
      timestamp: new Date().toISOString(),
    });
  }

  // ===========================================================================
  // MAIN REVIEW METHOD
  // ===========================================================================

  /**
   * Perform a full code review
   * @param {Object} code - Code to review
   * @param {string} code.html - HTML content
   * @param {string} code.css - CSS content
   * @param {string} code.component - Component type (if applicable)
   * @param {Object} options - Review options
   * @returns {Object} Review result
   */
  review(code, options = {}) {
    this.reset();
    
    const { html = '', css = '', component = null } = code;
    const startTime = Date.now();

    // Run all category checks
    if (this.categories.includes(REVIEW_CATEGORIES.TOKENS)) {
      this.checkTokenUsage(html, css);
    }
    
    if (this.categories.includes(REVIEW_CATEGORIES.ACCESSIBILITY)) {
      this.checkAccessibility(html);
    }
    
    if (this.categories.includes(REVIEW_CATEGORIES.MOTION)) {
      this.checkMotion(css);
    }
    
    if (this.categories.includes(REVIEW_CATEGORIES.STRUCTURE)) {
      this.checkStructure(html);
    }
    
    if (this.categories.includes(REVIEW_CATEGORIES.PATTERNS)) {
      this.checkPatterns(html, component);
    }
    
    if (this.categories.includes(REVIEW_CATEGORIES.PERFORMANCE)) {
      this.checkPerformance(html, css);
    }

    // Generate result
    const result = this.generateResult(startTime);
    
    return result;
  }

  // ===========================================================================
  // TOKEN CHECKS
  // ===========================================================================

  /**
   * Check for proper token usage
   */
  checkTokenUsage(html, css) {
    const content = html + css;
    
    // Check for hardcoded colors
    const colorMatches = content.match(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/g) || [];
    const rgbMatches = content.match(/rgb\([^)]+\)|rgba\([^)]+\)/g) || [];
    const hslMatches = content.match(/hsl\([^)]+\)|hsla\([^)]+\)/g) || [];
    
    const hardcodedColors = [...colorMatches, ...rgbMatches, ...hslMatches];
    
    if (hardcodedColors.length > 0) {
      this.addIssue({
        category: REVIEW_CATEGORIES.TOKENS,
        ruleId: 'token-hardcoded-color',
        severity: SEVERITY.WARNING,
        message: `Found ${hardcodedColors.length} hardcoded color value(s)`,
        details: hardcodedColors.slice(0, 5),
        suggestion: 'Use design tokens via CSS variables: var(--color-primary)',
      });
    }

    // Check for hardcoded spacing
    const spacingMatches = content.match(/(?:margin|padding|gap):\s*\d+px/g) || [];
    
    if (spacingMatches.length > 0) {
      this.addIssue({
        category: REVIEW_CATEGORIES.TOKENS,
        ruleId: 'token-hardcoded-spacing',
        severity: SEVERITY.INFO,
        message: `Found ${spacingMatches.length} hardcoded spacing value(s)`,
        details: spacingMatches.slice(0, 5),
        suggestion: 'Use spacing tokens: var(--spacing-4)',
      });
    }

    // Check for CSS variable usage (positive check)
    const varUsage = content.match(/var\(--[^)]+\)/g) || [];
    if (varUsage.length > 0) {
      this.addSuggestion({
        category: REVIEW_CATEGORIES.TOKENS,
        type: 'positive',
        message: `Good: Using ${varUsage.length} CSS variable(s)`,
      });
    }

    this.checkedRules.add('token-hardcoded-color');
    this.checkedRules.add('token-hardcoded-spacing');
    this.checkedRules.add('token-var-usage');
  }

  // ===========================================================================
  // ACCESSIBILITY CHECKS
  // ===========================================================================

  /**
   * Check accessibility compliance
   */
  checkAccessibility(html) {
    // Delegate to A11y agent if available
    if (this.a11yAgent) {
      const a11yResult = this.a11yAgent.validateHTML(html);
      
      a11yResult.issues.forEach(issue => {
        this.addIssue({
          category: REVIEW_CATEGORIES.ACCESSIBILITY,
          ruleId: `a11y-${issue.type || 'general'}`,
          severity: issue.severity === 'error' ? SEVERITY.ERROR : SEVERITY.WARNING,
          message: issue.message,
          wcag: issue.wcag,
          suggestion: issue.suggestion,
        });
      });
      
      this.checkedRules.add('a11y-delegated');
      return;
    }

    // Fallback checks if no A11y agent
    
    // Check for images without alt
    const imgWithoutAlt = html.match(/<img(?![^>]*alt=)[^>]*>/gi) || [];
    if (imgWithoutAlt.length > 0) {
      this.addIssue({
        category: REVIEW_CATEGORIES.ACCESSIBILITY,
        ruleId: 'a11y-img-alt',
        severity: SEVERITY.ERROR,
        message: `${imgWithoutAlt.length} image(s) missing alt attribute`,
        wcag: '1.1.1',
      });
    }

    // Check for form inputs without labels
    const inputs = html.match(/<input[^>]*>/gi) || [];
    const inputsWithLabels = html.match(/<input[^>]*(?:aria-label|id=["'][^"']+["'])[^>]*>/gi) || [];
    
    if (inputs.length > inputsWithLabels.length) {
      this.addIssue({
        category: REVIEW_CATEGORIES.ACCESSIBILITY,
        ruleId: 'a11y-input-label',
        severity: SEVERITY.ERROR,
        message: 'Some form inputs may be missing labels',
        wcag: '1.3.1',
      });
    }

    // Check for clickable divs
    if (/<div[^>]*onclick/i.test(html)) {
      this.addIssue({
        category: REVIEW_CATEGORIES.ACCESSIBILITY,
        ruleId: 'a11y-clickable-div',
        severity: SEVERITY.ERROR,
        message: 'Using div with onclick instead of button',
        wcag: '4.1.2',
        suggestion: 'Use <button> for interactive elements',
      });
    }

    // Check for empty buttons
    const emptyButtons = html.match(/<button[^>]*>\s*<\/button>/gi) || [];
    if (emptyButtons.length > 0) {
      this.addIssue({
        category: REVIEW_CATEGORIES.ACCESSIBILITY,
        ruleId: 'a11y-empty-button',
        severity: SEVERITY.ERROR,
        message: `${emptyButtons.length} empty button(s) found`,
        suggestion: 'Add text content or aria-label',
      });
    }

    this.checkedRules.add('a11y-img-alt');
    this.checkedRules.add('a11y-input-label');
    this.checkedRules.add('a11y-clickable-div');
    this.checkedRules.add('a11y-empty-button');
  }

  // ===========================================================================
  // MOTION CHECKS
  // ===========================================================================

  /**
   * Check motion/animation compliance
   */
  checkMotion(css) {
    if (!css) return;
    
    // Delegate to Motion agent if available
    if (this.motionAgent) {
      const motionResult = this.motionAgent.validate(css);
      
      motionResult.issues.forEach(issue => {
        this.addIssue({
          category: REVIEW_CATEGORIES.MOTION,
          ruleId: `motion-${issue.type || 'general'}`,
          severity: issue.severity === 'error' ? SEVERITY.ERROR : SEVERITY.WARNING,
          message: issue.message,
          suggestion: issue.suggestion,
        });
      });
      
      this.checkedRules.add('motion-delegated');
      return;
    }

    // Fallback checks
    
    // Check for prefers-reduced-motion
    if ((css.includes('animation') || css.includes('transition')) && 
        !css.includes('prefers-reduced-motion')) {
      this.addIssue({
        category: REVIEW_CATEGORIES.MOTION,
        ruleId: 'motion-reduced-motion',
        severity: SEVERITY.WARNING,
        message: 'Animations without prefers-reduced-motion support',
        suggestion: 'Add @media (prefers-reduced-motion: reduce) query',
      });
    }

    // Check for prohibited easing
    const prohibitedEasing = ['bounce', 'elastic', 'spring'];
    prohibitedEasing.forEach(easing => {
      if (css.toLowerCase().includes(easing)) {
        this.addIssue({
          category: REVIEW_CATEGORIES.MOTION,
          ruleId: 'motion-easing-standard',
          severity: SEVERITY.ERROR,
          message: `Prohibited easing detected: ${easing}`,
          suggestion: 'Use standard easing: ease-out, ease-in, ease-in-out',
        });
      }
    });

    // Check for long durations
    const durationMatches = css.match(/(\d+)ms/g) || [];
    durationMatches.forEach(match => {
      const duration = parseInt(match);
      if (duration > 1000) {
        this.addIssue({
          category: REVIEW_CATEGORIES.MOTION,
          ruleId: 'motion-duration-bounds',
          severity: SEVERITY.WARNING,
          message: `Animation duration ${duration}ms exceeds 1000ms max`,
          suggestion: 'Keep UI animations under 1000ms',
        });
      }
    });

    // Check for layout-triggering properties
    const layoutProps = ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding'];
    layoutProps.forEach(prop => {
      const pattern = new RegExp(`(animation|transition)[^;]*${prop}`, 'i');
      if (pattern.test(css)) {
        this.addIssue({
          category: REVIEW_CATEGORIES.MOTION,
          ruleId: 'motion-gpu-properties',
          severity: SEVERITY.WARNING,
          message: `Animating layout property: ${prop}`,
          suggestion: 'Use transform instead for better performance',
        });
      }
    });

    this.checkedRules.add('motion-reduced-motion');
    this.checkedRules.add('motion-easing-standard');
    this.checkedRules.add('motion-duration-bounds');
    this.checkedRules.add('motion-gpu-properties');
  }

  // ===========================================================================
  // STRUCTURE CHECKS
  // ===========================================================================

  /**
   * Check HTML structure
   */
  checkStructure(html) {
    if (!html) return;
    
    // Check heading hierarchy
    const headings = html.match(/<h([1-6])[^>]*>/gi) || [];
    if (headings.length > 1) {
      const levels = headings.map(h => parseInt(h.match(/h([1-6])/i)[1]));
      
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i-1] + 1) {
          this.addIssue({
            category: REVIEW_CATEGORIES.STRUCTURE,
            ruleId: 'structure-heading-order',
            severity: SEVERITY.WARNING,
            message: `Heading level skipped: h${levels[i-1]} to h${levels[i]}`,
            suggestion: 'Headings should not skip levels',
          });
          break;
        }
      }
    }

    // Check for landmark regions
    const landmarks = ['main', 'nav', 'header', 'footer', 'aside', 'section', 'article'];
    const foundLandmarks = landmarks.filter(l => 
      new RegExp(`<${l}[^>]*>`, 'i').test(html)
    );
    
    if (foundLandmarks.length > 0) {
      this.addSuggestion({
        category: REVIEW_CATEGORIES.STRUCTURE,
        type: 'positive',
        message: `Good: Using semantic landmarks (${foundLandmarks.join(', ')})`,
      });
    }

    // Check for div soup
    const divCount = (html.match(/<div/gi) || []).length;
    const semanticCount = landmarks.reduce((count, l) => 
      count + (html.match(new RegExp(`<${l}`, 'gi')) || []).length, 0
    );
    
    if (divCount > 10 && semanticCount < 2) {
      this.addIssue({
        category: REVIEW_CATEGORIES.STRUCTURE,
        ruleId: 'structure-semantic-html',
        severity: SEVERITY.INFO,
        message: 'High div usage with few semantic elements',
        suggestion: 'Consider using more semantic HTML elements',
      });
    }

    this.checkedRules.add('structure-heading-order');
    this.checkedRules.add('structure-landmark-regions');
    this.checkedRules.add('structure-semantic-html');
  }

  // ===========================================================================
  // PATTERN CHECKS
  // ===========================================================================

  /**
   * Check component patterns
   */
  checkPatterns(html, componentType) {
    if (!html) return;
    
    // Button patterns
    const buttons = html.match(/<button[^>]*>/gi) || [];
    buttons.forEach(button => {
      if (!/type=["']/.test(button)) {
        this.addIssue({
          category: REVIEW_CATEGORIES.PATTERNS,
          ruleId: 'pattern-button-type',
          severity: SEVERITY.WARNING,
          message: 'Button missing type attribute',
          suggestion: 'Add type="button" or type="submit"',
        });
      }
    });

    // Link patterns
    const emptyLinks = html.match(/<a[^>]*>[\s]*<\/a>/gi) || [];
    if (emptyLinks.length > 0) {
      this.addIssue({
        category: REVIEW_CATEGORIES.PATTERNS,
        ruleId: 'pattern-link-content',
        severity: SEVERITY.ERROR,
        message: `${emptyLinks.length} empty link(s) found`,
        suggestion: 'Links need descriptive text content',
      });
    }

    // Icon-only buttons check
    if (/<button[^>]*>[\s]*<(?:svg|i|span)[^>]*>[\s]*<\//i.test(html)) {
      if (!/aria-label/.test(html)) {
        this.addIssue({
          category: REVIEW_CATEGORIES.PATTERNS,
          ruleId: 'pattern-icon-button-label',
          severity: SEVERITY.WARNING,
          message: 'Icon-only button may need aria-label',
          suggestion: 'Add aria-label for screen readers',
        });
      }
    }

    // Component-specific checks
    if (componentType) {
      this.checkComponentPattern(html, componentType);
    }

    this.checkedRules.add('pattern-button-type');
    this.checkedRules.add('pattern-link-content');
    this.checkedRules.add('pattern-icon-button-label');
  }

  /**
   * Check specific component patterns
   */
  checkComponentPattern(html, type) {
    switch (type) {
      case 'modal':
        if (!html.includes('role="dialog"')) {
          this.addIssue({
            category: REVIEW_CATEGORIES.PATTERNS,
            ruleId: 'pattern-modal-role',
            severity: SEVERITY.ERROR,
            message: 'Modal missing role="dialog"',
          });
        }
        if (!html.includes('aria-modal')) {
          this.addIssue({
            category: REVIEW_CATEGORIES.PATTERNS,
            ruleId: 'pattern-modal-aria',
            severity: SEVERITY.WARNING,
            message: 'Modal missing aria-modal="true"',
          });
        }
        break;
        
      case 'tabs':
        if (!html.includes('role="tablist"')) {
          this.addIssue({
            category: REVIEW_CATEGORIES.PATTERNS,
            ruleId: 'pattern-tabs-role',
            severity: SEVERITY.ERROR,
            message: 'Tabs missing role="tablist"',
          });
        }
        break;
        
      case 'alert':
        if (!html.includes('role="alert"')) {
          this.addIssue({
            category: REVIEW_CATEGORIES.PATTERNS,
            ruleId: 'pattern-alert-role',
            severity: SEVERITY.ERROR,
            message: 'Alert missing role="alert"',
          });
        }
        break;
        
      case 'accordion':
        if (!html.includes('aria-expanded')) {
          this.addIssue({
            category: REVIEW_CATEGORIES.PATTERNS,
            ruleId: 'pattern-accordion-expanded',
            severity: SEVERITY.WARNING,
            message: 'Accordion triggers should have aria-expanded',
          });
        }
        break;
    }
  }

  // ===========================================================================
  // PERFORMANCE CHECKS
  // ===========================================================================

  /**
   * Check for performance issues
   */
  checkPerformance(html, css) {
    // Check for inline styles
    if (html) {
      const inlineStyles = html.match(/style=["'][^"']+["']/gi) || [];
      if (inlineStyles.length > 5) {
        this.addIssue({
          category: REVIEW_CATEGORIES.PERFORMANCE,
          ruleId: 'perf-inline-styles',
          severity: SEVERITY.INFO,
          message: `${inlineStyles.length} inline styles detected`,
          suggestion: 'Consider using CSS classes instead',
        });
      }
    }

    if (css) {
      // Check for deeply nested selectors
      const selectors = css.match(/[^{}]+{/g) || [];
      selectors.forEach(selector => {
        const depth = (selector.match(/\s+/g) || []).length;
        if (depth > 4) {
          this.addIssue({
            category: REVIEW_CATEGORIES.PERFORMANCE,
            ruleId: 'perf-selector-depth',
            severity: SEVERITY.INFO,
            message: 'Deeply nested CSS selector detected',
            suggestion: 'Keep selector specificity low',
          });
        }
      });

      // Check for !important
      const importantCount = (css.match(/!important/gi) || []).length;
      if (importantCount > 2) {
        this.addIssue({
          category: REVIEW_CATEGORIES.PERFORMANCE,
          ruleId: 'perf-important',
          severity: SEVERITY.INFO,
          message: `${importantCount} !important declarations`,
          suggestion: 'Avoid !important - use proper specificity',
        });
      }
    }

    this.checkedRules.add('perf-inline-styles');
    this.checkedRules.add('perf-selector-depth');
    this.checkedRules.add('perf-important');
  }

  // ===========================================================================
  // RESULT GENERATION
  // ===========================================================================

  /**
   * Generate review result with quality score
   */
  generateResult(startTime) {
    const endTime = Date.now();
    
    // Count by severity
    const errors = this.issues.filter(i => i.severity === SEVERITY.ERROR);
    const warnings = this.issues.filter(i => i.severity === SEVERITY.WARNING);
    const info = this.issues.filter(i => i.severity === SEVERITY.INFO);

    // Count by category
    const byCategory = {};
    Object.values(REVIEW_CATEGORIES).forEach(cat => {
      byCategory[cat] = this.issues.filter(i => i.category === cat).length;
    });

    // Calculate quality score (0-100)
    const score = this.calculateScore(errors.length, warnings.length, info.length);
    
    // Determine approval status
    const approved = errors.length === 0;
    
    return {
      approved,
      score,
      grade: this.getGrade(score),
      summary: {
        total: this.issues.length,
        errors: errors.length,
        warnings: warnings.length,
        info: info.length,
        suggestions: this.suggestions.length,
        rulesChecked: this.checkedRules.size,
      },
      byCategory,
      issues: this.issues,
      suggestions: this.suggestions,
      timestamp: new Date().toISOString(),
      duration: endTime - startTime,
    };
  }

  /**
   * Calculate quality score
   */
  calculateScore(errors, warnings, info) {
    // Start at 100, deduct for issues
    let score = 100;
    score -= errors * 15;      // Errors heavily penalized
    score -= warnings * 5;     // Warnings moderate
    score -= info * 1;         // Info minimal
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get letter grade from score
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // ===========================================================================
  // QUICK CHECKS
  // ===========================================================================

  /**
   * Quick check just for errors (faster)
   */
  quickCheck(code) {
    this.reset();
    const { html = '', css = '' } = code;
    
    // Only check for blocking errors
    this.checkAccessibility(html);
    this.checkMotion(css);
    
    const errors = this.issues.filter(i => i.severity === SEVERITY.ERROR);
    
    return {
      pass: errors.length === 0,
      errors: errors.length,
      issues: errors,
    };
  }

  /**
   * Check specific category only
   */
  checkCategory(code, category) {
    this.reset();
    const { html = '', css = '', component = null } = code;
    
    switch (category) {
      case REVIEW_CATEGORIES.TOKENS:
        this.checkTokenUsage(html, css);
        break;
      case REVIEW_CATEGORIES.ACCESSIBILITY:
        this.checkAccessibility(html);
        break;
      case REVIEW_CATEGORIES.MOTION:
        this.checkMotion(css);
        break;
      case REVIEW_CATEGORIES.STRUCTURE:
        this.checkStructure(html);
        break;
      case REVIEW_CATEGORIES.PATTERNS:
        this.checkPatterns(html, component);
        break;
      case REVIEW_CATEGORIES.PERFORMANCE:
        this.checkPerformance(html, css);
        break;
    }
    
    return {
      category,
      issues: this.issues,
      suggestions: this.suggestions,
    };
  }

  // ===========================================================================
  // FIX GENERATION
  // ===========================================================================

  /**
   * Generate fix suggestions for issues
   */
  suggestFixes() {
    const fixes = [];
    
    this.issues.forEach(issue => {
      const fix = this.createFixForIssue(issue);
      if (fix) {
        fixes.push(fix);
      }
    });
    
    return {
      fixes,
      count: fixes.length,
      autoFixable: fixes.filter(f => f.autoFixable).length,
    };
  }

  /**
   * Create a fix suggestion for an issue
   */
  createFixForIssue(issue) {
    const fixMap = {
      'pattern-button-type': {
        type: 'component.semantic',
        target: AGENTS.COMPONENT,
        fix: { action: 'addAttribute', params: { attribute: 'type', value: 'button' } },
        autoFixable: true,
      },
      'a11y-img-alt': {
        type: 'component.semantic',
        target: AGENTS.COMPONENT,
        fix: { action: 'addAttribute', params: { attribute: 'alt', value: '' } },
        autoFixable: true,
      },
      'motion-easing-standard': {
        type: 'motion.easing',
        target: AGENTS.MOTION,
        fix: { action: 'replaceEasing', direction: 'enter' },
        autoFixable: true,
      },
      'motion-duration-bounds': {
        type: 'motion.duration',
        target: AGENTS.MOTION,
        fix: { action: 'replaceDuration' },
        autoFixable: true,
      },
    };
    
    const fixConfig = fixMap[issue.ruleId];
    if (!fixConfig) {
      return {
        id: `fix-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        issue: issue.ruleId,
        type: 'manual.review',
        target: AGENTS.HUMAN,
        description: issue.suggestion || issue.message,
        autoFixable: false,
      };
    }
    
    return {
      id: `fix-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      issue: issue.ruleId,
      type: fixConfig.type,
      target: fixConfig.target,
      fix: fixConfig.fix,
      description: issue.suggestion || issue.message,
      autoFixable: fixConfig.autoFixable,
      severity: issue.severity,
    };
  }

  // ===========================================================================
  // REPORTING
  // ===========================================================================

  /**
   * Generate a human-readable report
   */
  generateReport(result = null) {
    const r = result || this.generateResult(Date.now());
    const lines = [];
    
    lines.push('═'.repeat(60));
    lines.push('  🔍 CODE REVIEW REPORT');
    lines.push('═'.repeat(60));
    lines.push('');
    
    // Summary
    lines.push(`Status: ${r.approved ? '✓ APPROVED' : '✗ NEEDS WORK'}`);
    lines.push(`Score: ${r.score}/100 (${r.grade})`);
    lines.push('');
    
    // Issues breakdown
    lines.push('Issues:');
    lines.push(`  ✗ Errors: ${r.summary.errors}`);
    lines.push(`  ⚠ Warnings: ${r.summary.warnings}`);
    lines.push(`  ℹ Info: ${r.summary.info}`);
    lines.push('');
    
    // By category
    if (Object.values(r.byCategory).some(v => v > 0)) {
      lines.push('By Category:');
      Object.entries(r.byCategory).forEach(([cat, count]) => {
        if (count > 0) {
          lines.push(`  ${cat}: ${count}`);
        }
      });
      lines.push('');
    }
    
    // Issues detail
    if (r.issues.length > 0) {
      lines.push('Issues Detail:');
      lines.push('─'.repeat(60));
      
      r.issues.forEach((issue, i) => {
        const icon = issue.severity === SEVERITY.ERROR ? '✗' : 
                     issue.severity === SEVERITY.WARNING ? '⚠' : 'ℹ';
        lines.push(`${i + 1}. [${icon}] ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`   → ${issue.suggestion}`);
        }
      });
      lines.push('');
    }
    
    // Suggestions
    if (r.suggestions.length > 0) {
      lines.push('Positive Findings:');
      r.suggestions.forEach(s => {
        lines.push(`  ✓ ${s.message}`);
      });
      lines.push('');
    }
    
    lines.push('─'.repeat(60));
    lines.push(`Reviewed at: ${r.timestamp}`);
    lines.push(`Duration: ${r.duration}ms`);
    lines.push(`Rules checked: ${r.summary.rulesChecked}`);
    
    return lines.join('\n');
  }

  // ===========================================================================
  // REQUEST HANDLER
  // ===========================================================================

  /**
   * Handle requests from orchestrator
   */
  handleRequest(request) {
    if (!request || !request.action) {
      return { success: false, error: 'Request must include an action' };
    }
    const { action, ...params } = request;

    try {
      switch (action) {
        case 'review':
          return { success: true, result: this.review(params.code || params, params.options) };

        case 'quickCheck':
          return { success: true, result: this.quickCheck(params.code || params) };

        case 'checkCategory':
          return { success: true, result: this.checkCategory(params.code || params, params.category) };

        case 'suggestFixes':
          return { success: true, result: this.suggestFixes() };

        case 'generateReport':
          return { success: true, report: this.generateReport(params.result) };

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createCodeReviewAgent(options = {}) {
  return new CodeReviewAgent(options);
}

export default CodeReviewAgent;
