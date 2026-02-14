#!/usr/bin/env node

/**
 * ✨ MOTION AGENT TEST
 * 
 * Tests all Motion Agent capabilities:
 * - Duration generation by animation type
 * - Easing curve selection
 * - Transition generation
 * - Animation presets
 * - Stagger calculations
 * - CSS validation
 * - Reduced motion support
 * 
 * Run: node agents/test-motion-agent.js
 */

import { MotionAgent, DURATION, EASING, ANIMATION_TYPES } from './motion-agent.js';

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${c.green}✓${c.reset} ${name}`);
    passed++;
  } catch (err) {
    console.log(`${c.red}✗${c.reset} ${name}`);
    console.log(`  ${c.dim}${err.message}${c.reset}`);
    failed++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

function assertInRange(value, min, max, message = '') {
  if (value < min || value > max) {
    throw new Error(`Expected ${value} to be between ${min} and ${max}. ${message}`);
  }
}

function header(text) {
  console.log(`\n${c.bright}${c.cyan}━━━ ${text} ━━━${c.reset}\n`);
}

// ============================================================================
// TESTS
// ============================================================================

console.log(`
${c.bright}${c.magenta}
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ✨  MOTION AGENT TEST SUITE                                     ║
║                                                                   ║
║   Testing duration, easing, transitions, presets, validation      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
${c.reset}`);

const agent = new MotionAgent();

// --------------------------------------------------------------------------
header('Duration Generation');
// --------------------------------------------------------------------------

test('getDuration returns correct category for modal-open', () => {
  const result = agent.getDuration('modal-open');
  assertEqual(result.category, 'slow');
});

test('getDuration returns desktop-adjusted duration', () => {
  const result = agent.getDuration('dropdown-open', { device: 'desktop' });
  // Normal category: 200-300ms, desktop multiplier 0.67 → ~134-201ms
  assertInRange(result.duration, 130, 210);
});

test('getDuration returns mobile base duration', () => {
  const result = agent.getDuration('dropdown-open', { device: 'mobile' });
  // Normal category: 200-300ms default 250ms, mobile multiplier 1.0
  assertInRange(result.duration, 200, 300);
});

test('getDuration exit animations are faster', () => {
  const enter = agent.getDuration('modal-open', { isExit: false });
  const exit = agent.getDuration('modal-open', { isExit: true });
  if (exit.duration >= enter.duration) {
    throw new Error(`Exit (${exit.duration}ms) should be faster than enter (${enter.duration}ms)`);
  }
});

test('getDuration returns CSS-ready value', () => {
  const result = agent.getDuration('button-hover');
  if (!result.css.endsWith('ms')) {
    throw new Error(`Expected CSS value ending in 'ms', got ${result.css}`);
  }
});

test('getDurationByCategory works for all categories', () => {
  Object.keys(DURATION).forEach(category => {
    const result = agent.getDurationByCategory(category);
    if (!result || typeof result.duration !== 'number') {
      throw new Error(`Failed for category: ${category}`);
    }
  });
});

// --------------------------------------------------------------------------
header('Easing Selection');
// --------------------------------------------------------------------------

test('getEasing returns ease-out for enter', () => {
  const result = agent.getEasing({ direction: 'enter' });
  assertEqual(result.name, 'ease-out');
});

test('getEasing returns ease-in for permanent exit', () => {
  const result = agent.getEasing({ direction: 'exit', mayReturn: false });
  assertEqual(result.name, 'ease-in');
});

test('getEasing returns ease-in-out for exit that may return', () => {
  const result = agent.getEasing({ direction: 'exit', mayReturn: true });
  assertEqual(result.name, 'ease-in-out');
});

test('getEasing returns linear for color changes', () => {
  const result = agent.getEasing({ direction: 'color' });
  assertEqual(result.name, 'linear');
});

test('getEasing returns ease-in-out for movement', () => {
  const result = agent.getEasing({ direction: 'move' });
  assertEqual(result.name, 'ease-in-out');
});

test('getEasing includes reason for each curve', () => {
  const result = agent.getEasing({ direction: 'enter' });
  if (!result.reason || result.reason.length < 10) {
    throw new Error('Expected meaningful reason for easing choice');
  }
});

// --------------------------------------------------------------------------
header('Transition Generation');
// --------------------------------------------------------------------------

test('generateTransition creates valid CSS', () => {
  const result = agent.generateTransition({
    property: 'transform',
    animationType: 'button-hover',
    direction: 'enter',
  });
  if (!result.css.includes('transform')) {
    throw new Error(`Expected 'transform' in CSS: ${result.css}`);
  }
});

test('generateTransition rejects prohibited properties', () => {
  const result = agent.generateTransition({
    property: 'width',
    animationType: 'normal',
  });
  assertEqual(result.error, true);
});

test('generateTransition suggests alternatives for prohibited properties', () => {
  const result = agent.generateTransition({ property: 'left' });
  if (!result.alternatives || !result.alternatives.includes('translateX')) {
    throw new Error('Expected translateX suggestion for left');
  }
});

test('generateTransition allows opacity', () => {
  const result = agent.generateTransition({
    property: 'opacity',
    direction: 'enter',
  });
  assertEqual(result.isAllowed, true);
});

// --------------------------------------------------------------------------
header('Animation Presets');
// --------------------------------------------------------------------------

test('generatePreset creates fade-in animation', () => {
  const result = agent.generatePreset('fade-in');
  if (result.error) throw new Error(result.message);
  if (!result.css.transition) {
    throw new Error('Expected transition CSS');
  }
});

test('generatePreset creates modal-enter animation', () => {
  const result = agent.generatePreset('modal-enter');
  if (result.error) throw new Error(result.message);
  assertEqual(result.type, 'enter');
});

test('generatePreset includes reduced motion alternative', () => {
  const result = agent.generatePreset('slide-in-right', { essential: false });
  if (!result.reducedMotion) {
    throw new Error('Expected reduced motion CSS');
  }
});

test('generatePreset handles keyframe animations', () => {
  const result = agent.generatePreset('shake');
  if (!result.css.keyframes) {
    throw new Error('Expected keyframes for shake animation');
  }
});

// --------------------------------------------------------------------------
header('Stagger Generation');
// --------------------------------------------------------------------------

test('generateStagger creates correct number of delays', () => {
  const result = agent.generateStagger(5);
  assertEqual(result.delays.length, 5);
});

test('generateStagger delays increase incrementally', () => {
  const result = agent.generateStagger(3, { staggerDelay: 100 });
  assertEqual(result.delays[0].delay, 0);
  assertEqual(result.delays[1].delay, 100);
  assertEqual(result.delays[2].delay, 200);
});

test('generateStagger respects max delay', () => {
  const result = agent.generateStagger(100, { staggerDelay: 100, maxDelay: 500 });
  const lastDelay = result.delays[result.delays.length - 1].delay;
  if (lastDelay > 500) {
    throw new Error(`Last delay ${lastDelay}ms exceeds max 500ms`);
  }
});

test('generateStagger warns for too many simultaneous elements', () => {
  agent.reset();
  agent.generateStagger(10);
  const hasWarning = agent.issues.some(i => i.type === 'performance');
  if (!hasWarning) {
    throw new Error('Expected performance warning for 10 elements');
  }
});

// --------------------------------------------------------------------------
header('CSS Validation');
// --------------------------------------------------------------------------

test('validate detects prohibited easing', () => {
  const result = agent.validate(`
    .element {
      transition: transform 300ms bounce;
    }
  `);
  const hasError = result.issues.some(i => i.type === 'easing');
  if (!hasError) {
    throw new Error('Expected easing error for bounce');
  }
});

test('validate detects prohibited properties', () => {
  const result = agent.validate(`
    .element {
      transition: width 300ms ease-out;
    }
  `);
  const hasError = result.issues.some(i => i.type === 'performance');
  if (!hasError) {
    throw new Error('Expected performance error for width animation');
  }
});

test('validate warns about missing prefers-reduced-motion', () => {
  const result = agent.validate(`
    .element {
      transition: transform 300ms ease-out;
    }
  `);
  const hasWarning = result.issues.some(i => 
    i.type === 'accessibility' && i.message.includes('prefers-reduced-motion')
  );
  if (!hasWarning) {
    throw new Error('Expected accessibility warning');
  }
});

test('validate passes valid CSS with reduced motion', () => {
  const result = agent.validate(`
    .element {
      transition: transform 300ms ease-out;
    }
    @media (prefers-reduced-motion: reduce) {
      .element { transition: none; }
    }
  `);
  assertEqual(result.valid, true);
});

test('validate warns about excessive duration', () => {
  const result = agent.validate(`
    .element {
      transition-duration: 2000ms;
    }
  `);
  const hasWarning = result.issues.some(i => 
    i.message.includes('exceeds')
  );
  if (!hasWarning) {
    throw new Error('Expected warning for 2000ms duration');
  }
});

// --------------------------------------------------------------------------
header('Reduced Motion Support');
// --------------------------------------------------------------------------

test('wrapWithReducedMotion creates opt-in pattern for non-essential', () => {
  const result = agent.wrapWithReducedMotion(
    '.card',
    'transition: transform 200ms ease-out',
    false
  );
  if (!result.includes('no-preference')) {
    throw new Error('Expected opt-in pattern with no-preference');
  }
});

test('wrapWithReducedMotion keeps essential animations', () => {
  const result = agent.wrapWithReducedMotion(
    '.spinner',
    'animation: spin 1s linear infinite',
    true
  );
  if (!result.includes('transition-duration: 0.01ms')) {
    throw new Error('Expected simplified essential animation');
  }
});

test('isEssential identifies loading animations', () => {
  const result = agent.isEssential('loading-spinner');
  assertEqual(result, true);
});

test('isEssential identifies non-essential animations', () => {
  const result = agent.isEssential('hover-effect');
  assertEqual(result, false);
});

// --------------------------------------------------------------------------
header('CSS Variables Generation');
// --------------------------------------------------------------------------

test('generateCSSVariables includes all duration tokens', () => {
  const result = agent.generateCSSVariables();
  Object.keys(DURATION).forEach(category => {
    if (!result.includes(`--motion-duration-${category}`)) {
      throw new Error(`Missing duration token: ${category}`);
    }
  });
});

test('generateCSSVariables includes easing tokens', () => {
  const result = agent.generateCSSVariables();
  ['default', 'enter', 'exit', 'linear'].forEach(curve => {
    if (!result.includes(`--motion-easing-${curve}`)) {
      throw new Error(`Missing easing token: ${curve}`);
    }
  });
});

test('generateCSSVariables includes reduced motion query', () => {
  const result = agent.generateCSSVariables();
  if (!result.includes('prefers-reduced-motion: reduce')) {
    throw new Error('Missing reduced motion media query');
  }
});

// --------------------------------------------------------------------------
header('Agent Request Handler');
// --------------------------------------------------------------------------

test('handleRequest routes getDuration correctly', () => {
  const result = agent.handleRequest({
    action: 'getDuration',
    animationType: 'modal-open',
    options: { device: 'desktop' },
  });
  assertEqual(result.success, true);
  assertEqual(result.data.category, 'slow');
});

test('handleRequest routes validate correctly', () => {
  const result = agent.handleRequest({
    action: 'validate',
    css: '.x { transition: opacity 200ms ease-out; }',
  });
  assertEqual(result.success, true);
});

test('handleRequest returns error for unknown action', () => {
  const result = agent.handleRequest({ action: 'unknownAction' });
  assertEqual(result.success, false);
});

// --------------------------------------------------------------------------
header('Fix Application');
// --------------------------------------------------------------------------

test('applyFix handles duration fixes', () => {
  const result = agent.applyFix({
    id: 'fix-123',
    fix: {
      action: 'replaceDuration',
      currentDuration: 2000,
      animationType: 'normal',
    },
  });
  assertEqual(result.success, true);
  if (result.changes.to > 1000) {
    throw new Error('Fixed duration should be under 1000ms');
  }
});

test('applyFix handles easing fixes', () => {
  const result = agent.applyFix({
    id: 'fix-456',
    fix: {
      action: 'replaceEasing',
      currentEasing: 'bounce',
      direction: 'enter',
    },
  });
  assertEqual(result.success, true);
  if (!result.changes.to.includes('cubic-bezier')) {
    throw new Error('Expected cubic-bezier easing');
  }
});

test('applyFix handles addReducedMotion', () => {
  const result = agent.applyFix({
    id: 'fix-789',
    fix: {
      action: 'addReducedMotion',
      selector: '.animated',
      animationCSS: 'transition: opacity 200ms',
      essential: false,
    },
  });
  assertEqual(result.success, true);
  if (!result.changes.generatedCSS.includes('prefers-reduced-motion')) {
    throw new Error('Expected reduced motion in generated CSS');
  }
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log(`
${c.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}

${c.bright}Results:${c.reset} ${c.green}${passed} passed${c.reset}, ${failed > 0 ? c.red : c.dim}${failed} failed${c.reset}

${passed > 0 && failed === 0 ? `${c.green}${c.bright}✨ All tests passed!${c.reset}` : ''}
`);

// Demo output
console.log(`${c.bright}${c.cyan}━━━ Demo Output ━━━${c.reset}\n`);

console.log(`${c.bright}Duration for modal-open (desktop):${c.reset}`);
const modalDuration = agent.getDuration('modal-open', { device: 'desktop' });
console.log(`  ${modalDuration.css} (${modalDuration.category})\n`);

console.log(`${c.bright}Easing for element entering:${c.reset}`);
const enterEasing = agent.getEasing({ direction: 'enter' });
console.log(`  ${enterEasing.name}: ${enterEasing.easing}`);
console.log(`  ${c.dim}${enterEasing.reason}${c.reset}\n`);

console.log(`${c.bright}Generated transition:${c.reset}`);
const transition = agent.generateTransition({
  property: 'transform',
  animationType: 'dropdown-open',
  direction: 'enter',
});
console.log(`  ${transition.css}\n`);

console.log(`${c.bright}Preset: slide-in-right${c.reset}`);
const preset = agent.generatePreset('slide-in-right');
console.log(`  transition: ${preset.css.transition}`);
console.log(`  from: ${JSON.stringify(preset.css.from)}`);
console.log(`  to: ${JSON.stringify(preset.css.to)}\n`);

process.exit(failed > 0 ? 1 : 0);
