# Animation & Motion Standards

Reference document for the Motion/Animation Agent and Code Review Agent. Use these standards to validate, generate, and enforce animation rules across all components.

---

## Duration Standards

### By Interaction Type

| Category | Duration | Use Cases |
|----------|----------|-----------|
| `instant` | 0ms | No animation needed |
| `micro` | 50â€“100ms | Hover states, focus rings, tooltips appearing |
| `fast` | 100â€“150ms | Button press feedback, toggle switches, checkboxes |
| `normal` | 200â€“300ms | Dropdowns, accordions, tab switches, menu toggles |
| `slow` | 300â€“500ms | Modals, page transitions, slide-in panels |
| `complex` | 500â€“700ms | Multi-step sequences, data visualizations |

### By Device

| Device | Adjustment | Example (base 300ms) |
|--------|------------|----------------------|
| Desktop | Faster, simpler (150â€“200ms typical) | 200ms |
| Mobile | Base reference | 300ms |
| Tablet | +30% from mobile | 390ms |
| Wearables | -30% from mobile | 210ms |

### Key Principles

- Users should **never wait** for animations to complete before taking action
- Keep most UI transitions under **400ms**
- Elements exiting can be **faster** (less attention needed)
- Elements entering should be **slightly slower** (draw attention)
- Appearance duration > disappearance duration

---

## Easing Curves

### Standard Curves (Design Tokens)

```json
{
  "easing": {
    "default": "cubic-bezier(0.4, 0, 0.2, 1)",
    "enter": "cubic-bezier(0, 0, 0.2, 1)",
    "exit": "cubic-bezier(0.4, 0, 1, 1)",
    "linear": "cubic-bezier(0, 0, 1, 1)"
  }
}
```

### When to Use Each

| Curve | CSS Name | Bezier | Use When |
|-------|----------|--------|----------|
| **Ease Out (Decelerate)** | `ease-out` | `(0, 0, 0.2, 1)` | Elements entering screen, user-initiated actions (button clicks, dropdown opens) |
| **Ease In (Accelerate)** | `ease-in` | `(0.4, 0, 1, 1)` | Elements exiting permanently (modal close, toast dismiss) |
| **Ease In-Out (Standard)** | `ease-in-out` | `(0.4, 0, 0.2, 1)` | Movement within screen, size changes, default choice |
| **Linear** | `linear` | `(0, 0, 1, 1)` | Color/opacity fades only, progress indicators, loading spinners |

### Decision Matrix

```
IF element is entering the view â†’ use EASE-OUT (decelerate)
IF element is leaving permanently â†’ use EASE-IN (accelerate)  
IF element stays on screen but moves/resizes â†’ use EASE-IN-OUT (standard)
IF element leaves but may return (sidebar) â†’ use EASE-IN-OUT (standard)
IF animating only color or opacity â†’ LINEAR is acceptable
```

### Prohibited Easing

Do NOT use:
- Bounce effects (vestibular trigger)
- Elastic/spring with overshoot (unless user explicitly enables)
- Abrupt starts or stops
- Inconsistent curves on similar components

---

## Accessibility Requirements

### WCAG Compliance (Minimum AA, Target AAA)

| Criterion | Level | Requirement |
|-----------|-------|-------------|
| **2.2.2 Pause, Stop, Hide** | A | Auto-playing animations >5 seconds must have pause/stop controls |
| **2.3.1 Three Flashes** | A | No content flashes more than 3 times per second |
| **2.3.3 Animation from Interactions** | AAA | Non-essential motion triggered by interaction must be disableable |

### prefers-reduced-motion Implementation

**REQUIRED** for all non-essential animations:

```css
/* Option 1: Disable animations when reduced motion preferred */
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

/* Option 2: Opt-in approach (PREFERRED - safer default) */
.animated-element {
  /* Static styles by default */
}

@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    transition: transform 0.2s ease-out;
  }
}
```

### Essential vs Non-Essential Classification

**Essential (keep even with reduced-motion):**
- Loading/progress indicators
- Form validation feedback (success/error states)
- Focus indicators
- State change confirmation (toggle on/off)

**Non-Essential (disable with reduced-motion):**
- Parallax scrolling
- Decorative hover effects
- Background motion/video
- Celebration animations (confetti, etc.)
- Scroll-triggered fade-ins
- Page transition flourishes

---

## Performance Rules

### Allowed Properties (GPU Accelerated)

Only animate these properties for 60fps performance:

```
âœ“ transform: translate()
âœ“ transform: scale()
âœ“ transform: rotate()
âœ“ opacity
```

### Prohibited Properties (Trigger Layout/Paint)

Never animate these (causes jank):

```
âœ— width / height
âœ— top / right / bottom / left
âœ— margin / padding
âœ— border-width
âœ— font-size
```

### Performance Thresholds

- Target: **60fps** (16.67ms per frame)
- Maximum animation duration: **1000ms** (except data visualizations)
- Avoid animating more than **3 elements simultaneously**
- Stagger multi-element animations by **50â€“100ms**

---

## Animation Types Reference

### Micro-interactions (50â€“150ms)
- Button hover/press states
- Toggle switches
- Checkbox/radio ticks
- Input focus states
- Tooltip appearance

### State Transitions (150â€“300ms)
- Accordion expand/collapse
- Tab content switching
- Dropdown menus
- Navigation toggles
- Card flips

### Page Transitions (300â€“500ms)
- Route/view changes
- Modal open/close
- Slide-in panels
- Full-screen overlays

### Feedback Animations (200â€“400ms)
- Loading spinners
- Success checkmarks
- Error shake
- Toast notifications
- Skeleton loaders

### Scroll-Triggered (200â€“400ms)
- Fade in on scroll
- Sticky header transitions
- Progress indicators
- **Parallax: USE WITH CAUTION** (provide reduced-motion alternative)

---

## Design Token Schema

```json
{
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
}
```

---

## Validation Checklist (For Code Review Agent)

When reviewing any animation implementation, verify:

- [ ] Duration is within bounds for the interaction type
- [ ] Easing curve matches the enter/exit/move pattern
- [ ] `prefers-reduced-motion` media query is implemented
- [ ] Only GPU-accelerated properties are animated
- [ ] No content flashes more than 3x per second
- [ ] Auto-playing animations have pause controls (if >5s)
- [ ] Animation doesn't block user interaction
- [ ] Consistent timing across similar components
- [ ] Essential vs non-essential correctly classified

---

## Reference Sources

- Material Design 3 Motion: https://m3.material.io/styles/motion
- Carbon Design System Motion: https://carbondesignsystem.com/elements/motion
- WCAG 2.1 Animation Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- CSS prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
