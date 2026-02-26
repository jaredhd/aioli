/**
 * ♿ Accessibility Validator Agent
 * Part of the Aioli Design System
 * 
 * Responsibilities:
 * - Color contrast checking (WCAG AA/AAA)
 * - Semantic HTML validation
 * - ARIA usage auditing
 * - Keyboard navigation checking
 * - Reduced-motion compliance
 * - Integration with Design Token Agent
 * - SUGGEST FIXES (routed via Orchestrator to appropriate agents)
 */

import { DesignTokenAgent } from './design-token-agent.js';
import {
  AGENTS,
  createFixRequest,
  createContrastFixRequest,
  createSemanticFixRequest,
  createMotionFixRequest,
  groupFixesByAgent,
} from './agent-protocol.js';

// ============================================================================
// WCAG CONSTANTS
// ============================================================================

const WCAG_CONTRAST_RATIOS = {
  AA: {
    normalText: 4.5,
    largeText: 3.0,
    uiComponents: 3.0
  },
  AAA: {
    normalText: 7.0,
    largeText: 4.5,
    uiComponents: 4.5 // Not officially in AAA, but good practice
  }
};

// Large text: 18pt (24px) or 14pt (18.66px) bold
const LARGE_TEXT_THRESHOLD = {
  normal: 24,
  bold: 18.66
};

// ============================================================================
// SEMANTIC HTML RULES
// ============================================================================

const SEMANTIC_RULES = {
  // Elements that should have specific roles or children
  landmarks: ['header', 'nav', 'main', 'aside', 'footer', 'section', 'article'],
  
  // Interactive elements that need keyboard support
  interactive: ['button', 'a', 'input', 'select', 'textarea', 'details'],
  
  // Elements that should not be used (prefer semantic alternatives)
  deprecated: {
    'div[onclick]': 'Use <button> instead of div with onclick',
    'span[onclick]': 'Use <button> instead of span with onclick',
    'div[role="button"]': 'Use native <button> element',
    'a[href="#"]': 'Use <button> for actions, <a> for navigation',
    'table[role="presentation"]': 'Use CSS Grid or Flexbox for layout'
  },

  // Required attributes for elements
  requiredAttributes: {
    'img': ['alt'],
    'input': ['type'],
    'a': ['href'],
    'button': [], // type is optional but recommended
    'label': ['for'],
    'html': ['lang']
  },

  // Heading hierarchy
  headingLevels: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
};

// ============================================================================
// ARIA RULES
// ============================================================================

const ARIA_RULES = {
  // Roles that require specific attributes
  requiredAriaAttributes: {
    'checkbox': ['aria-checked'],
    'combobox': ['aria-expanded'],
    'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    'spinbutton': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    'scrollbar': ['aria-controls', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    'switch': ['aria-checked'],
    'tab': ['aria-selected'],
    'tabpanel': ['aria-labelledby'],
    'treeitem': ['aria-selected']
  },

  // Valid ARIA roles
  validRoles: [
    'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
    'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
    'contentinfo', 'definition', 'dialog', 'directory', 'document',
    'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
    'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
    'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
    'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
    'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
    'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
    'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
    'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
  ],

  // ARIA attributes that shouldn't be used on certain elements
  invalidCombinations: [
    { element: 'button', invalidAria: ['aria-label'], when: 'hasTextContent' },
    { element: 'a', invalidAria: ['aria-label'], when: 'hasTextContent' }
  ]
};

// ============================================================================
// MOTION RULES (from animation-motion-standards.md)
// ============================================================================

const MOTION_RULES = {
  // Maximum duration for UI animations
  maxDuration: 1000, // ms
  
  // Flash threshold (WCAG 2.3.1)
  maxFlashesPerSecond: 3,
  
  // Auto-play threshold requiring pause controls
  autoPlayThreshold: 5000, // 5 seconds
  
  // Prohibited easing patterns
  prohibitedEasing: [
    /bounce/i,
    /elastic/i,
    /spring/i
  ],
  
  // Properties that trigger layout (should not be animated)
  layoutTriggeringProperties: [
    'width', 'height', 'top', 'right', 'bottom', 'left',
    'margin', 'padding', 'border-width', 'font-size'
  ],
  
  // GPU-accelerated properties (safe to animate)
  gpuAcceleratedProperties: [
    'transform', 'opacity'
  ],

  // Essential animations (keep with reduced-motion)
  essentialAnimations: [
    'loading', 'spinner', 'progress', 'focus', 'validation'
  ]
};

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Parse a color string to RGB values
 * Supports: #hex, #hheexx, rgb(), rgba()
 */
function parseColor(color) {
  if (!color || typeof color !== 'string') return null;
  
  color = color.trim().toLowerCase();
  
  // Handle hex colors
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
  }
  
  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  
  return null;
}

/**
 * Calculate relative luminance (WCAG formula)
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(rgb) {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function getContrastRatio(color1, color2) {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  
  if (!rgb1 || !rgb2) return null;
  
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG criteria
 */
function meetsContrastRequirement(ratio, level, textType) {
  const requirement = WCAG_CONTRAST_RATIOS[level][textType];
  return ratio >= requirement;
}

// ============================================================================
// ACCESSIBILITY VALIDATOR AGENT CLASS
// ============================================================================

export class AccessibilityValidatorAgent {
  constructor(options = {}) {
    this.tokenAgent = options.tokenAgent || null;
    this.targetLevel = options.targetLevel || 'AA'; // 'AA' or 'AAA'
    this.issues = [];
  }

  /**
   * Connect to Design Token Agent
   */
  setTokenAgent(agent) {
    this.tokenAgent = agent;
  }

  /**
   * Clear issues for new validation run
   */
  reset() {
    this.issues = [];
  }

  /**
   * Add an issue
   */
  addIssue(type, severity, message, details = {}) {
    this.issues.push({
      type,
      severity, // 'error' | 'warning' | 'info'
      message,
      wcagCriteria: details.wcagCriteria || null,
      element: details.element || null,
      suggestion: details.suggestion || null,
      location: details.location || null
    });
  }

  // ==========================================================================
  // COLOR CONTRAST VALIDATION
  // ==========================================================================

  /**
   * Check contrast ratio between two colors
   * @param {string} foreground - Foreground color (text)
   * @param {string} background - Background color
   * @param {Object} options
   * @returns {Object} Validation result
   */
  checkContrast(foreground, background, options = {}) {
    const { 
      textType = 'normalText', // 'normalText' | 'largeText' | 'uiComponents'
      level = this.targetLevel,
      context = ''
    } = options;

    // Resolve token references if token agent is available
    if (this.tokenAgent) {
      if (foreground.startsWith('{')) {
        const token = this.tokenAgent.getToken(foreground.slice(1, -1));
        foreground = token?.resolvedValue || foreground;
      }
      if (background.startsWith('{')) {
        const token = this.tokenAgent.getToken(background.slice(1, -1));
        background = token?.resolvedValue || background;
      }
    }

    const ratio = getContrastRatio(foreground, background);
    
    if (ratio === null) {
      return {
        valid: false,
        error: 'Could not parse colors',
        foreground,
        background
      };
    }

    const passesAA = meetsContrastRequirement(ratio, 'AA', textType);
    const passesAAA = meetsContrastRequirement(ratio, 'AAA', textType);
    const required = WCAG_CONTRAST_RATIOS[level][textType];

    const result = {
      foreground,
      background,
      ratio: Math.round(ratio * 100) / 100,
      required,
      passesAA,
      passesAAA,
      passes: level === 'AAA' ? passesAAA : passesAA,
      textType,
      level
    };

    if (!result.passes) {
      this.addIssue('contrast', 'error', 
        `Insufficient contrast ratio: ${result.ratio}:1 (required: ${required}:1)`,
        {
          wcagCriteria: '1.4.3 Contrast (Minimum)',
          element: context,
          suggestion: `Increase contrast to at least ${required}:1`
        }
      );
    }

    return result;
  }

  /**
   * Validate all color token pairs in the design system
   */
  validateTokenContrast() {
    if (!this.tokenAgent) {
      this.addIssue('system', 'error', 'Token agent not connected');
      return [];
    }

    const results = [];

    // Get semantic color pairs to check
    const contrastPairs = [
      // Text on surfaces
      { fg: 'semantic.text.primary', bg: 'semantic.surface.default', context: 'Primary text on default surface' },
      { fg: 'semantic.text.secondary', bg: 'semantic.surface.default', context: 'Secondary text on default surface' },
      { fg: 'semantic.text.muted', bg: 'semantic.surface.default', context: 'Muted text on default surface' },
      
      // Interactive states
      { fg: 'component.button.primary.text', bg: 'component.button.primary.bg', context: 'Primary button' },
      { fg: 'component.button.secondary.text', bg: 'component.button.secondary.bg', context: 'Secondary button' },
      { fg: 'component.button.danger.text', bg: 'component.button.danger.bg', context: 'Danger button' },
      
      // Form elements
      { fg: 'component.input.text', bg: 'component.input.bg', context: 'Input text' },
      { fg: 'component.input.placeholder', bg: 'component.input.bg', context: 'Input placeholder' },
      
      // Alerts
      { fg: 'component.alert.info.text', bg: 'component.alert.info.bg', context: 'Info alert' },
      { fg: 'component.alert.success.text', bg: 'component.alert.success.bg', context: 'Success alert' },
      { fg: 'component.alert.warning.text', bg: 'component.alert.warning.bg', context: 'Warning alert' },
      { fg: 'component.alert.error.text', bg: 'component.alert.error.bg', context: 'Error alert' },
    ];

    for (const pair of contrastPairs) {
      const fgToken = this.tokenAgent.getToken(pair.fg);
      const bgToken = this.tokenAgent.getToken(pair.bg);

      if (fgToken && bgToken) {
        const result = this.checkContrast(
          fgToken.resolvedValue,
          bgToken.resolvedValue,
          { context: pair.context }
        );
        results.push({
          ...result,
          fgToken: pair.fg,
          bgToken: pair.bg,
          context: pair.context
        });
      }
    }

    return results;
  }

  // ==========================================================================
  // THEME CONTRAST VALIDATION
  // ==========================================================================

  /**
   * Composite an rgba() color onto a solid hex background.
   * @param {string} rgbaStr - 'rgba(r, g, b, a)' string
   * @param {string} bgHex - Solid hex background '#rrggbb'
   * @returns {string|null} Composited hex color
   */
  _compositeRgba(rgbaStr, bgHex) {
    const match = rgbaStr.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!match) return null;
    const [fr, fg, fb, alpha] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseFloat(match[4])];
    const bg = parseColor(bgHex);
    if (!bg) return null;
    const r = Math.round(fr * alpha + bg.r * (1 - alpha));
    const g = Math.round(fg * alpha + bg.g * (1 - alpha));
    const b = Math.round(fb * alpha + bg.b * (1 - alpha));
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }

  /**
   * Extract hex color stops from a CSS linear-gradient string.
   * @param {string} gradientStr
   * @returns {string[]} Array of hex colors
   */
  _extractGradientStops(gradientStr) {
    return (gradientStr.match(/#[0-9a-fA-F]{6}/g)) || [];
  }

  /**
   * Validate contrast ratios for a theme preset's overrides against base tokens.
   * @param {Record<string, string>} overrides - Token path → value overrides
   * @param {Object} [options]
   * @param {string} [options.level='AA'] - 'AA' or 'AAA'
   * @returns {{ valid: boolean, results: Array, failures: Array, summary: { total: number, pass: number, fail: number } }}
   */
  validateThemeContrast(overrides = {}, options = {}) {
    const level = options.level || 'AA';
    const results = [];
    const failures = [];

    if (!this.tokenAgent) {
      this.addIssue('system', 'error', 'Token agent not connected');
      return { valid: false, results, failures, summary: { total: 0, pass: 0, fail: 0 } };
    }

    // Resolve a color from overrides first, then token agent.
    // Handles kebab-case → camelCase mapping (preset overrides use kebab-case
    // like bg-hover, but DTCG tokens use camelCase like bgHover).
    const resolve = (path) => {
      if (overrides[path] !== undefined) return overrides[path];
      // Convert kebab-case to camelCase for DTCG lookup
      const dtcgPath = path.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (dtcgPath !== path && overrides[dtcgPath] !== undefined) return overrides[dtcgPath];
      const r = this.tokenAgent.handleRequest({ action: 'get', path: dtcgPath });
      if (r.success && r.data) {
        return r.data.resolvedValue || r.data.rawValue || r.data.$value || null;
      }
      return null;
    };

    // Get page background (needed for rgba compositing)
    const pageBg = resolve('semantic.surface.page.default') || '#ffffff';

    // Resolve a color, handling rgba compositing
    const resolveColor = (path) => {
      const val = resolve(path);
      if (!val) return null;
      if (val.startsWith('rgba')) return this._compositeRgba(val, pageBg);
      return val;
    };

    // Contrast pairs to check
    const textPairs = [
      { fg: 'semantic.text.default', bg: 'semantic.surface.page.default', label: 'Body text on page' },
      { fg: 'semantic.text.secondary', bg: 'semantic.surface.page.default', label: 'Secondary on page' },
      { fg: 'semantic.text.muted', bg: 'semantic.surface.page.default', label: 'Muted on page' },
      { fg: 'semantic.text.link', bg: 'semantic.surface.page.default', label: 'Link on page' },
      { fg: 'semantic.text.default', bg: 'semantic.surface.card.default', label: 'Body text on card' },
      { fg: 'semantic.text.muted', bg: 'semantic.surface.card.default', label: 'Muted on card' },
      { fg: 'semantic.color.primary.default', bg: 'semantic.surface.page.default', label: 'Primary on page' },
      { fg: 'semantic.color.success.default', bg: 'semantic.surface.page.default', label: 'Success on page' },
      { fg: 'semantic.color.danger.default', bg: 'semantic.surface.page.default', label: 'Danger on page' },
      { fg: 'component.button.primary.text', bg: 'component.button.primary.bg', label: 'Btn primary text/bg' },
      { fg: 'component.button.primary.text', bg: 'component.button.primary.bg-hover', label: 'Btn primary text/hover' },
      { fg: 'component.button.danger.text', bg: 'component.button.danger.bg', label: 'Btn danger text/bg' },
    ];

    // Check text contrast pairs (4.5:1 for AA text, 7.0:1 for AAA text)
    const threshold = level === 'AAA' ? 7.0 : 4.5;

    for (const pair of textPairs) {
      const fg = resolveColor(pair.fg);
      const bg = resolveColor(pair.bg);
      if (!fg || !bg) continue;

      const ratio = getContrastRatio(fg, bg);
      if (ratio === null) continue;

      const passes = ratio >= threshold;
      const result = { ...pair, fg, bg, ratio: Math.round(ratio * 100) / 100, passes, required: threshold };
      results.push(result);
      if (!passes) {
        failures.push(result);
        this.addIssue('contrast', 'error',
          `Theme contrast fail: ${pair.label} — ${ratio.toFixed(2)}:1 (need ${threshold}:1)`,
          { wcagCriteria: '1.4.3 Contrast (Minimum)', element: pair.label }
        );
      }
    }

    // Check gradient pairs (text color against all gradient stops + midpoint)
    const gradientPairs = [
      { text: 'component.button.primary.text', gradient: 'component.button.primary.gradient', label: 'Btn primary gradient' },
      { text: 'component.button.primary.text', gradient: 'component.button.primary.gradient-hover', label: 'Btn primary grad hover' },
      { text: 'component.button.danger.text', gradient: 'component.button.danger.gradient', label: 'Btn danger gradient' },
    ];

    for (const gp of gradientPairs) {
      const textColor = resolveColor(gp.text);
      const gradient = resolve(gp.gradient);
      if (!textColor || !gradient || gradient === 'none' || !gradient.includes('linear-gradient')) continue;

      const stops = this._extractGradientStops(gradient);
      if (stops.length < 2) continue;

      // Check each stop and the midpoint
      let worstRatio = Infinity;
      for (let i = 0; i < stops.length; i++) {
        const r = getContrastRatio(textColor, stops[i]);
        if (r !== null && r < worstRatio) worstRatio = r;
      }
      // Midpoint (linear interpolation in RGB)
      const mid = this._interpolateHex(stops[0], stops[stops.length - 1], 0.5);
      if (mid) {
        const r = getContrastRatio(textColor, mid);
        if (r !== null && r < worstRatio) worstRatio = r;
      }

      const passes = worstRatio >= threshold;
      const result = { ...gp, textColor, gradient, worstRatio: Math.round(worstRatio * 100) / 100, passes, required: threshold };
      results.push(result);
      if (!passes) {
        failures.push(result);
        this.addIssue('contrast', 'error',
          `Theme gradient contrast fail: ${gp.label} — worst ${worstRatio.toFixed(2)}:1 (need ${threshold}:1)`,
          { wcagCriteria: '1.4.3 Contrast (Minimum)', element: gp.label }
        );
      }
    }

    return {
      valid: failures.length === 0,
      results,
      failures,
      summary: { total: results.length, pass: results.length - failures.length, fail: failures.length }
    };
  }

  /**
   * Linearly interpolate between two hex colors.
   * @param {string} hex1
   * @param {string} hex2
   * @param {number} t - 0 to 1
   * @returns {string|null}
   */
  _interpolateHex(hex1, hex2, t) {
    const c1 = parseColor(hex1);
    const c2 = parseColor(hex2);
    if (!c1 || !c2) return null;
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }

  // ==========================================================================
  // HTML/JSX VALIDATION
  // ==========================================================================

  /**
   * Validate HTML/JSX code for accessibility issues
   * @param {string} code - HTML or JSX code
   * @param {string} [componentName] - Name of component being validated
   * @returns {Object} Validation result
   */
  validateHTML(code, componentName = 'Component') {
    this.reset();

    // Check for images without alt
    const imgWithoutAlt = code.match(/<img(?![^>]*\balt\b)[^>]*>/gi);
    if (imgWithoutAlt) {
      imgWithoutAlt.forEach(match => {
        this.addIssue('semantic', 'error', 
          'Image missing alt attribute',
          {
            wcagCriteria: '1.1.1 Non-text Content',
            element: match.slice(0, 50),
            suggestion: 'Add alt="" for decorative images or descriptive alt text for meaningful images'
          }
        );
      });
    }

    // Check for iframes without title
    const iframeWithoutTitle = code.match(/<iframe(?![^>]*\btitle\b)[^>]*>/gi);
    if (iframeWithoutTitle) {
      iframeWithoutTitle.forEach(match => {
        this.addIssue('semantic', 'error',
          'Iframe missing title attribute',
          {
            wcagCriteria: '4.1.2 Name, Role, Value',
            element: match.slice(0, 80),
            suggestion: 'Add title="Description of iframe content" to describe the embedded content'
          }
        );
      });
    }

    // Check for clickable divs/spans
    const clickableNonInteractive = code.match(/<(div|span)[^>]*on(Click|click)[^>]*>/gi);
    if (clickableNonInteractive) {
      clickableNonInteractive.forEach(match => {
        this.addIssue('semantic', 'error',
          'Click handler on non-interactive element',
          {
            wcagCriteria: '4.1.2 Name, Role, Value',
            element: match.slice(0, 50),
            suggestion: 'Use <button> for clickable elements, not div/span with onClick'
          }
        );
      });
    }

    // Check for buttons without type
    const buttonsWithoutType = code.match(/<button(?![^>]*\btype\b)[^>]*>/gi);
    if (buttonsWithoutType) {
      buttonsWithoutType.forEach(match => {
        this.addIssue('semantic', 'warning',
          'Button missing type attribute',
          {
            element: match.slice(0, 50),
            suggestion: 'Add type="button" or type="submit" to prevent form submission issues'
          }
        );
      });
    }

    // Check for form inputs without labels
    const inputsWithoutLabels = this.findInputsWithoutLabels(code);
    inputsWithoutLabels.forEach(input => {
      this.addIssue('semantic', 'error',
        'Form input missing associated label',
        {
          wcagCriteria: '1.3.1 Info and Relationships',
          element: input,
          suggestion: 'Add a <label> with htmlFor/for matching the input id, or use aria-label'
        }
      );
    });

    // Check for empty links
    const emptyLinks = code.match(/<a[^>]*>\s*<\/a>/gi);
    if (emptyLinks) {
      emptyLinks.forEach(match => {
        this.addIssue('semantic', 'error',
          'Link with no text content',
          {
            wcagCriteria: '2.4.4 Link Purpose',
            element: match,
            suggestion: 'Add descriptive text or aria-label to links'
          }
        );
      });
    }

    // Check for tabindex > 0
    const badTabindex = code.match(/tabindex=["']?[1-9]/gi);
    if (badTabindex) {
      this.addIssue('keyboard', 'warning',
        'Positive tabindex detected',
        {
          wcagCriteria: '2.4.3 Focus Order',
          suggestion: 'Avoid tabindex > 0. Use tabindex="0" or "-1" and rely on DOM order'
        }
      );
    }

    // Check for autofocus
    if (/autofocus/i.test(code)) {
      this.addIssue('keyboard', 'warning',
        'Autofocus attribute detected',
        {
          wcagCriteria: '3.2.1 On Focus',
          suggestion: 'Autofocus can disorient users. Consider removing or making it optional'
        }
      );
    }

    // Check heading hierarchy (simplified)
    const headings = code.match(/<h[1-6][^>]*>/gi) || [];
    const levels = headings.map(h => parseInt(h.match(/h([1-6])/i)[1]));
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i-1] > 1) {
        this.addIssue('semantic', 'warning',
          `Heading level skipped: h${levels[i-1]} to h${levels[i]}`,
          {
            wcagCriteria: '1.3.1 Info and Relationships',
            suggestion: 'Maintain sequential heading hierarchy (h1 → h2 → h3)'
          }
        );
      }
    }

    return {
      component: componentName,
      valid: !this.issues.some(i => i.severity === 'error'),
      issues: [...this.issues],
      stats: {
        errors: this.issues.filter(i => i.severity === 'error').length,
        warnings: this.issues.filter(i => i.severity === 'warning').length,
        info: this.issues.filter(i => i.severity === 'info').length
      }
    };
  }

  findInputsWithoutLabels(code) {
    const issues = [];
    // Simplified check - real implementation would parse properly
    const inputs = code.match(/<input[^>]*>/gi) || [];
    
    inputs.forEach(input => {
      const hasAriaLabel = /aria-label/i.test(input);
      const hasAriaLabelledBy = /aria-labelledby/i.test(input);
      const isHidden = /type=["']?hidden/i.test(input);
      
      if (!hasAriaLabel && !hasAriaLabelledBy && !isHidden) {
        // Check if there's an associated label (simplified)
        const idMatch = input.match(/id=["']([^"']+)["']/);
        if (idMatch) {
          const id = idMatch[1];
          const hasLabel = new RegExp(`(for|htmlFor)=["']${id}["']`, 'i').test(code);
          if (!hasLabel) {
            issues.push(input.slice(0, 60));
          }
        } else {
          issues.push(input.slice(0, 60));
        }
      }
    });
    
    return issues;
  }

  // ==========================================================================
  // ARIA VALIDATION
  // ==========================================================================

  /**
   * Validate ARIA usage in code
   */
  validateARIA(code) {
    const ariaIssues = [];

    // Check for invalid roles
    const roleMatches = code.match(/role=["']([^"']+)["']/gi) || [];
    roleMatches.forEach(match => {
      const role = match.match(/role=["']([^"']+)["']/i)[1];
      if (!ARIA_RULES.validRoles.includes(role)) {
        this.addIssue('aria', 'error',
          `Invalid ARIA role: "${role}"`,
          {
            wcagCriteria: '4.1.2 Name, Role, Value',
            element: match,
            suggestion: `Use a valid ARIA role from the specification`
          }
        );
      }
    });

    // Check required ARIA attributes for roles
    Object.entries(ARIA_RULES.requiredAriaAttributes).forEach(([role, requiredAttrs]) => {
      const roleRegex = new RegExp(`role=["']${role}["']`, 'gi');
      if (roleRegex.test(code)) {
        requiredAttrs.forEach(attr => {
          const attrRegex = new RegExp(attr, 'i');
          if (!attrRegex.test(code)) {
            this.addIssue('aria', 'error',
              `Role "${role}" missing required attribute: ${attr}`,
              {
                wcagCriteria: '4.1.2 Name, Role, Value',
                suggestion: `Add ${attr} to elements with role="${role}"`
              }
            );
          }
        });
      }
    });

    // Check for aria-hidden on focusable elements
    const ariaHiddenFocusable = code.match(/<(button|a|input)[^>]*aria-hidden=["']true["'][^>]*>/gi);
    if (ariaHiddenFocusable) {
      ariaHiddenFocusable.forEach(match => {
        this.addIssue('aria', 'error',
          'aria-hidden="true" on focusable element',
          {
            wcagCriteria: '4.1.2 Name, Role, Value',
            element: match.slice(0, 50),
            suggestion: 'Remove aria-hidden or add tabindex="-1" to prevent focus'
          }
        );
      });
    }

    return this.issues.filter(i => i.type === 'aria');
  }

  // ==========================================================================
  // MOTION/ANIMATION VALIDATION
  // ==========================================================================

  /**
   * Validate CSS for motion/animation accessibility
   * @param {string} css - CSS code to validate
   */
  validateMotion(css) {
    // Check for prefers-reduced-motion support
    const hasReducedMotionQuery = /@media\s*\(\s*prefers-reduced-motion/i.test(css);
    const hasAnimations = /(animation|transition)/i.test(css);

    if (hasAnimations && !hasReducedMotionQuery) {
      this.addIssue('motion', 'warning',
        'Animations detected without prefers-reduced-motion support',
        {
          wcagCriteria: '2.3.3 Animation from Interactions',
          suggestion: 'Add @media (prefers-reduced-motion: reduce) to disable non-essential animations'
        }
      );
    }

    // Check for prohibited easing functions
    MOTION_RULES.prohibitedEasing.forEach(pattern => {
      if (pattern.test(css)) {
        this.addIssue('motion', 'warning',
          `Prohibited easing function detected: ${pattern.source}`,
          {
            wcagCriteria: '2.3.3 Animation from Interactions',
            suggestion: 'Avoid bounce/elastic/spring effects which can trigger vestibular issues'
          }
        );
      }
    });

    // Check for animations on layout-triggering properties
    MOTION_RULES.layoutTriggeringProperties.forEach(prop => {
      const regex = new RegExp(`(transition|animation)[^;]*${prop}`, 'i');
      if (regex.test(css)) {
        this.addIssue('motion', 'warning',
          `Animating layout property: ${prop}`,
          {
            suggestion: `Animate transform/opacity instead of ${prop} for better performance`
          }
        );
      }
    });

    // Check duration values
    const durationMatches = css.match(/(\d+(?:\.\d+)?)(ms|s)/gi) || [];
    durationMatches.forEach(match => {
      const value = parseFloat(match);
      const unit = match.replace(/[\d.]/g, '');
      const ms = unit === 's' ? value * 1000 : value;
      
      if (ms > MOTION_RULES.maxDuration) {
        this.addIssue('motion', 'warning',
          `Animation duration ${ms}ms exceeds recommended maximum (${MOTION_RULES.maxDuration}ms)`,
          {
            suggestion: 'Keep UI animations under 1000ms for better user experience'
          }
        );
      }
    });

    return this.issues.filter(i => i.type === 'motion');
  }

  // ==========================================================================
  // FULL COMPONENT VALIDATION
  // ==========================================================================

  /**
   * Run all validations on a component
   * @param {Object} component
   * @param {string} component.name - Component name
   * @param {string} component.html - HTML/JSX code
   * @param {string} [component.css] - CSS code
   * @returns {Object} Full validation report
   */
  validateComponent(component) {
    this.reset();

    const { name, html, css } = component;

    // Run all validations
    this.validateHTML(html, name);
    this.validateARIA(html);
    if (css) {
      this.validateMotion(css);
    }

    return this.generateReport(name);
  }

  /**
   * Generate a validation report
   */
  generateReport(componentName = 'Component') {
    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const info = this.issues.filter(i => i.severity === 'info');

    const wcagCriteria = [...new Set(this.issues.map(i => i.wcagCriteria).filter(Boolean))];

    return {
      component: componentName,
      timestamp: new Date().toISOString(),
      targetLevel: this.targetLevel,
      valid: errors.length === 0,
      summary: {
        total: this.issues.length,
        errors: errors.length,
        warnings: warnings.length,
        info: info.length
      },
      wcagCriteriaAffected: wcagCriteria,
      issues: {
        errors,
        warnings,
        info
      },
      allIssues: [...this.issues]
    };
  }

  // ==========================================================================
  // FIX SUGGESTION SYSTEM
  // ==========================================================================

  /**
   * Generate fix requests for all current issues
   * @returns {Array<FixRequest>} Array of fix requests that can be routed to agents
   */
  suggestFixes() {
    const fixes = this.issues
      .map(issue => this.suggestFixForIssue(issue))
      .filter(Boolean);
    
    return {
      fixes,
      byAgent: groupFixesByAgent(fixes),
      summary: {
        total: fixes.length,
        autoFixable: fixes.filter(f => f.autoFixable).length,
        needsReview: fixes.filter(f => !f.autoFixable).length,
      }
    };
  }

  /**
   * Generate a fix request for a specific issue
   * @param {Object} issue
   * @returns {FixRequest|null}
   */
  suggestFixForIssue(issue) {
    switch (issue.type) {
      case 'contrast':
        return this._createContrastFix(issue);
      case 'semantic':
        return this._createSemanticFix(issue);
      case 'aria':
        return this._createAriaFix(issue);
      case 'motion':
        return this._createMotionFix(issue);
      default:
        return null;
    }
  }

  /**
   * Create fix for contrast issues → Token Agent
   */
  _createContrastFix(issue) {
    const { context } = issue;
    
    if (!context?.fg || !context?.bg) {
      return createFixRequest({
        type: 'manual.review',
        severity: 'error',
        source: AGENTS.A11Y,
        issue: { message: issue.message },
        fix: { action: 'review' },
        description: 'Contrast issue needs manual review - token paths not found',
        autoFixable: false,
      });
    }

    const targetRatio = context.required || 4.5;
    const suggestedColor = this._findAccessibleColor(context.bg, context.fg, targetRatio);

    return createContrastFixRequest({
      tokenPath: context.fgToken || 'unknown',
      currentValue: context.fg,
      suggestedValue: suggestedColor || 'needs-calculation',
      currentRatio: context.ratio,
      requiredRatio: targetRatio,
      context: context.context || issue.message,
    });
  }

  /**
   * Create fix for semantic HTML issues → Component Generator
   */
  _createSemanticFix(issue) {
    const message = issue.message.toLowerCase();

    // Image missing alt
    if (message.includes('image') && message.includes('alt')) {
      return createSemanticFixRequest({
        element: 'img',
        issue: 'Image missing alt attribute',
        fixAction: 'addAttribute',
        fixParams: { attribute: 'alt', value: '' },
      });
    }

    // Click handler on non-interactive element
    if (message.includes('click handler') && message.includes('non-interactive')) {
      return createSemanticFixRequest({
        element: issue.element || 'div',
        issue: 'Click handler on non-interactive element',
        fixAction: 'replaceElement',
        fixParams: { from: 'div', to: 'button' },
      });
    }

    // Input missing label
    if (message.includes('input') && message.includes('label')) {
      return createSemanticFixRequest({
        element: 'input',
        issue: 'Form input missing associated label',
        fixAction: 'addLabel',
        fixParams: { type: 'aria-label' },
      });
    }

    // Empty link
    if (message.includes('link') && message.includes('no text')) {
      return createSemanticFixRequest({
        element: 'a',
        issue: 'Link with no accessible text',
        fixAction: 'addAttribute',
        fixParams: { attribute: 'aria-label', value: '' },
      });
    }

    // Heading skip
    if (message.includes('heading level skipped')) {
      return createSemanticFixRequest({
        element: 'heading',
        issue: issue.message,
        fixAction: 'manual',
        fixParams: { suggestion: 'Maintain sequential heading hierarchy' },
      });
    }

    // Fallback
    return createFixRequest({
      type: 'manual.review',
      severity: 'warning',
      source: AGENTS.A11Y,
      issue: { message: issue.message, element: issue.element },
      fix: { action: 'review', suggestion: issue.suggestion },
      description: issue.message,
      autoFixable: false,
    });
  }

  /**
   * Create fix for ARIA issues → Component Generator
   */
  _createAriaFix(issue) {
    const message = issue.message.toLowerCase();

    // Missing required ARIA attribute
    if (message.includes('missing required attribute')) {
      const attrMatch = issue.message.match(/attribute:\s*(\S+)/);
      const roleMatch = issue.message.match(/role\s*"([^"]+)"/i);
      
      return createSemanticFixRequest({
        element: issue.element || 'element',
        issue: issue.message,
        fixAction: 'addAttribute',
        fixParams: {
          attribute: attrMatch?.[1],
          role: roleMatch?.[1],
        },
      });
    }

    // Invalid role
    if (message.includes('invalid aria role')) {
      return createSemanticFixRequest({
        element: issue.element,
        issue: 'Invalid ARIA role',
        fixAction: 'replaceAttribute',
        fixParams: { attribute: 'role', validRoles: ['button', 'link', 'checkbox'] },
      });
    }

    // aria-hidden on focusable
    if (message.includes('aria-hidden') && message.includes('focusable')) {
      return createSemanticFixRequest({
        element: issue.element,
        issue: 'aria-hidden on focusable element',
        fixAction: 'removeAttribute',
        fixParams: { attribute: 'aria-hidden' },
      });
    }

    return null;
  }

  /**
   * Create fix for motion/animation issues → Motion Agent
   */
  _createMotionFix(issue) {
    const message = issue.message.toLowerCase();

    // Missing prefers-reduced-motion
    if (message.includes('prefers-reduced-motion')) {
      return createMotionFixRequest({
        property: 'reduced',
        currentValue: 'missing',
        suggestedValue: '@media (prefers-reduced-motion: reduce)',
        reason: 'Add reduced-motion media query',
      });
    }

    // Prohibited easing
    if (message.includes('prohibited easing')) {
      const easingMatch = message.match(/detected:\s*(\w+)/);
      return createMotionFixRequest({
        property: 'easing',
        currentValue: easingMatch?.[1] || 'bounce/elastic',
        suggestedValue: 'ease-out',
        reason: 'Replace with standard easing to avoid vestibular triggers',
      });
    }

    // Layout property animation
    if (message.includes('animating layout property')) {
      const propMatch = message.match(/property:\s*(\w+)/);
      return createMotionFixRequest({
        property: 'duration',
        currentValue: propMatch?.[1],
        suggestedValue: 'transform',
        reason: 'Use GPU-accelerated property instead',
      });
    }

    // Duration too long
    if (message.includes('duration') && message.includes('exceeds')) {
      return createMotionFixRequest({
        property: 'duration',
        currentValue: 'over 1000ms',
        suggestedValue: '1000ms',
        reason: 'Keep UI animations under 1000ms',
      });
    }

    return null;
  }

  /**
   * Find an accessible color alternative (darken or lighten)
   */
  _findAccessibleColor(background, foreground, targetRatio = 4.5) {
    const bgRgb = parseColor(background);
    const fgRgb = parseColor(foreground);
    
    if (!bgRgb || !fgRgb) return null;

    const bgLuminance = getRelativeLuminance(bgRgb);
    
    // If background is light, darken foreground; if dark, lighten it
    const factor = bgLuminance > 0.5 ? 0.6 : 1.4;
    
    const newRgb = {
      r: Math.min(255, Math.max(0, Math.round(fgRgb.r * factor))),
      g: Math.min(255, Math.max(0, Math.round(fgRgb.g * factor))),
      b: Math.min(255, Math.max(0, Math.round(fgRgb.b * factor))),
    };
    
    const hex = (n) => n.toString(16).padStart(2, '0');
    return `#${hex(newRgb.r)}${hex(newRgb.g)}${hex(newRgb.b)}`;
  }

  // ==========================================================================
  // AGENT REQUEST HANDLER
  // ==========================================================================

  /**
   * Handle requests from other agents
   */
  handleRequest(request) {
    if (!request || !request.action) {
      return { success: false, error: 'Request must include an action' };
    }
    const { action } = request;

    try {
      switch (action) {
        case 'checkContrast':
          return {
            success: true,
            data: this.checkContrast(request.foreground, request.background, request.options)
          };

        case 'validateHTML':
          return {
            success: true,
            data: this.validateHTML(request.code, request.componentName)
          };

        case 'validateARIA':
          this.reset();
          return {
            success: true,
            data: this.validateARIA(request.code)
          };

        case 'validateMotion':
          this.reset();
          return {
            success: true,
            data: this.validateMotion(request.css)
          };

        case 'validateComponent':
          return {
            success: true,
            data: this.validateComponent(request.component)
          };

        case 'validateTokenContrast':
          this.reset();
          return {
            success: true,
            data: this.validateTokenContrast()
          };

        case 'validateThemeContrast':
          this.reset();
          return {
            success: true,
            data: this.validateThemeContrast(request.overrides, { level: request.level })
          };

        case 'getReport':
          return {
            success: true,
            data: this.generateReport(request.componentName)
          };

        case 'suggestFixes':
          return {
            success: true,
            data: this.suggestFixes()
          };

        case 'suggestFixForIssue':
          return {
            success: true,
            data: this.suggestFixForIssue(request.issue)
          };

        case 'getIssuesWithFixes':
          // Returns issues paired with their fix recommendations
          return {
            success: true,
            data: this.issues.map(issue => ({
              issue,
              fix: this.suggestFixForIssue(issue)
            }))
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
// UTILITY EXPORTS
// ============================================================================

export { 
  getContrastRatio, 
  parseColor, 
  getRelativeLuminance,
  WCAG_CONTRAST_RATIOS,
  MOTION_RULES
};

export function createAccessibilityValidator(options) {
  return new AccessibilityValidatorAgent(options);
}

export default AccessibilityValidatorAgent;
