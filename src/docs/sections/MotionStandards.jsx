import React, { useState } from 'react';
import CodeBlock from '../components/CodeBlock';

// ---------------------------------------------------------------------------
// EasingDemo -- Interactive easing and duration demo
// ---------------------------------------------------------------------------

function EasingDemo() {
  const [duration, setDuration] = useState('normal');
  const [easing, setEasing] = useState('default');
  const [playing, setPlaying] = useState(false);

  const durations = {
    instant: '0ms',
    micro: '100ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
  };

  const easings = {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    linear: 'cubic-bezier(0, 0, 1, 1)',
  };

  const handlePlay = () => {
    setPlaying(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPlaying(true));
    });
  };

  const boxStyle = {
    transition: `transform ${durations[duration]} ${easings[easing]}`,
    transform: playing ? 'translateX(300px)' : 'translateX(0)',
  };

  return (
    <div className="docs-motion-demo">
      <div className="docs-motion-demo__controls">
        <label>
          Duration:{' '}
          <select value={duration} onChange={(e) => setDuration(e.target.value)}>
            {Object.keys(durations).map((d) => (
              <option key={d} value={d}>
                {d} ({durations[d]})
              </option>
            ))}
          </select>
        </label>
        <label>
          Easing:{' '}
          <select value={easing} onChange={(e) => setEasing(e.target.value)}>
            {Object.keys(easings).map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handlePlay} className="btn btn--primary btn--sm">
          <span className="btn__text">Play</span>
        </button>
      </div>
      <div className="docs-motion-demo__track">
        <div className="docs-motion-demo__box" style={boxStyle} />
      </div>
      <p
        className="docs-section__text"
        style={{ marginTop: '8px', fontSize: '0.875rem', opacity: 0.7 }}
      >
        transition: transform {durations[duration]} {easings[easing]}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MotionStandards section
// ---------------------------------------------------------------------------

export default function MotionStandards() {
  return (
    <section id="motion" className="docs-section">
      <h2 className="docs-section__title">Motion Standards</h2>

      <p className="docs-section__text">
        Reference document for the Motion/Animation Agent and Code Review Agent.
        These standards govern animation validation, generation, and enforcement
        across all Aioli components.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Duration Standards                                                 */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Duration Standards</h3>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Duration</th>
            <th>Use Cases</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>instant</code></td>
            <td>0ms</td>
            <td>No animation needed</td>
          </tr>
          <tr>
            <td><code>micro</code></td>
            <td>50&ndash;100ms</td>
            <td>Hover states, focus rings, tooltips appearing</td>
          </tr>
          <tr>
            <td><code>fast</code></td>
            <td>100&ndash;150ms</td>
            <td>Button press feedback, toggle switches, checkboxes</td>
          </tr>
          <tr>
            <td><code>normal</code></td>
            <td>200&ndash;300ms</td>
            <td>Dropdowns, accordions, tab switches, menu toggles</td>
          </tr>
          <tr>
            <td><code>slow</code></td>
            <td>300&ndash;500ms</td>
            <td>Modals, page transitions, slide-in panels</td>
          </tr>
          <tr>
            <td><code>complex</code></td>
            <td>500&ndash;700ms</td>
            <td>Multi-step sequences, data visualizations</td>
          </tr>
        </tbody>
      </table>

      <p className="docs-section__text"><strong>Key Principles:</strong></p>
      <ul className="docs-section__list">
        <li>Users should never wait for animations to complete before taking action</li>
        <li>Keep most UI transitions under 400ms</li>
        <li>Elements exiting can be faster (less attention needed)</li>
        <li>Elements entering should be slightly slower (draw attention)</li>
        <li>Appearance duration &gt; disappearance duration</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* Easing Curves                                                      */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Easing Curves</h3>
      <CodeBlock
        language="json"
        title="Standard easing design tokens"
        code={`{
  "easing": {
    "default": "cubic-bezier(0.4, 0, 0.2, 1)",
    "enter": "cubic-bezier(0, 0, 0.2, 1)",
    "exit": "cubic-bezier(0.4, 0, 1, 1)",
    "linear": "cubic-bezier(0, 0, 1, 1)"
  }
}`}
      />

      <table className="docs-table">
        <thead>
          <tr>
            <th>Curve</th>
            <th>CSS Name</th>
            <th>Bezier</th>
            <th>Use When</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Ease Out (Decelerate)</strong></td>
            <td><code>ease-out</code></td>
            <td><code>(0, 0, 0.2, 1)</code></td>
            <td>Elements entering screen, user-initiated actions</td>
          </tr>
          <tr>
            <td><strong>Ease In (Accelerate)</strong></td>
            <td><code>ease-in</code></td>
            <td><code>(0.4, 0, 1, 1)</code></td>
            <td>Elements exiting permanently (modal close, toast dismiss)</td>
          </tr>
          <tr>
            <td><strong>Ease In-Out (Standard)</strong></td>
            <td><code>ease-in-out</code></td>
            <td><code>(0.4, 0, 0.2, 1)</code></td>
            <td>Movement within screen, size changes, default choice</td>
          </tr>
          <tr>
            <td><strong>Linear</strong></td>
            <td><code>linear</code></td>
            <td><code>(0, 0, 1, 1)</code></td>
            <td>Color/opacity fades only, progress indicators, spinners</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* Decision Matrix                                                    */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Decision Matrix</h3>
      <CodeBlock
        language="text"
        title="Which easing to use"
        code={`IF element is entering the view       -> use EASE-OUT (decelerate)
IF element is leaving permanently      -> use EASE-IN (accelerate)
IF element stays on screen but moves   -> use EASE-IN-OUT (standard)
IF element leaves but may return       -> use EASE-IN-OUT (standard)
IF animating only color or opacity     -> LINEAR is acceptable`}
      />

      <p className="docs-section__text"><strong>Prohibited easing:</strong></p>
      <ul className="docs-section__list">
        <li>Bounce effects (vestibular trigger)</li>
        <li>Elastic/spring with overshoot (unless user explicitly enables)</li>
        <li>Abrupt starts or stops</li>
        <li>Inconsistent curves on similar components</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* Accessibility Requirements                                         */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Accessibility Requirements</h3>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Criterion</th>
            <th>Level</th>
            <th>Requirement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>2.2.2 Pause, Stop, Hide</strong></td>
            <td>A</td>
            <td>Auto-playing animations &gt;5 seconds must have pause/stop controls</td>
          </tr>
          <tr>
            <td><strong>2.3.1 Three Flashes</strong></td>
            <td>A</td>
            <td>No content flashes more than 3 times per second</td>
          </tr>
          <tr>
            <td><strong>2.3.3 Animation from Interactions</strong></td>
            <td>AAA</td>
            <td>Non-essential motion triggered by interaction must be disableable</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* prefers-reduced-motion                                             */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">
        <code>prefers-reduced-motion</code> Implementation
      </h3>
      <p className="docs-section__text">
        All non-essential animations must support the{' '}
        <code>prefers-reduced-motion</code> media query. The opt-in approach is
        preferred because it provides a safer default.
      </p>
      <CodeBlock
        language="css"
        title="Option 1: Disable (global reset)"
        code={`@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}`}
      />
      <CodeBlock
        language="css"
        title="Option 2: Opt-in (preferred)"
        code={`.animated-element {
  /* Static styles by default */
}

@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    transition: transform 0.2s ease-out;
  }
}`}
      />

      <p className="docs-section__text"><strong>Essential animations</strong> (keep even with reduced motion):</p>
      <ul className="docs-section__list">
        <li>Loading/progress indicators</li>
        <li>Form validation feedback (success/error states)</li>
        <li>Focus indicators</li>
        <li>State change confirmation (toggle on/off)</li>
      </ul>

      <p className="docs-section__text"><strong>Non-essential animations</strong> (disable with reduced motion):</p>
      <ul className="docs-section__list">
        <li>Parallax scrolling</li>
        <li>Decorative hover effects</li>
        <li>Background motion/video</li>
        <li>Celebration animations (confetti, etc.)</li>
        <li>Scroll-triggered fade-ins</li>
        <li>Page transition flourishes</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* Performance Rules                                                  */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Performance Rules</h3>
      <p className="docs-section__text">
        For consistent 60fps performance, only GPU-accelerated properties
        should be animated.
      </p>

      <table className="docs-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Properties</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Allowed</strong> (GPU accelerated)</td>
            <td>
              <code>transform: translate()</code>,{' '}
              <code>transform: scale()</code>,{' '}
              <code>transform: rotate()</code>,{' '}
              <code>opacity</code>
            </td>
          </tr>
          <tr>
            <td><strong>Prohibited</strong> (trigger layout/paint)</td>
            <td>
              <code>width</code>, <code>height</code>,{' '}
              <code>top</code>, <code>right</code>, <code>bottom</code>,{' '}
              <code>left</code>, <code>margin</code>, <code>padding</code>,{' '}
              <code>border-width</code>, <code>font-size</code>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="docs-section__text"><strong>Performance thresholds:</strong></p>
      <ul className="docs-section__list">
        <li>Target: 60fps (16.67ms per frame)</li>
        <li>Maximum animation duration: 1000ms (except data visualizations)</li>
        <li>Avoid animating more than 3 elements simultaneously</li>
        <li>Stagger multi-element animations by 50&ndash;100ms</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* Animation Types Reference                                          */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Animation Types Reference</h3>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Duration</th>
            <th>Examples</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Micro-interactions</td>
            <td>50&ndash;150ms</td>
            <td>Button hover/press, toggle switches, checkbox ticks, input focus, tooltip appearance</td>
          </tr>
          <tr>
            <td>State Transitions</td>
            <td>150&ndash;300ms</td>
            <td>Accordion expand/collapse, tab content switching, dropdown menus, card flips</td>
          </tr>
          <tr>
            <td>Page Transitions</td>
            <td>300&ndash;500ms</td>
            <td>Route/view changes, modal open/close, slide-in panels, full-screen overlays</td>
          </tr>
          <tr>
            <td>Feedback Animations</td>
            <td>200&ndash;400ms</td>
            <td>Loading spinners, success checkmarks, error shake, toast notifications</td>
          </tr>
          <tr>
            <td>Scroll-Triggered</td>
            <td>200&ndash;400ms</td>
            <td>Fade in on scroll, sticky header transitions, progress indicators</td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* Motion Token Schema                                                */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Motion Token Schema</h3>
      <CodeBlock
        language="json"
        title="Design token schema for motion"
        code={`{
  "motion": {
    "duration": {
      "instant": { "value": "0ms" },
      "micro": { "value": "100ms" },
      "fast": { "value": "150ms" },
      "normal": { "value": "250ms" },
      "slow": { "value": "400ms" },
      "slower": { "value": "600ms" }
    },
    "easing": {
      "default": { "value": "cubic-bezier(0.4, 0, 0.2, 1)" },
      "enter": { "value": "cubic-bezier(0, 0, 0.2, 1)" },
      "exit": { "value": "cubic-bezier(0.4, 0, 1, 1)" },
      "linear": { "value": "cubic-bezier(0, 0, 1, 1)" }
    },
    "transition": {
      "micro": { "value": "{motion.duration.micro} {motion.easing.default}" },
      "standard": { "value": "{motion.duration.normal} {motion.easing.default}" },
      "enter": { "value": "{motion.duration.normal} {motion.easing.enter}" },
      "exit": { "value": "{motion.duration.fast} {motion.easing.exit}" },
      "page": { "value": "{motion.duration.slow} {motion.easing.default}" }
    }
  }
}`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Interactive Easing Demo                                            */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Interactive Easing Demo</h3>
      <p className="docs-section__text">
        Experiment with different durations and easing curves. Select a
        combination and press Play to see the animated box translate across the
        track. This demo respects <code>prefers-reduced-motion</code>.
      </p>

      <EasingDemo />
    </section>
  );
}
