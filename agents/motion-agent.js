/**
 * ✨ Motion/Animation Agent
 * Part of the Aioli Design System
 * 
 * The choreographer — handles timing and movement:
 * - Generates animation CSS based on interaction type
 * - Validates animations against standards
 * - Ensures accessibility (prefers-reduced-motion)
 * - Applies fixes routed from Orchestrator
 * 
 * Based on: animation-motion-standards.md
 */

import { AGENTS, createFixResult } from './agent-protocol.js';

// ============================================================================
// MOTION STANDARDS (from animation-motion-standards.md)
// ============================================================================

/**
 * Duration standards by interaction type
 */
export const DURATION = {
  instant: { min: 0, max: 0, default: 0, useCases: ['No animation needed'] },
  micro: { min: 50, max: 100, default: 100, useCases: ['Hover states', 'Focus rings', 'Tooltips appearing'] },
  fast: { min: 100, max: 150, default: 150, useCases: ['Button press', 'Toggle switches', 'Checkboxes'] },
  normal: { min: 200, max: 300, default: 250, useCases: ['Dropdowns', 'Accordions', 'Tab switches', 'Menu toggles'] },
  slow: { min: 300, max: 500, default: 400, useCases: ['Modals', 'Page transitions', 'Slide-in panels'] },
  complex: { min: 500, max: 700, default: 600, useCases: ['Multi-step sequences', 'Data visualizations'] },
};

/**
 * Device adjustments (multipliers relative to mobile base)
 */
export const DEVICE_ADJUSTMENTS = {
  desktop: 0.67,    // Faster (200ms for 300ms base)
  mobile: 1.0,      // Base reference
  tablet: 1.3,      // +30%
  wearable: 0.7,    // -30%
};

/**
 * Standard easing curves
 */
export const EASING = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',    // ease-in-out
  enter: 'cubic-bezier(0, 0, 0.2, 1)',        // ease-out (decelerate)
  exit: 'cubic-bezier(0.4, 0, 1, 1)',         // ease-in (accelerate)
  linear: 'cubic-bezier(0, 0, 1, 1)',         // linear
};

/**
 * Easing curve names for CSS
 */
export const EASING_NAMES = {
  'cubic-bezier(0.4, 0, 0.2, 1)': 'ease-in-out',
  'cubic-bezier(0, 0, 0.2, 1)': 'ease-out',
  'cubic-bezier(0.4, 0, 1, 1)': 'ease-in',
  'cubic-bezier(0, 0, 1, 1)': 'linear',
};

/**
 * Animation types mapped to duration categories
 */
export const ANIMATION_TYPES = {
  // Micro-interactions (50-150ms)
  'button-hover': 'micro',
  'button-press': 'fast',
  'toggle-switch': 'fast',
  'checkbox-tick': 'fast',
  'radio-select': 'fast',
  'focus-ring': 'micro',
  'tooltip-show': 'micro',
  'tooltip-hide': 'micro',
  'hover-scale': 'micro',
  'hover-brighten': 'micro',

  // State transitions (150-300ms)
  'accordion-expand': 'normal',
  'accordion-collapse': 'normal',
  'tab-switch': 'normal',
  'dropdown-open': 'normal',
  'dropdown-close': 'normal',
  'menu-toggle': 'normal',
  'card-flip': 'normal',
  'badge-pulse': 'normal',

  // Entrance/Exit (200-300ms)
  'fade-in': 'normal',
  'fade-in-up': 'normal',
  'fade-in-down': 'normal',
  'fade-in-left': 'normal',
  'fade-in-right': 'normal',
  'fade-out': 'fast',
  'scale-in': 'normal',
  'scale-out': 'fast',

  // Page transitions (300-500ms)
  'modal-open': 'slow',
  'modal-close': 'slow',
  'page-transition': 'slow',
  'slide-in-panel': 'slow',
  'slide-in-up': 'slow',
  'slide-in-down': 'slow',
  'slide-in-left': 'slow',
  'slide-in-right': 'slow',
  'overlay-show': 'slow',
  'overlay-hide': 'slow',
  'scroll-reveal': 'slow',

  // Feedback (200-400ms)
  'loading-spinner': 'normal',
  'success-checkmark': 'normal',
  'error-shake': 'normal',
  'toast-enter': 'normal',
  'toast-exit': 'normal',
  'skeleton-pulse': 'slow',
  'shimmer': 'slow',
  'progress-indeterminate': 'slow',

  // Scroll-triggered (200-400ms)
  'fade-in-scroll': 'normal',
  'sticky-header': 'normal',
  'progress-indicator': 'normal',
};

/**
 * GPU-accelerated properties (safe to animate)
 */
export const ALLOWED_PROPERTIES = [
  'transform',
  'opacity',
  'filter',
  'backdrop-filter',
];

/**
 * Layout-triggering properties (never animate)
 */
export const PROHIBITED_PROPERTIES = [
  'width',
  'height',
  'top',
  'right',
  'bottom',
  'left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-width',
  'font-size',
];

/**
 * Prohibited easing patterns (vestibular triggers)
 */
export const PROHIBITED_EASING = [
  /bounce/i,
  /elastic/i,
  /spring/i,
  /back\s*\(/i,  // cubic-bezier with overshoot
];

/**
 * Essential animations (keep with reduced-motion)
 */
export const ESSENTIAL_ANIMATIONS = [
  'loading',
  'spinner',
  'progress',
  'validation',
  'focus',
  'state-change',
  'toggle',
];

/**
 * Non-essential animations (disable with reduced-motion)
 */
export const NON_ESSENTIAL_ANIMATIONS = [
  'parallax',
  'hover',
  'decorative',
  'background',
  'celebration',
  'confetti',
  'scroll-fade',
  'page-flourish',
];

/**
 * Performance thresholds
 */
export const PERFORMANCE = {
  maxDuration: 1000,           // ms (except data viz)
  maxSimultaneous: 3,          // elements at once
  staggerDelay: { min: 50, max: 100 },  // ms between staggered elements
  targetFps: 60,
  frameTime: 16.67,            // ms per frame at 60fps
};

// ============================================================================
// MOTION AGENT CLASS
// ============================================================================

export class MotionAgent {
  constructor(options = {}) {
    this.tokenAgent = options.tokenAgent || null;
    this.issues = [];
  }

  /**
   * Reset issues for new validation
   */
  reset() {
    this.issues = [];
  }

  /**
   * Add an issue
   */
  addIssue(type, severity, message, context = {}) {
    this.issues.push({
      type,
      severity,
      message,
      ...context,
      timestamp: new Date().toISOString(),
    });
  }

  // ==========================================================================
  // DURATION GENERATION
  // ==========================================================================

  /**
   * Get the recommended duration for an animation type
   * @param {string} animationType - Type of animation (e.g., 'modal-open', 'button-hover')
   * @param {Object} options
   * @param {string} options.device - 'desktop' | 'mobile' | 'tablet' | 'wearable'
   * @param {boolean} options.isExit - Is this an exit animation? (faster)
   * @returns {Object} Duration info
   */
  getDuration(animationType, options = {}) {
    const { device = 'desktop', isExit = false } = options;

    // Get duration category for this animation type
    const category = ANIMATION_TYPES[animationType] || 'normal';
    const durationSpec = DURATION[category];

    // Base duration
    let duration = durationSpec.default;

    // Apply device adjustment
    const deviceMultiplier = DEVICE_ADJUSTMENTS[device] || 1.0;
    duration = Math.round(duration * deviceMultiplier);

    // Exit animations are 20% faster
    if (isExit) {
      duration = Math.round(duration * 0.8);
    }

    // Ensure within bounds
    const adjustedMin = Math.round(durationSpec.min * deviceMultiplier);
    const adjustedMax = Math.round(durationSpec.max * deviceMultiplier);
    duration = Math.max(adjustedMin, Math.min(adjustedMax, duration));

    return {
      duration,
      category,
      device,
      isExit,
      range: { min: adjustedMin, max: adjustedMax },
      css: `${duration}ms`,
      token: `motion.duration.${category}`,
    };
  }

  /**
   * Get duration by category name
   */
  getDurationByCategory(category, device = 'desktop') {
    const spec = DURATION[category];
    if (!spec) return null;

    const multiplier = DEVICE_ADJUSTMENTS[device] || 1.0;
    const duration = Math.round(spec.default * multiplier);

    return {
      duration,
      css: `${duration}ms`,
      range: {
        min: Math.round(spec.min * multiplier),
        max: Math.round(spec.max * multiplier),
      },
      category,
    };
  }

  // ==========================================================================
  // EASING GENERATION
  // ==========================================================================

  /**
   * Get the recommended easing curve based on animation context
   * @param {Object} context
   * @param {string} context.direction - 'enter' | 'exit' | 'move' | 'color'
   * @param {boolean} context.mayReturn - Element may return (like sidebar)
   * @returns {Object} Easing info
   */
  getEasing(context = {}) {
    const { direction = 'move', mayReturn = false } = context;

    let easing;
    let name;
    let reason;

    switch (direction) {
      case 'enter':
        easing = EASING.enter;
        name = 'ease-out';
        reason = 'Elements entering should decelerate into place';
        break;

      case 'exit':
        if (mayReturn) {
          easing = EASING.default;
          name = 'ease-in-out';
          reason = 'Element may return, use standard curve';
        } else {
          easing = EASING.exit;
          name = 'ease-in';
          reason = 'Elements exiting permanently should accelerate away';
        }
        break;

      case 'color':
      case 'opacity':
        easing = EASING.linear;
        name = 'linear';
        reason = 'Color/opacity changes can use linear';
        break;

      case 'move':
      default:
        easing = EASING.default;
        name = 'ease-in-out';
        reason = 'Movement within screen uses standard curve';
        break;
    }

    return {
      easing,
      name,
      reason,
      css: easing,
      token: `motion.easing.${direction === 'move' ? 'default' : direction}`,
    };
  }

  // ==========================================================================
  // TRANSITION GENERATION
  // ==========================================================================

  /**
   * Generate a complete transition CSS value
   * @param {Object} config
   * @param {string} config.property - CSS property to animate
   * @param {string} config.animationType - Animation type for duration
   * @param {string} config.direction - 'enter' | 'exit' | 'move'
   * @param {string} config.device - Target device
   * @returns {Object} Transition info with CSS
   */
  generateTransition(config) {
    const {
      property = 'transform',
      animationType = 'normal',
      direction = 'move',
      device = 'desktop',
      isExit = direction === 'exit',
    } = config;

    // Check if property is allowed
    const propertyBase = property.split('(')[0].trim();
    const isAllowed = ALLOWED_PROPERTIES.some(p => 
      propertyBase === p || propertyBase.startsWith(p)
    );
    const isProhibited = PROHIBITED_PROPERTIES.includes(propertyBase);

    if (isProhibited) {
      return {
        error: true,
        message: `Cannot animate '${property}' - triggers layout/paint`,
        suggestion: `Use transform instead (e.g., transform: translateX() for left/right)`,
        alternatives: this.getAlternativeProperty(property),
      };
    }

    // Get duration and easing
    const durationInfo = this.getDuration(animationType, { device, isExit });
    const easingInfo = this.getEasing({ direction });

    // Build CSS
    const css = `${property} ${durationInfo.css} ${easingInfo.css}`;

    return {
      css,
      property,
      duration: durationInfo.duration,
      durationCss: durationInfo.css,
      easing: easingInfo.easing,
      easingName: easingInfo.name,
      isAllowed,
      willChange: isAllowed ? property : null,
      token: `var(--motion-transition-${animationType})`,
    };
  }

  /**
   * Get alternative GPU-accelerated property
   */
  getAlternativeProperty(property) {
    const alternatives = {
      'width': 'transform: scaleX()',
      'height': 'transform: scaleY()',
      'top': 'transform: translateY()',
      'bottom': 'transform: translateY()',
      'left': 'transform: translateX()',
      'right': 'transform: translateX()',
      'margin': 'transform: translate()',
      'padding': 'transform: scale() with adjusted container',
      'font-size': 'transform: scale()',
    };
    return alternatives[property] || 'transform or opacity';
  }

  // ==========================================================================
  // ANIMATION PRESETS
  // ==========================================================================

  /**
   * Generate CSS for common animation patterns
   * @param {string} preset - Preset name
   * @param {Object} options
   * @returns {Object} Animation CSS and metadata
   */
  generatePreset(preset, options = {}) {
    const { device = 'desktop', essential = false } = options;

    const presets = {
      'fade-in': {
        type: 'enter',
        properties: ['opacity'],
        from: { opacity: 0 },
        to: { opacity: 1 },
        duration: 'normal',
      },
      'fade-out': {
        type: 'exit',
        properties: ['opacity'],
        from: { opacity: 1 },
        to: { opacity: 0 },
        duration: 'fast',
      },
      'slide-in-right': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateX(20px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
        duration: 'normal',
      },
      'slide-out-right': {
        type: 'exit',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateX(0)', opacity: 1 },
        to: { transform: 'translateX(20px)', opacity: 0 },
        duration: 'fast',
      },
      'slide-in-up': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateY(10px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
        duration: 'normal',
      },
      'scale-in': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'scale(0.95)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 },
        duration: 'normal',
      },
      'scale-out': {
        type: 'exit',
        properties: ['transform', 'opacity'],
        from: { transform: 'scale(1)', opacity: 1 },
        to: { transform: 'scale(0.95)', opacity: 0 },
        duration: 'fast',
      },
      'modal-enter': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'scale(0.95) translateY(-10px)', opacity: 0 },
        to: { transform: 'scale(1) translateY(0)', opacity: 1 },
        duration: 'slow',
      },
      'modal-exit': {
        type: 'exit',
        properties: ['transform', 'opacity'],
        from: { transform: 'scale(1) translateY(0)', opacity: 1 },
        to: { transform: 'scale(0.95) translateY(-10px)', opacity: 0 },
        duration: 'normal',
      },
      'button-press': {
        type: 'move',
        properties: ['transform'],
        from: { transform: 'scale(1)' },
        to: { transform: 'scale(0.98)' },
        duration: 'fast',
      },
      'shake': {
        type: 'move',
        keyframes: true,
        duration: 'normal',
        animation: `
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        `,
      },
      'fade-in-up': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateY(10px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
        duration: 'normal',
      },
      'fade-in-down': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateY(-10px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
        duration: 'normal',
      },
      'fade-in-left': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateX(-20px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
        duration: 'normal',
      },
      'fade-in-right': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateX(20px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
        duration: 'normal',
      },
      'toast-enter': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateY(-8px) scale(0.96)', opacity: 0 },
        to: { transform: 'translateY(0) scale(1)', opacity: 1 },
        duration: 'normal',
      },
      'toast-exit': {
        type: 'exit',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateY(0) scale(1)', opacity: 1 },
        to: { transform: 'translateY(-8px) scale(0.96)', opacity: 0 },
        duration: 'fast',
      },
      'dropdown-open': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'scale(0.95) translateY(-4px)', opacity: 0 },
        to: { transform: 'scale(1) translateY(0)', opacity: 1 },
        duration: 'fast',
      },
      'tooltip-enter': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'scale(0.96)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 },
        duration: 'micro',
      },
      'scroll-reveal': {
        type: 'enter',
        properties: ['transform', 'opacity'],
        from: { transform: 'translateY(10px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
        duration: 'slow',
      },
      'shimmer': {
        type: 'move',
        keyframes: true,
        duration: 'complex',
        animation: `
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        `,
      },
    };

    const presetConfig = presets[preset];
    if (!presetConfig) {
      return { error: true, message: `Unknown preset: ${preset}` };
    }

    const isExit = presetConfig.type === 'exit';
    const durationInfo = this.getDuration(
      `${preset.split('-')[0]}-${presetConfig.type}`,
      { device, isExit }
    );
    const easingInfo = this.getEasing({ direction: presetConfig.type });

    // Generate CSS
    let css;
    if (presetConfig.keyframes) {
      css = {
        keyframes: `@keyframes ${preset} { ${presetConfig.animation} }`,
        animation: `${preset} ${durationInfo.css} ${easingInfo.css}`,
      };
    } else {
      const transition = presetConfig.properties
        .map(p => `${p} ${durationInfo.css} ${easingInfo.css}`)
        .join(', ');
      css = {
        transition,
        from: presetConfig.from,
        to: presetConfig.to,
      };
    }

    return {
      preset,
      type: presetConfig.type,
      essential,
      duration: durationInfo,
      easing: easingInfo,
      css,
      reducedMotion: essential ? null : this.generateReducedMotionCSS(preset, css),
    };
  }

  // ==========================================================================
  // REDUCED MOTION SUPPORT
  // ==========================================================================

  /**
   * Wrap CSS with prefers-reduced-motion support
   * @param {string} selector - CSS selector
   * @param {string} animationCSS - Animation CSS
   * @param {boolean} essential - Is this essential animation?
   * @returns {string} CSS with reduced-motion media query
   */
  wrapWithReducedMotion(selector, animationCSS, essential = false) {
    if (essential) {
      // Essential animations keep but simplify
      return `
${selector} {
  ${animationCSS}
}

@media (prefers-reduced-motion: reduce) {
  ${selector} {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}`;
    }

    // Non-essential: opt-in approach (PREFERRED per standards)
    return `
${selector} {
  /* Static styles by default */
}

@media (prefers-reduced-motion: no-preference) {
  ${selector} {
    ${animationCSS}
  }
}`;
  }

  /**
   * Generate reduced motion alternative
   */
  generateReducedMotionCSS(preset, originalCSS) {
    return `
@media (prefers-reduced-motion: reduce) {
  /* Animation '${preset}' disabled - instant state change */
  transition: none !important;
  animation: none !important;
}`;
  }

  /**
   * Check if an animation type is essential
   */
  isEssential(animationType) {
    return ESSENTIAL_ANIMATIONS.some(e => 
      animationType.toLowerCase().includes(e)
    );
  }

  // ==========================================================================
  // STAGGER GENERATION
  // ==========================================================================

  /**
   * Generate stagger delays for multiple elements
   * @param {number} count - Number of elements
   * @param {Object} options
   * @returns {Array} Array of delay values
   */
  generateStagger(count, options = {}) {
    const { 
      baseDelay = 0, 
      staggerDelay = 75,  // Middle of 50-100ms range
      maxDelay = 500,     // Cap total delay
    } = options;

    if (count > PERFORMANCE.maxSimultaneous) {
      this.addIssue('performance', 'warning',
        `Animating ${count} elements simultaneously exceeds recommended max of ${PERFORMANCE.maxSimultaneous}`,
        { suggestion: 'Consider animating fewer elements or using longer stagger delays' }
      );
    }

    const delays = [];
    for (let i = 0; i < count; i++) {
      const delay = Math.min(baseDelay + (i * staggerDelay), maxDelay);
      delays.push({
        index: i,
        delay,
        css: `${delay}ms`,
        cssVar: `calc(var(--stagger-base, 0ms) + ${i} * var(--stagger-delay, ${staggerDelay}ms))`,
      });
    }

    return {
      count,
      delays,
      totalDuration: delays[delays.length - 1]?.delay || 0,
      css: `--stagger-delay: ${staggerDelay}ms;`,
    };
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /**
   * Validate CSS for motion standards compliance
   * @param {string} css - CSS to validate
   * @returns {Object} Validation results
   */
  validate(css) {
    this.reset();

    // Check for prohibited easing
    PROHIBITED_EASING.forEach(pattern => {
      if (pattern.test(css)) {
        this.addIssue('easing', 'error',
          `Prohibited easing detected: ${pattern.source}`,
          {
            wcag: '2.3.3',
            suggestion: 'Use standard easing curves (ease-out, ease-in, ease-in-out)',
          }
        );
      }
    });

    // Check for prohibited properties being animated
    PROHIBITED_PROPERTIES.forEach(prop => {
      const regex = new RegExp(`(transition|animation)[^;]*\\b${prop}\\b`, 'i');
      if (regex.test(css)) {
        this.addIssue('performance', 'error',
          `Animating layout-triggering property: ${prop}`,
          {
            suggestion: `Use ${this.getAlternativeProperty(prop)} instead`,
          }
        );
      }
    });

    // Check for prefers-reduced-motion support
    const hasAnimations = /(animation|transition)/i.test(css);
    const hasReducedMotion = /@media\s*\(\s*prefers-reduced-motion/i.test(css);

    if (hasAnimations && !hasReducedMotion) {
      this.addIssue('accessibility', 'warning',
        'Animations without prefers-reduced-motion support',
        {
          wcag: '2.3.3',
          suggestion: 'Add @media (prefers-reduced-motion: reduce) query',
        }
      );
    }

    // Check for excessive duration
    const durationMatches = css.matchAll(/(?:animation-duration|transition-duration|transition)[^;]*?(\d+)(ms|s)/gi);
    for (const match of durationMatches) {
      let duration = parseInt(match[1]);
      if (match[2] === 's') duration *= 1000;
      
      if (duration > PERFORMANCE.maxDuration) {
        this.addIssue('performance', 'warning',
          `Animation duration ${duration}ms exceeds recommended max of ${PERFORMANCE.maxDuration}ms`,
          {
            suggestion: 'Keep UI animations under 1000ms',
          }
        );
      }
    }

    return {
      valid: this.issues.filter(i => i.severity === 'error').length === 0,
      issues: [...this.issues],
      summary: {
        errors: this.issues.filter(i => i.severity === 'error').length,
        warnings: this.issues.filter(i => i.severity === 'warning').length,
      },
    };
  }

  // ==========================================================================
  // FIX APPLICATION (from Orchestrator)
  // ==========================================================================

  /**
   * Apply a fix request routed from Orchestrator
   * @param {Object} fix - Fix request
   * @returns {Object} Fix result
   */
  applyFix(fix) {
    if (!fix || !fix.fix) {
      return createFixResult({
        requestId: fix?.id,
        success: false,
        error: 'Invalid fix request',
      });
    }

    const { action, property, newValue } = fix.fix;

    try {
      switch (action) {
        case 'update': {
          // Generate correct value based on property type
          let correctedValue;
          
          if (property === 'duration') {
            correctedValue = this.getDurationByCategory('normal');
          } else if (property === 'easing') {
            correctedValue = this.getEasing({ direction: 'move' });
          } else if (property === 'reduced') {
            correctedValue = {
              css: this.wrapWithReducedMotion('.selector', 'transition: opacity 250ms ease-out'),
            };
          }

          return createFixResult({
            requestId: fix.id,
            success: true,
            changes: {
              property,
              oldValue: fix.issue?.currentValue,
              newValue: newValue || correctedValue,
              generatedCSS: correctedValue?.css,
            },
            needsValidation: true,
          });
        }

        case 'addReducedMotion': {
          const wrappedCSS = this.wrapWithReducedMotion(
            fix.fix.selector || '.animated',
            fix.fix.animationCSS || 'transition: transform 250ms ease-out',
            fix.fix.essential || false
          );

          return createFixResult({
            requestId: fix.id,
            success: true,
            changes: {
              action: 'addReducedMotion',
              generatedCSS: wrappedCSS,
            },
            needsValidation: true,
          });
        }

        case 'replaceEasing': {
          const correctEasing = this.getEasing({ direction: fix.fix.direction || 'move' });
          
          return createFixResult({
            requestId: fix.id,
            success: true,
            changes: {
              from: fix.fix.currentEasing,
              to: correctEasing.easing,
              reason: correctEasing.reason,
            },
            needsValidation: true,
          });
        }

        case 'replaceDuration': {
          const correctDuration = this.getDuration(
            fix.fix.animationType || 'normal',
            { device: fix.fix.device || 'desktop' }
          );
          
          return createFixResult({
            requestId: fix.id,
            success: true,
            changes: {
              from: fix.fix.currentDuration,
              to: correctDuration.duration,
              css: correctDuration.css,
            },
            needsValidation: true,
          });
        }

        default:
          return createFixResult({
            requestId: fix.id,
            success: false,
            error: `Unknown fix action: ${action}`,
          });
      }
    } catch (err) {
      return createFixResult({
        requestId: fix.id,
        success: false,
        error: err.message,
      });
    }
  }

  // ==========================================================================
  // CSS GENERATION HELPERS
  // ==========================================================================

  /**
   * Generate CSS custom properties for motion tokens
   */
  generateCSSVariables() {
    return `
:root {
  /* Duration tokens */
  --motion-duration-instant: 0ms;
  --motion-duration-micro: 100ms;
  --motion-duration-fast: 150ms;
  --motion-duration-normal: 250ms;
  --motion-duration-slow: 400ms;
  --motion-duration-complex: 600ms;

  /* Easing tokens */
  --motion-easing-default: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-easing-enter: cubic-bezier(0, 0, 0.2, 1);
  --motion-easing-exit: cubic-bezier(0.4, 0, 1, 1);
  --motion-easing-linear: cubic-bezier(0, 0, 1, 1);

  /* Composite transitions */
  --motion-transition-micro: var(--motion-duration-micro) var(--motion-easing-default);
  --motion-transition-standard: var(--motion-duration-normal) var(--motion-easing-default);
  --motion-transition-enter: var(--motion-duration-normal) var(--motion-easing-enter);
  --motion-transition-exit: var(--motion-duration-fast) var(--motion-easing-exit);
  --motion-transition-page: var(--motion-duration-slow) var(--motion-easing-default);
}

/* Reduced motion - disable non-essential animations */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
`;
  }

  // ==========================================================================
  // AGENT REQUEST HANDLER
  // ==========================================================================

  /**
   * Handle requests from Orchestrator or other agents
   */
  handleRequest(request) {
    if (!request || !request.action) {
      return { success: false, error: 'Request must include an action' };
    }
    const { action } = request;

    try {
      switch (action) {
        case 'getDuration':
          return {
            success: true,
            data: this.getDuration(request.animationType, request.options),
          };

        case 'getEasing':
          return {
            success: true,
            data: this.getEasing(request.context),
          };

        case 'generateTransition':
          return {
            success: true,
            data: this.generateTransition(request.config),
          };

        case 'generatePreset':
          return {
            success: true,
            data: this.generatePreset(request.preset, request.options),
          };

        case 'generateStagger':
          return {
            success: true,
            data: this.generateStagger(request.count, request.options),
          };

        case 'wrapWithReducedMotion':
          return {
            success: true,
            data: this.wrapWithReducedMotion(
              request.selector,
              request.css,
              request.essential
            ),
          };

        case 'validate':
          return {
            success: true,
            data: this.validate(request.css),
          };

        case 'applyFix':
          return this.applyFix(request.fix);

        case 'generateCSSVariables':
          return {
            success: true,
            data: this.generateCSSVariables(),
          };

        case 'isEssential':
          return {
            success: true,
            data: this.isEssential(request.animationType),
          };

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

export function createMotionAgent(options = {}) {
  return new MotionAgent(options);
}

export default MotionAgent;
