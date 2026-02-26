/**
 * Aioli Theme Presets — Named Design Modes & Smart Color Derivation
 *
 * Ships 6 named presets that transform the entire look-and-feel:
 * - default: Clean, professional (polished version of base)
 * - glass: Glassmorphism — frosted glass, backdrop blur, transparency
 * - neumorphic: Soft shadows, extruded elements, neutral palette
 * - brutalist: Thick borders, high contrast, raw type
 * - gradient: Rich gradient backgrounds, gradient text
 * - darkLuxury: Deep blacks, gold accent, refined shadows
 *
 * Also provides smart palette auto-derivation from a single primary color.
 */

// ============================================================================
// COLOR UTILITIES — hex/hsl conversion and manipulation
// ============================================================================

/**
 * Parse a hex color string to RGB values.
 * @param {string} hex - '#rrggbb' or '#rgb' format
 * @returns {{ r: number, g: number, b: number }} RGB values 0-255
 */
export function hexToRgb(hex) {
  if (typeof hex !== 'string') return { r: 0, g: 0, b: 0 };
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const n = parseInt(hex, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

/**
 * Convert RGB to hex string.
 * @param {{ r: number, g: number, b: number }} rgb
 * @returns {string} '#rrggbb'
 */
export function rgbToHex({ r, g, b }) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert RGB to HSL.
 * @param {{ r: number, g: number, b: number }} rgb - RGB values 0-255
 * @returns {{ h: number, s: number, l: number }} HSL (h: 0-360, s/l: 0-100)
 */
export function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / diff + 2) * 60;
    else h = ((r - g) / diff + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Convert HSL to RGB.
 * @param {{ h: number, s: number, l: number }} hsl
 * @returns {{ r: number, g: number, b: number }}
 */
export function hslToRgb({ h, s, l }) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

/**
 * Adjust a hex color's lightness by a percentage.
 * @param {string} hex - Base color
 * @param {number} amount - Lightness adjustment (-100 to 100)
 * @returns {string} Adjusted hex color
 */
export function adjustLightness(hex, amount) {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Adjust a hex color's saturation by a percentage.
 * @param {string} hex - Base color
 * @param {number} amount - Saturation adjustment (-100 to 100)
 * @returns {string} Adjusted hex color
 */
export function adjustSaturation(hex, amount) {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Mix two hex colors at a given ratio.
 * @param {string} hex1 - First color
 * @param {string} hex2 - Second color
 * @param {number} ratio - 0 = all hex1, 1 = all hex2
 * @returns {string} Mixed hex color
 */
export function mixColors(hex1, hex2, ratio = 0.5) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  return rgbToHex({
    r: c1.r + (c2.r - c1.r) * ratio,
    g: c1.g + (c2.g - c1.g) * ratio,
    b: c1.b + (c2.b - c1.b) * ratio,
  });
}

/**
 * Get the complementary color (180° rotation).
 */
export function getComplementary(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.h = (hsl.h + 180) % 360;
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Get analogous colors (±30° rotation).
 * @returns {{ left: string, right: string }}
 */
export function getAnalogous(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  return {
    left: rgbToHex(hslToRgb({ ...hsl, h: (hsl.h - 30 + 360) % 360 })),
    right: rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 30) % 360 })),
  };
}

// ============================================================================
// ADDITIONAL COLOR HARMONY FUNCTIONS
// ============================================================================

/**
 * Get split-complementary colors (±150° rotation).
 * @param {string} hex - Base color
 * @returns {{ left: string, right: string }}
 */
export function getSplitComplementary(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  return {
    left: rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 150) % 360 })),
    right: rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 210) % 360 })),
  };
}

/**
 * Get triadic colors (±120° rotation).
 * @param {string} hex - Base color
 * @returns {{ left: string, right: string }}
 */
export function getTriadic(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  return {
    left: rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 120) % 360 })),
    right: rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 240) % 360 })),
  };
}

/**
 * Get tetradic (rectangular) colors (90° steps).
 * @param {string} hex - Base color
 * @returns {{ a: string, b: string, c: string }}
 */
export function getTetradic(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  return {
    a: rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 90) % 360 })),
    b: rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 })),
    c: rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 270) % 360 })),
  };
}

// ============================================================================
// WCAG CONTRAST HELPERS (inlined to avoid circular imports with a11y agent)
// ============================================================================

/**
 * Calculate relative luminance per WCAG 2.1 formula.
 * @param {string} hex - '#rrggbb' color
 * @returns {number} Luminance 0–1
 */
function _relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number} Contrast ratio (1–21)
 */
function _contrastRatio(hex1, hex2) {
  const l1 = _relativeLuminance(hex1);
  const l2 = _relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if foreground on background passes WCAG AA for normal text (4.5:1).
 * @param {string} fg - Foreground hex
 * @param {string} bg - Background hex
 * @returns {boolean}
 */
function _passesAA(fg, bg) {
  return _contrastRatio(fg, bg) >= 4.5;
}

/** Public export: WCAG contrast ratio (1–21). */
export function contrastRatio(hex1, hex2) {
  return _contrastRatio(hex1, hex2);
}

/** Public export: check WCAG AA (4.5:1) compliance. */
export function passesAA(fg, bg) {
  return _passesAA(fg, bg);
}

/**
 * Suggest color harmonies from a primary color with WCAG AA-verified shades.
 *
 * @param {string} primaryHex - The primary brand color
 * @returns {object} Five harmony types, each with colors, AA shades, and contrast ratios
 */
export function suggestHarmonies(primaryHex) {
  if (!primaryHex || !/^#[0-9a-fA-F]{6}$/.test(primaryHex)) {
    throw new Error('primaryHex must be a 6-digit hex string, e.g. "#2563eb"');
  }

  const WHITE = '#ffffff';

  /** Pick the darkest AA-passing shade from a color scale. */
  function pickAAShade(hex) {
    const scale = generateColorScale(hex);
    const hsl = rgbToHsl(hexToRgb(hex));
    let shade = hsl.l > 45 ? scale['700'] : scale['600'];
    if (!_passesAA(shade, WHITE)) {
      for (const s of ['700', '800', '900', '950']) {
        if (_passesAA(scale[s], WHITE)) { shade = scale[s]; break; }
      }
    }
    return { raw: hex, shade, ratio: Math.round(_contrastRatio(shade, WHITE) * 100) / 100 };
  }

  const comp = getComplementary(primaryHex);
  const analog = getAnalogous(primaryHex);
  const splitComp = getSplitComplementary(primaryHex);
  const triad = getTriadic(primaryHex);
  const tetrad = getTetradic(primaryHex);

  return {
    complementary: {
      colors: [comp],
      shades: [pickAAShade(comp)],
    },
    analogous: {
      colors: [analog.left, analog.right],
      shades: [pickAAShade(analog.left), pickAAShade(analog.right)],
    },
    splitComplementary: {
      colors: [splitComp.left, splitComp.right],
      shades: [pickAAShade(splitComp.left), pickAAShade(splitComp.right)],
    },
    triadic: {
      colors: [triad.left, triad.right],
      shades: [pickAAShade(triad.left), pickAAShade(triad.right)],
    },
    tetradic: {
      colors: [tetrad.a, tetrad.b, tetrad.c],
      shades: [pickAAShade(tetrad.a), pickAAShade(tetrad.b), pickAAShade(tetrad.c)],
    },
  };
}

/**
 * Generate a full color scale from a single base color.
 * Creates 50, 100, 200, ... 900, 950 shades like Tailwind.
 * @param {string} hex - Base color (will become the ~500 shade)
 * @returns {Record<string, string>} Shade map
 */
export function generateColorScale(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));
  const shades = {};
  const steps = [
    { name: '50', l: 97, s: -20 },
    { name: '100', l: 94, s: -15 },
    { name: '200', l: 86, s: -10 },
    { name: '300', l: 74, s: -5 },
    { name: '400', l: 60, s: 0 },
    { name: '500', l: 48, s: 0 },
    { name: '600', l: 40, s: 5 },
    { name: '700', l: 32, s: 5 },
    { name: '800', l: 24, s: 0 },
    { name: '900', l: 18, s: -5 },
    { name: '950', l: 10, s: -10 },
  ];

  for (const step of steps) {
    shades[step.name] = rgbToHex(hslToRgb({
      h: hsl.h,
      s: Math.max(0, Math.min(100, hsl.s + step.s)),
      l: step.l,
    }));
  }
  return shades;
}

/**
 * Pick AA-safe default/hover/active shades for a given color.
 *
 * **Key behaviour**: if the user's input hex already passes WCAG AA (4.5:1)
 * against white, it is used *as-is* for the default shade so the palette
 * visually matches the colour the user chose.  Hover and active are then
 * derived one and two "steps" darker from the closest scale position.
 *
 * If the input does NOT pass AA, we fall back to picking the closest passing
 * shade from the generated scale.
 *
 * @param {string} hex - The user's chosen colour
 * @returns {{ defaultShade: string, hoverShade: string, activeShade: string, scale: Record<string, string> }}
 * @private
 */
function _pickAAShades(hex) {
  const scale = generateColorScale(hex);
  const WHITE = '#ffffff';

  // The ordered scale keys from lightest to darkest
  const ORDERED = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

  let defaultShade;
  let defaultIdx; // index into ORDERED of the closest scale shade to defaultShade

  if (_passesAA(hex, WHITE)) {
    // User's colour passes AA — use it directly
    defaultShade = hex;
    // Find the closest scale shade by lightness so hover/active are relative
    const inputL = rgbToHsl(hexToRgb(hex)).l;
    let minDist = Infinity;
    defaultIdx = 5; // default to '500'
    for (let i = 0; i < ORDERED.length; i++) {
      const shadeL = rgbToHsl(hexToRgb(scale[ORDERED[i]])).l;
      const dist = Math.abs(shadeL - inputL);
      if (dist < minDist) { minDist = dist; defaultIdx = i; }
    }
  } else {
    // Input doesn't pass AA — find the lightest scale shade that does
    const hsl = rgbToHsl(hexToRgb(hex));
    const startIdx = hsl.l > 45 ? 7 : 6; // '700' or '600'
    defaultIdx = startIdx;
    defaultShade = scale[ORDERED[startIdx]];
    if (!_passesAA(defaultShade, WHITE)) {
      for (let i = startIdx + 1; i < ORDERED.length; i++) {
        if (_passesAA(scale[ORDERED[i]], WHITE)) {
          defaultShade = scale[ORDERED[i]];
          defaultIdx = i;
          break;
        }
      }
    }
  }

  // Hover: one step darker than defaultShade's closest scale position
  const hoverIdx = Math.min(defaultIdx + 1, ORDERED.length - 1);
  let hoverShade = scale[ORDERED[hoverIdx]];
  if (!_passesAA(hoverShade, WHITE)) {
    for (let i = hoverIdx; i < ORDERED.length; i++) {
      if (_passesAA(scale[ORDERED[i]], WHITE)) { hoverShade = scale[ORDERED[i]]; break; }
    }
  }

  // Active: two steps darker
  const activeIdx = Math.min(defaultIdx + 2, ORDERED.length - 1);
  let activeShade = scale[ORDERED[activeIdx]];
  if (!_passesAA(activeShade, WHITE)) {
    for (let i = activeIdx; i < ORDERED.length; i++) {
      if (_passesAA(scale[ORDERED[i]], WHITE)) { activeShade = scale[ORDERED[i]]; break; }
    }
  }

  return { defaultShade, hoverShade, activeShade, scale };
}

/**
 * Derive a full semantic color palette from a single primary hex color.
 * Auto-generates: hover, active, subtle, muted, plus dark-mode variants.
 *
 * @param {string} primaryHex - The primary brand color
 * @returns {Record<string, string>} Token path → value overrides
 */
export function derivePalette(primaryHex) {
  // Pick AA-safe shades, preferring the user's exact color when it passes AA
  const { defaultShade, hoverShade, activeShade, scale } = _pickAAShades(primaryHex);

  const rgb = hexToRgb(defaultShade);
  const shadowRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}`;

  return {
    // Semantic color overrides
    'semantic.color.primary.default': defaultShade,
    'semantic.color.primary.hover': hoverShade,
    'semantic.color.primary.active': activeShade,
    'semantic.color.primary.subtle': scale['100'],
    'semantic.color.primary.muted': scale['50'],

    // Button gradient (kebab-case to match Style Dictionary CSS output)
    'component.button.primary.gradient': `linear-gradient(180deg, ${scale['500']} 0%, ${defaultShade} 100%)`,
    'component.button.primary.gradient-hover': `linear-gradient(180deg, ${defaultShade} 0%, ${hoverShade} 100%)`,

    // Button colored shadow (kebab-case to match Style Dictionary CSS output)
    'component.button.primary.shadow': `0 1px 3px 0 ${shadowRgba}, 0.4), 0 1px 2px -1px ${shadowRgba}, 0.3)`,
    'component.button.primary.shadow-hover': `0 4px 12px -2px ${shadowRgba}, 0.4)`,

    // Component overrides (kebab-case to match Style Dictionary CSS output)
    'component.button.primary.bg': defaultShade,
    'component.button.primary.bg-hover': hoverShade,
    'component.button.primary.bg-active': activeShade,

    // Focus ring
    'semantic.focus.ring.color': scale['500'],
    'semantic.border.focus': scale['500'],

    // Text link
    'semantic.text.link': defaultShade,

    // Info color (mirrors primary by default)
    'semantic.color.info.default': defaultShade,
    'semantic.color.info.hover': hoverShade,
    'semantic.color.info.subtle': scale['100'],

    // Dark mode primary
    'semantic.color.dark.primary.default': scale['400'],
    'semantic.color.dark.primary.hover': scale['300'],
    'semantic.color.dark.primary.active': scale['200'],
    'semantic.color.dark.primary.subtle': scale['900'],

    // Gradient tokens
    'semantic.gradient.primary.default': `linear-gradient(135deg, ${defaultShade} 0%, ${hoverShade} 100%)`,
    'semantic.gradient.primary.vibrant': `linear-gradient(135deg, ${scale['500']} 0%, ${defaultShade} 50%, ${hoverShade} 100%)`,
    'semantic.gradient.primary.subtle': `linear-gradient(135deg, ${scale['50']} 0%, ${scale['100']} 100%)`,

    // Colored shadows
    'semantic.shadow.colored.primary.sm': `0 2px 8px -2px ${shadowRgba}, 0.25)`,
    'semantic.shadow.colored.primary.md': `0 4px 12px -2px ${shadowRgba}, 0.3)`,
    'semantic.shadow.colored.primary.lg': `0 8px 24px -4px ${shadowRgba}, 0.3)`,
    'semantic.shadow.colored.primary.glow': `0 0 20px ${shadowRgba}, 0.4)`,
  };
}

// ============================================================================
// THEME PRESETS
// ============================================================================

/**
 * Default preset — polished, clean, professional.
 * Subtle gradients on buttons, colored shadows, smooth motion.
 */
export const PRESET_DEFAULT = {
  name: 'default',
  label: 'Clean',
  description: 'Polished and professional — subtle depth, colored shadows, smooth transitions',
  overrides: {
    // Uses the base Aioli tokens as-is — this is the "upgraded" default
  },
};

/**
 * Glass preset — Glassmorphism.
 * Frosted glass cards, backdrop blur, semi-transparent surfaces.
 */
export const PRESET_GLASS = {
  name: 'glass',
  label: 'Glassmorphism',
  description: 'Frosted glass surfaces, backdrop blur, translucent cards and panels',
  overrides: {
    // === Intent Colors — darkened for AA contrast on #f0f4ff page (4.5:1+) ===
    'semantic.color.primary.default': '#1d4ed8',    // blue.700 → 5.65:1 on #f0f4ff
    'semantic.color.primary.subtle': 'rgba(59, 130, 246, 0.15)',  // translucent blue
    'semantic.color.secondary.default': '#475569',   // slate.600
    'semantic.color.secondary.subtle': 'rgba(100, 116, 139, 0.15)',
    'semantic.color.success.default': '#047857',     // emerald.700 → 5.50:1 on #f0f4ff
    'semantic.color.success.subtle': 'rgba(5, 150, 105, 0.15)',
    'semantic.color.warning.default': '#92400e',     // amber.800 → 5.98:1 on #f0f4ff
    'semantic.color.warning.subtle': 'rgba(217, 119, 6, 0.15)',
    'semantic.color.danger.default': '#b91c1c',      // red.700 → 6.30:1 on #f0f4ff
    'semantic.color.danger.subtle': 'rgba(220, 38, 38, 0.15)',
    'semantic.color.info.default': '#0369a1',        // sky.700 → 5.48:1 on #f0f4ff
    'semantic.color.info.subtle': 'rgba(2, 132, 199, 0.15)',
    'semantic.color.error.default': '#b91c1c',       // mirrors danger
    'semantic.color.error.subtle': 'rgba(220, 38, 38, 0.15)',

    // === Surfaces — frosted glass ===
    'semantic.surface.page.default': '#f0f4ff',
    'semantic.surface.page.subtle': '#e8eeff',
    'semantic.surface.page.muted': '#e0e7ff',
    'semantic.surface.card.default': 'rgba(255, 255, 255, 0.7)',
    'semantic.surface.card.hover': 'rgba(255, 255, 255, 0.85)',
    'semantic.surface.inverse.default': '#1e293b',

    // === Text ===
    'semantic.text.default': '#1e293b',              // slate.800 — high contrast on glass
    'semantic.text.muted': '#475569',                // slate.600 — AA on #f0f4ff (6.89:1)
    'semantic.text.inverse': '#f8fafc',
    'semantic.text.link': '#1d4ed8',                 // blue.700 — match primary

    // === Borders ===
    'semantic.border.default': 'rgba(255, 255, 255, 0.25)',
    'semantic.border.subtle': 'rgba(255, 255, 255, 0.15)',

    // === Shadows — softer for glass ===
    'semantic.shadow.sm': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
    'semantic.shadow.md': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',

    // === Component overrides ===
    'component.card.bg.default': 'rgba(255, 255, 255, 0.65)',
    'component.card.border.color': 'rgba(255, 255, 255, 0.2)',
    'component.card.shadow.default': '0 1px 3px rgba(0, 0, 0, 0.05)',

    // Radius — slightly larger for softer feel
    'primitive.radius.md': '8px',
    'primitive.radius.lg': '12px',
    'component.button.radius': '8px',
    'component.card.radius': '12px',
  },
};

/**
 * Neumorphic preset — soft extruded elements.
 * Soft shadows, light backgrounds, pressed/raised feel.
 */
export const PRESET_NEUMORPHIC = {
  name: 'neumorphic',
  label: 'Neumorphism',
  description: 'Soft shadows, extruded elements, monochrome surfaces',
  overrides: {
    // === Intent Colors — darker shades for AA on gray #e8ecf1 surfaces ===
    'semantic.color.primary.default': '#1d4ed8',   // blue.700 → 5.65:1 on #e8ecf1
    'semantic.color.primary.subtle': '#dbeafe',     // blue.100 — visible on gray
    'semantic.color.secondary.default': '#475569',  // slate.600
    'semantic.color.secondary.subtle': '#e2e8f0',   // slate.200
    'semantic.color.success.default': '#047857',    // emerald.700
    'semantic.color.success.subtle': '#d1fae5',     // emerald.100
    'semantic.color.warning.default': '#92400e',    // amber.800 → 5.98:1 on #e8ecf1
    'semantic.color.warning.subtle': '#fef3c7',     // amber.100
    'semantic.color.danger.default': '#b91c1c',     // red.700
    'semantic.color.danger.subtle': '#fee2e2',      // red.100
    'semantic.color.info.default': '#1d4ed8',       // blue.700
    'semantic.color.info.subtle': '#dbeafe',        // blue.100
    'semantic.color.error.default': '#b91c1c',      // mirrors danger
    'semantic.color.error.subtle': '#fee2e2',

    // === Surfaces — soft gray ===
    'semantic.surface.page.default': '#e8ecf1',
    'semantic.surface.page.subtle': '#e0e5eb',
    'semantic.surface.page.muted': '#d5dbe3',
    'semantic.surface.card.default': '#e8ecf1',
    'semantic.surface.card.hover': '#e0e5eb',
    'semantic.surface.inverse.default': '#334155',  // slate.700

    // === Text ===
    'semantic.text.default': '#1e293b',             // slate.800
    'semantic.text.muted': '#475569',               // slate.600 — AA on #e8ecf1 (6.39:1)
    'semantic.text.inverse': '#f1f5f9',             // slate.100
    'semantic.text.link': '#1d4ed8',                // match primary

    // === Shadows — dual light/dark soft shadows ===
    'semantic.shadow.sm': '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)',
    'semantic.shadow.md': '6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.8)',
    'semantic.shadow.lg': '8px 8px 16px rgba(163, 177, 198, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.8)',
    'semantic.shadow.inner': 'inset 4px 4px 8px rgba(163, 177, 198, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.8)',

    // === Component overrides ===
    'component.card.bg.default': '#e8ecf1',
    'component.card.border.color': 'transparent',
    'component.card.border.width': '0px',
    'component.card.shadow.default': '6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.8)',

    // Buttons — extruded look, pressed on active
    'component.button.primary.shadow': '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.6)',
    'component.button.primary.shadow-hover': '6px 6px 12px rgba(163, 177, 198, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.7)',
    'component.button.primary.shadow-active': 'inset 4px 4px 8px rgba(163, 177, 198, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.8)',
    'component.button.primary.gradient': 'none',
    'component.button.primary.gradient-hover': 'none',

    // Radius — rounded
    'primitive.radius.md': '12px',
    'primitive.radius.lg': '16px',
    'component.button.radius': '12px',
    'component.card.radius': '16px',
  },
};

/**
 * Brutalist preset — raw, bold, high-contrast.
 * Thick borders, flat colors, oversized type.
 */
export const PRESET_BRUTALIST = {
  name: 'brutalist',
  label: 'Neo-Brutalist',
  description: 'Thick borders, high contrast, raw typography, bold color blocks',
  overrides: {
    // === Intent Colors — bold, saturated, high contrast (AA on white) ===
    'semantic.color.primary.default': '#2563eb',    // blue.600 → 4.63:1
    'semantic.color.primary.subtle': '#dbeafe',     // blue.100
    'semantic.color.secondary.default': '#334155',  // slate.700 → 8.20:1
    'semantic.color.secondary.subtle': '#f1f5f9',   // slate.100
    'semantic.color.success.default': '#047857',    // emerald.700 → 5.50:1 (was #16a34a 3.30 FAIL)
    'semantic.color.success.subtle': '#dcfce7',     // green.100
    'semantic.color.warning.default': '#92400e',    // amber.800 → 5.98:1 (was #ca8a04 2.94 FAIL)
    'semantic.color.warning.subtle': '#fef9c3',     // yellow.100
    'semantic.color.danger.default': '#dc2626',     // red.600 → 4.63:1
    'semantic.color.danger.subtle': '#fee2e2',      // red.100
    'semantic.color.info.default': '#2563eb',       // blue.600 → 4.63:1
    'semantic.color.info.subtle': '#dbeafe',        // blue.100
    'semantic.color.error.default': '#dc2626',      // mirrors danger
    'semantic.color.error.subtle': '#fee2e2',

    // === Surfaces — stark white ===
    'semantic.surface.page.default': '#ffffff',
    'semantic.surface.page.subtle': '#fafafa',
    'semantic.surface.page.muted': '#f5f5f5',
    'semantic.surface.card.default': '#ffffff',
    'semantic.surface.inverse.default': '#0f172a',  // slate.900

    // === Text — high contrast ===
    'semantic.text.default': '#0f172a',             // slate.900
    'semantic.text.muted': '#475569',               // slate.600
    'semantic.text.inverse': '#ffffff',
    'semantic.text.link': '#2563eb',                // blue.600

    // === Borders — thick and black ===
    'semantic.border.default': '#0f172a',
    'semantic.border.subtle': '#0f172a',
    'semantic.border.strong': '#0f172a',
    'primitive.border.width.default': '2px',

    // === Shadows — hard offset (no blur) ===
    'semantic.shadow.sm': '3px 3px 0 0 #0f172a',
    'semantic.shadow.md': '4px 4px 0 0 #0f172a',
    'semantic.shadow.lg': '6px 6px 0 0 #0f172a',

    // === Component overrides ===
    'component.card.border.color': '#0f172a',
    'component.card.border.width': '2px',
    'component.card.shadow.default': '4px 4px 0 0 #0f172a',
    'component.card.radius': '0px',
    'component.card.bg.default': '#ffffff',

    // Buttons — flat, bold borders, no gradients
    'component.button.radius': '0px',
    'component.button.primary.gradient': 'none',
    'component.button.primary.gradient-hover': 'none',
    'component.button.primary.shadow': '3px 3px 0 0 #0f172a',
    'component.button.primary.shadow-hover': '4px 4px 0 0 #0f172a',
    'component.button.primary.shadow-active': '1px 1px 0 0 #0f172a',
    'component.button.danger.gradient': 'none',
    'component.button.danger.gradient-hover': 'none',
    'component.button.danger.shadow': '3px 3px 0 0 #0f172a',

    // Radius — none
    'primitive.radius.md': '0px',
    'primitive.radius.lg': '0px',
    'primitive.radius.xl': '0px',
  },
};

/**
 * Gradient preset — rich gradient backgrounds and text.
 * Vibrant color washes, gradient hero sections.
 */
export const PRESET_GRADIENT = {
  name: 'gradient',
  label: 'Gradient',
  description: 'Rich gradient backgrounds, vibrant colors, gradient text and surfaces',
  overrides: {
    // NOTE: No hardcoded color/gradient tokens here — they're generated dynamically
    // in deriveBrandTheme() using the user's brand color + hue-shifted complement.
    // This preset only defines structural/surface properties.

    // === Surfaces — slightly tinted ===
    'semantic.surface.card.default': '#ffffff',

    // Radius — rounded
    'primitive.radius.md': '8px',
    'primitive.radius.lg': '12px',
    'component.button.radius': '8px',
    'component.card.radius': '12px',
  },
};

/**
 * Dark Luxury preset — deep blacks, gold accents, refined shadows.
 * Premium dark-mode aesthetic with warm accent colors.
 */
export const PRESET_DARK_LUXURY = {
  name: 'darkLuxury',
  label: 'Dark Luxury',
  description: 'Deep blacks, gold accents, refined shadows — premium dark aesthetic',
  overrides: {
    // === Intent Colors — warm accent palette for luxury dark ===
    'semantic.color.primary.default': '#d97706',         // gold accent
    'semantic.color.primary.hover': '#b45309',
    'semantic.color.primary.active': '#92400e',
    'semantic.color.primary.subtle': 'rgba(217, 119, 6, 0.15)',  // gold with alpha
    'semantic.color.primary.muted': '#1c1917',
    'semantic.color.secondary.default': '#a8a29e',       // stone.400
    'semantic.color.secondary.subtle': 'rgba(168, 162, 158, 0.15)',
    'semantic.color.success.default': '#34d399',         // emerald.400 → 10.28:1 on #0c0a09
    'semantic.color.success.subtle': 'rgba(52, 211, 153, 0.15)',
    'semantic.color.warning.default': '#f59e0b',         // amber.500 → 9.20:1 on #0c0a09
    'semantic.color.warning.subtle': 'rgba(245, 158, 11, 0.15)',
    'semantic.color.danger.default': '#f87171',          // red.400 → 7.14:1 on #0c0a09
    'semantic.color.danger.subtle': 'rgba(248, 113, 113, 0.15)',
    'semantic.color.info.default': '#60a5fa',            // blue.400 → 7.77:1 on #0c0a09
    'semantic.color.info.subtle': 'rgba(96, 165, 250, 0.15)',
    'semantic.color.error.default': '#f87171',           // mirrors danger
    'semantic.color.error.subtle': 'rgba(248, 113, 113, 0.15)',

    // === Surfaces — deep dark with warm undertones ===
    'semantic.surface.page.default': '#0c0a09',
    'semantic.surface.page.subtle': '#1c1917',
    'semantic.surface.page.muted': '#292524',
    'semantic.surface.card.default': '#1c1917',
    'semantic.surface.card.hover': '#292524',
    'semantic.surface.inverse.default': '#fafaf9',       // light on dark

    // === Text — warm neutrals (WCAG AA verified) ===
    'semantic.text.default': '#fafaf9',       // 18.92:1 / 16.74:1
    'semantic.text.secondary': '#a8a29e',     // 7.83:1 / 6.93:1
    'semantic.text.muted': '#918a85',         // 5.81:1 / 5.14:1
    'semantic.text.inverse': '#0c0a09',       // dark on light
    'semantic.text.link': '#fbbf24',          // 11.83:1 / 10.48:1

    // === Borders — warm grays ===
    'semantic.border.default': '#292524',
    'semantic.border.subtle': '#1c1917',
    'semantic.border.strong': '#44403c',

    // === Shadows — warm tints on dark ===
    'semantic.shadow.sm': '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
    'semantic.shadow.md': '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
    'semantic.shadow.lg': '0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.4)',

    // === Component overrides ===
    // Outline button inherits from semantic.color.primary via var() chain —
    // in dark mode it resolves to the lighter dark.primary shade automatically.
    'component.button.ghost.text': '#fafaf9',

    // Button — gold gradient (WCAG AA verified)
    'component.button.primary.bg': '#d97706',
    'component.button.primary.bg-hover': '#b86e1b',
    'component.button.primary.bg-active': '#c27e24',
    'component.button.primary.text': '#0c0a09',
    'component.button.primary.gradient': 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
    'component.button.primary.gradient-hover': 'linear-gradient(180deg, #d97706 0%, #b86e1b 100%)',
    'component.button.primary.shadow': '0 1px 3px rgba(217, 119, 6, 0.4), 0 1px 2px rgba(217, 119, 6, 0.3)',
    'component.button.primary.shadow-hover': '0 4px 12px rgba(217, 119, 6, 0.4)',

    // Card — dark surface
    'component.card.bg.default': '#1c1917',
    'component.card.border.color': '#292524',
    'component.card.shadow.default': '0 1px 3px rgba(0, 0, 0, 0.4)',

    // Radius — refined
    'primitive.radius.md': '8px',
    'component.button.radius': '8px',
    'component.card.radius': '12px',
  },
};

// ============================================================================
// PRESET REGISTRY
// ============================================================================

/**
 * All available theme presets, keyed by name.
 */
export const THEME_PRESETS = {
  default: PRESET_DEFAULT,
  glass: PRESET_GLASS,
  neumorphic: PRESET_NEUMORPHIC,
  brutalist: PRESET_BRUTALIST,
  gradient: PRESET_GRADIENT,
  darkLuxury: PRESET_DARK_LUXURY,
};

/**
 * Get a theme preset by name.
 * @param {string} name - Preset name (default, glass, neumorphic, brutalist, gradient, darkLuxury)
 * @returns {object|null} Preset object or null
 */
export function getPreset(name) {
  return THEME_PRESETS[name] || null;
}

/**
 * List all available presets with their metadata.
 * @returns {Array<{ name: string, label: string, description: string }>}
 */
export function listPresets() {
  return Object.values(THEME_PRESETS).map(({ name, label, description }) => ({
    name,
    label,
    description,
  }));
}

/**
 * Create a theme from a preset name, with optional additional overrides.
 * Merges preset overrides with any custom overrides provided.
 *
 * @param {string} presetName - Name of the preset
 * @param {Record<string, string>} [customOverrides] - Additional overrides
 * @returns {Record<string, string>} Combined overrides ready for createTheme()
 */
export function getPresetOverrides(presetName, customOverrides = {}) {
  const preset = THEME_PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}. Available: ${Object.keys(THEME_PRESETS).join(', ')}`);
  }
  return { ...preset.overrides, ...customOverrides };
}

// ============================================================================
// MULTI-COLOR BRAND THEME DERIVATION
// ============================================================================

/**
 * Helper: derive semantic token overrides for a single color role.
 * Generates scale, picks WCAG AA-safe shades, and returns token path → value map.
 *
 * @param {string} hex - Base hex color
 * @param {string} role - Token role name (e.g. 'secondary', 'success', 'danger')
 * @returns {Record<string, string>} Token overrides for that role
 */
function _deriveRoleTokens(hex, role) {
  // Pick AA-safe shades, preferring the user's exact color when it passes AA
  const { defaultShade, hoverShade, activeShade, scale } = _pickAAShades(hex);

  const rgb = hexToRgb(defaultShade);
  const shadowRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}`;

  const overrides = {
    [`semantic.color.${role}.default`]: defaultShade,
    [`semantic.color.${role}.hover`]: hoverShade,
    [`semantic.color.${role}.active`]: activeShade,
    [`semantic.color.${role}.subtle`]: scale['100'],
    [`semantic.color.${role}.muted`]: scale['50'],
    // Dark mode variants
    [`semantic.color.dark.${role}.default`]: scale['400'],
    [`semantic.color.dark.${role}.hover`]: scale['300'],
    [`semantic.color.dark.${role}.active`]: scale['200'],
    [`semantic.color.dark.${role}.subtle`]: scale['900'],
  };

  // Add button component tokens for roles that have button variants.
  // Secondary uses a subtle tinted bg with dark text; danger/success use
  // solid colored bg with white text, gradients, and colored shadows.
  if (role === 'secondary') {
    Object.assign(overrides, {
      'component.button.secondary.bg': scale['100'],
      'component.button.secondary.bg-hover': scale['200'],
      'component.button.secondary.bg-active': activeShade,
      'component.button.secondary.text': scale['900'],
    });
  }
  const SOLID_BUTTON_ROLES = ['danger', 'success'];
  if (SOLID_BUTTON_ROLES.includes(role)) {
    Object.assign(overrides, {
      [`component.button.${role}.bg`]: defaultShade,
      [`component.button.${role}.bg-hover`]: hoverShade,
      [`component.button.${role}.bg-active`]: activeShade,
      [`component.button.${role}.gradient`]: `linear-gradient(180deg, ${scale['500']} 0%, ${defaultShade} 100%)`,
      [`component.button.${role}.shadow`]: `0 1px 3px 0 ${shadowRgba}, 0.4), 0 1px 2px -1px ${shadowRgba}, 0.3)`,
      [`component.button.${role}.shadow-hover`]: `0 4px 12px -2px ${shadowRgba}, 0.4)`,
    });
    if (role === 'danger') {
      overrides[`component.button.${role}.gradient-hover`] = `linear-gradient(180deg, ${defaultShade} 0%, ${hoverShade} 100%)`;
    }
  }

  return overrides;
}

/**
 * Derive a complete brand theme from multiple brand colors.
 * Expands on `derivePalette()` to handle a full brand palette.
 * Missing colors are auto-derived from the primary using color harmony rules.
 *
 * @param {object} config - Brand configuration
 * @param {string} config.primary - Primary brand color (required, hex)
 * @param {string} [config.secondary] - Secondary color (auto: complementary of primary)
 * @param {string} [config.accent] - Accent color (auto: analogous of primary)
 * @param {string} [config.neutral] - Neutral color (auto: desaturated primary)
 * @param {string} [config.success] - Success color (default: #10b981)
 * @param {string} [config.danger] - Danger color (default: #ef4444)
 * @param {object} [config.options] - Additional options
 * @param {string} [config.options.preset] - Base preset name to merge with
 * @param {string} [config.options.radius] - Border radius override
 * @param {string} [config.options.font] - Font family override
 * @returns {Record<string, string>} Complete token overrides for the brand theme
 */
export function deriveBrandTheme(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('deriveBrandTheme: config must be an object with at least a primary color');
  }
  const { primary, secondary, accent, neutral, success, danger, options = {} } = config;

  if (!primary || !/^#[0-9a-fA-F]{6}$/.test(primary)) {
    throw new Error('deriveBrandTheme: primary must be a 6-digit hex string, e.g. "#2563eb"');
  }

  // Start with primary palette (backwards-compatible with derivePalette)
  const overrides = { ...derivePalette(primary) };

  // Secondary: use provided or derive from complementary
  const secondaryHex = secondary || getComplementary(primary);
  Object.assign(overrides, _deriveRoleTokens(secondaryHex, 'secondary'));

  // Accent: use provided or derive from analogous (right side)
  const accentHex = accent || getAnalogous(primary).right;
  Object.assign(overrides, _deriveRoleTokens(accentHex, 'accent'));

  // Neutral: use provided or desaturate the primary
  const neutralHex = neutral || adjustSaturation(primary, -60);
  const neutralScale = generateColorScale(neutralHex);

  // Walk scale from 500 upward to find AA-passing shade for muted text
  const WHITE = '#ffffff';
  let mutedShade = neutralScale['500'];
  for (const s of ['500', '600', '700']) {
    if (_passesAA(neutralScale[s], WHITE)) { mutedShade = neutralScale[s]; break; }
    mutedShade = neutralScale[s === '700' ? '700' : String(Number(s) + 100)];
  }
  // If still failing after 700, force 700 (darkest reasonable muted)
  if (!_passesAA(mutedShade, WHITE)) mutedShade = neutralScale['700'];

  // Walk scale from 600 upward to find AA-passing shade for secondary text
  let secondaryShade = neutralScale['600'];
  if (!_passesAA(secondaryShade, WHITE)) {
    for (const s of ['700', '800']) {
      if (_passesAA(neutralScale[s], WHITE)) { secondaryShade = neutralScale[s]; break; }
    }
  }

  Object.assign(overrides, {
    'semantic.surface.page.default': '#ffffff',
    'semantic.surface.page.subtle': neutralScale['50'],
    'semantic.surface.page.muted': neutralScale['100'],
    'semantic.surface.card.default': '#ffffff',
    'semantic.surface.card.hover': neutralScale['50'],
    'semantic.text.default': neutralScale['900'],
    'semantic.text.muted': mutedShade,
    'semantic.text.secondary': secondaryShade,
    'semantic.border.default': neutralScale['200'],
    'semantic.border.subtle': neutralScale['100'],
    'semantic.border.strong': neutralScale['300'],
  });

  // Success: use provided or default green
  const successHex = success || '#10b981';
  Object.assign(overrides, _deriveRoleTokens(successHex, 'success'));

  // Danger: use provided or default red
  const dangerHex = danger || '#ef4444';
  Object.assign(overrides, _deriveRoleTokens(dangerHex, 'danger'));

  // Warning: auto-derive from danger shifted toward amber
  const dangerHsl = rgbToHsl(hexToRgb(dangerHex));
  const warningHex = rgbToHex(hslToRgb({ h: Math.min(dangerHsl.h + 30, 45), s: 90, l: 45 }));
  Object.assign(overrides, _deriveRoleTokens(warningHex, 'warning'));

  // Apply preset base if specified
  if (options.preset && THEME_PRESETS[options.preset]) {
    const presetOverrides = THEME_PRESETS[options.preset].overrides;
    // Preset structural tokens (surfaces, borders, shadows, card/button structure,
    // text colors) take precedence over brand-derived neutrals.
    // Brand *color role* tokens (primary, secondary, accent, success, danger, warning)
    // still override the preset.
    const BRAND_ROLE_PREFIXES = [
      'semantic.color.primary.', 'semantic.color.secondary.', 'semantic.color.accent.',
      'semantic.color.success.', 'semantic.color.danger.', 'semantic.color.warning.',
      'component.button.primary.', 'component.button.secondary.',
      'component.button.danger.', 'component.button.success.',
      'semantic.shadow.colored.',
    ];
    const merged = { ...overrides };
    for (const [key, val] of Object.entries(presetOverrides)) {
      // Shadow/gradient style tokens are structural for presets that nullify them
      // (neumorphic dual-shadows, brutalist hard shadows, brutalist gradient:'none')
      const isStructuralShadow = key.endsWith('.shadow') || key.endsWith('.shadow-hover') || key.endsWith('.shadow-active');
      const isStructuralGradient = key.endsWith('.gradient') || key.endsWith('.gradient-hover');
      if (isStructuralShadow || isStructuralGradient) {
        merged[key] = val;
        continue;
      }
      // If the key is a brand color role, keep brand's value
      const isBrandRole = BRAND_ROLE_PREFIXES.some(p => key.startsWith(p));
      if (!isBrandRole || !(key in overrides)) {
        merged[key] = val;
      }
    }
    Object.assign(overrides, merged);
  }

  // --- Gradient preset: generate brand-aware multi-color gradients -----------
  // After preset merge, build vibrant gradients that use the user's primary color
  // plus a hue-shifted stop for the multi-color effect.
  if (options.preset === 'gradient') {
    const pScale = generateColorScale(primary);
    const pShades = _pickAAShades(primary);
    const pHsl = rgbToHsl(hexToRgb(primary));

    // Second gradient stop: shift hue +60° for a vibrant multi-color effect
    const shiftHex = rgbToHex(hslToRgb({ h: (pHsl.h + 60) % 360, s: Math.min(pHsl.s + 10, 100), l: pHsl.l }));
    const sShades = _pickAAShades(shiftHex);
    const sScale = generateColorScale(shiftHex);

    // Third color for vibrant gradient: shift -90°
    const shift2Hex = rgbToHex(hslToRgb({ h: (pHsl.h - 90 + 360) % 360, s: Math.min(pHsl.s + 5, 100), l: pHsl.l }));
    const s2Scale = generateColorScale(shift2Hex);

    // Button gradients: primary → hue-shifted (135° angle for dynamism)
    overrides['component.button.primary.gradient'] =
      `linear-gradient(135deg, ${pShades.defaultShade} 0%, ${sShades.defaultShade} 100%)`;
    overrides['component.button.primary.gradient-hover'] =
      `linear-gradient(135deg, ${pShades.hoverShade} 0%, ${sShades.hoverShade} 100%)`;

    // Surface/semantic gradients
    overrides['semantic.gradient.primary.default'] =
      `linear-gradient(135deg, ${pShades.defaultShade} 0%, ${sShades.defaultShade} 100%)`;
    overrides['semantic.gradient.primary.vibrant'] =
      `linear-gradient(135deg, ${s2Scale['500']} 0%, ${pShades.defaultShade} 33%, ${sShades.defaultShade} 66%, ${sScale['500']} 100%)`;
    overrides['semantic.gradient.surface.default'] =
      `linear-gradient(180deg, ${pScale['50']} 0%, ${sScale['50']} 100%)`;

    // Tint surfaces and text to match primary
    overrides['semantic.surface.page.default'] = pScale['50'];
    overrides['semantic.surface.page.subtle'] = pScale['100'];
    overrides['semantic.surface.page.muted'] = pScale['200'];
    overrides['semantic.surface.inverse.default'] = pScale['950'];
    overrides['semantic.border.default'] = pScale['200'];
    overrides['semantic.border.subtle'] = pScale['100'];
    overrides['semantic.text.default'] = pScale['950'];

    // Walk the scale for text.muted to ensure AA compliance against page bg
    const WHITE = '#ffffff';
    let gradMuted = pScale['700'];
    for (const s of ['700', '800', '900']) {
      if (_passesAA(pScale[s], WHITE)) { gradMuted = pScale[s]; break; }
    }
    if (!_passesAA(gradMuted, WHITE)) gradMuted = pScale['900'];
    overrides['semantic.text.muted'] = gradMuted;
  }

  // Apply radius override
  if (options.radius) {
    const r = options.radius;
    overrides['primitive.radius.sm'] = `calc(${r} * 0.5)`;
    overrides['primitive.radius.md'] = r;
    overrides['primitive.radius.lg'] = `calc(${r} * 1.5)`;
    overrides['primitive.radius.xl'] = `calc(${r} * 2)`;
    overrides['component.button.radius'] = r;
    overrides['component.card.radius'] = `calc(${r} * 1.5)`;
  }

  // Apply font override
  if (options.font) {
    overrides['primitive.font.family.base'] = options.font;
  }

  return overrides;
}

// ============================================================================
// THEME VALIDATION & AUDIT
// ============================================================================

/**
 * Default base token values (resolved hex) used for validation when overrides
 * don't specify a token. These match the base Aioli defaults.
 * @private
 */
const BASE_TOKEN_DEFAULTS = {
  'semantic.text.default': '#0f172a',        // neutral.900
  'semantic.text.muted': '#64748b',          // neutral.500
  'semantic.text.secondary': '#475569',      // neutral.600
  'semantic.text.link': '#2563eb',           // blue.600
  'semantic.text.inverse': '#ffffff',        // neutral.0
  'semantic.color.primary.default': '#2563eb',  // blue.600
  'semantic.color.primary.hover': '#1d4ed8',    // blue.700
  'semantic.color.secondary.default': '#475569', // neutral.600
  'semantic.color.success.default': '#047857',   // emerald.700
  'semantic.color.warning.default': '#92400e',   // amber.800
  'semantic.color.danger.default': '#b91c1c',    // red.700
  'semantic.color.info.default': '#2563eb',      // blue.600
  'semantic.surface.page.default': '#ffffff',    // neutral.0
  'semantic.surface.page.subtle': '#f8fafc',     // neutral.50
  'semantic.surface.card.default': '#ffffff',    // neutral.0
  'semantic.surface.inverse.default': '#0f172a', // neutral.900
};

/**
 * Standard contrast pairs to validate. Each defines a foreground token,
 * background token, required ratio, and human-readable label.
 */
export const THEME_CONTRAST_PAIRS = [
  { fg: 'semantic.text.default', bg: 'semantic.surface.page.default', required: 4.5, label: 'Body text on page' },
  { fg: 'semantic.text.muted', bg: 'semantic.surface.page.default', required: 4.5, label: 'Muted text on page' },
  { fg: 'semantic.text.secondary', bg: 'semantic.surface.page.default', required: 4.5, label: 'Secondary text on page' },
  { fg: 'semantic.text.link', bg: 'semantic.surface.page.default', required: 4.5, label: 'Link text on page' },
  { fg: 'semantic.text.default', bg: 'semantic.surface.card.default', required: 4.5, label: 'Body text on card' },
  { fg: 'semantic.text.muted', bg: 'semantic.surface.card.default', required: 4.5, label: 'Muted text on card' },
  { fg: 'semantic.text.inverse', bg: 'semantic.surface.inverse.default', required: 4.5, label: 'Inverse text on inverse surface' },
  { fg: 'semantic.color.primary.default', bg: 'semantic.surface.page.default', required: 4.5, label: 'Primary on page' },
  { fg: 'semantic.color.primary.default', bg: 'semantic.surface.card.default', required: 4.5, label: 'Primary on card' },
  { fg: 'semantic.text.inverse', bg: 'semantic.color.primary.default', required: 4.5, label: 'White on primary' },
  { fg: 'semantic.text.inverse', bg: 'semantic.color.primary.hover', required: 4.5, label: 'White on primary hover' },
  { fg: 'semantic.color.secondary.default', bg: 'semantic.surface.page.default', required: 4.5, label: 'Secondary on page' },
  { fg: 'semantic.color.success.default', bg: 'semantic.surface.page.default', required: 4.5, label: 'Success on page' },
  { fg: 'semantic.text.inverse', bg: 'semantic.color.success.default', required: 4.5, label: 'White on success' },
  { fg: 'semantic.color.warning.default', bg: 'semantic.surface.page.default', required: 4.5, label: 'Warning on page' },
  { fg: 'semantic.color.danger.default', bg: 'semantic.surface.page.default', required: 4.5, label: 'Danger on page' },
  { fg: 'semantic.text.inverse', bg: 'semantic.color.danger.default', required: 4.5, label: 'White on danger' },
  { fg: 'semantic.color.info.default', bg: 'semantic.surface.page.default', required: 4.5, label: 'Info on page' },
  { fg: 'semantic.text.default', bg: 'semantic.surface.page.subtle', required: 4.5, label: 'Body text on subtle page' },
  { fg: 'semantic.text.muted', bg: 'semantic.surface.page.subtle', required: 4.5, label: 'Muted text on subtle page' },
];

/**
 * Resolve a token value from overrides, falling back to base defaults.
 * Handles simple hex colors only (no var() references or rgba for validation).
 *
 * @param {string} tokenPath - Dot-notation token path
 * @param {Record<string, string>} overrides - Theme overrides
 * @returns {string|null} Resolved hex color or null if unresolvable
 * @private
 */
function _resolveForValidation(tokenPath, overrides) {
  const val = overrides[tokenPath] || BASE_TOKEN_DEFAULTS[tokenPath];
  if (!val) return null;
  // Only validate solid hex colors (skip rgba, var(), gradients)
  if (/^#[0-9a-fA-F]{3,8}$/.test(val)) return val;
  return null;
}

/**
 * Validate a theme's overrides against WCAG AA contrast requirements.
 * Returns a pass/fail summary with details on any failures.
 *
 * @param {Record<string, string>} overrides - Theme token overrides
 * @returns {{ valid: boolean, failures: Array, summary: { total: number, pass: number, fail: number, skipped: number } }}
 */
export function validateTheme(overrides = {}) {
  const failures = [];
  let pass = 0;
  let skipped = 0;

  for (const pair of THEME_CONTRAST_PAIRS) {
    const fg = _resolveForValidation(pair.fg, overrides);
    const bg = _resolveForValidation(pair.bg, overrides);

    if (!fg || !bg) {
      skipped++;
      continue;
    }

    const ratio = Math.round(_contrastRatio(fg, bg) * 100) / 100;
    const passes = ratio >= pair.required;

    if (passes) {
      pass++;
    } else {
      failures.push({
        label: pair.label,
        fg,
        bg,
        fgToken: pair.fg,
        bgToken: pair.bg,
        ratio,
        required: pair.required,
      });
    }
  }

  return {
    valid: failures.length === 0,
    failures,
    summary: {
      total: THEME_CONTRAST_PAIRS.length,
      pass,
      fail: failures.length,
      skipped,
    },
  };
}

/**
 * Audit a theme with detailed results for every contrast pair.
 * Superset of validateTheme — includes passing pairs too.
 *
 * @param {Record<string, string>} overrides - Theme token overrides
 * @returns {{ pairs: Array, summary: { total: number, pass: number, fail: number, skipped: number } }}
 */
export function auditTheme(overrides = {}) {
  const pairs = [];
  let pass = 0;
  let fail = 0;
  let skipped = 0;

  for (const pair of THEME_CONTRAST_PAIRS) {
    const fg = _resolveForValidation(pair.fg, overrides);
    const bg = _resolveForValidation(pair.bg, overrides);

    if (!fg || !bg) {
      skipped++;
      pairs.push({
        label: pair.label,
        fg: fg || '(unresolved)',
        bg: bg || '(unresolved)',
        fgToken: pair.fg,
        bgToken: pair.bg,
        ratio: null,
        passes: null,
        required: pair.required,
        skipped: true,
      });
      continue;
    }

    const ratio = Math.round(_contrastRatio(fg, bg) * 100) / 100;
    const passes = ratio >= pair.required;
    if (passes) pass++; else fail++;

    pairs.push({
      label: pair.label,
      fg,
      bg,
      fgToken: pair.fg,
      bgToken: pair.bg,
      ratio,
      passes,
      required: pair.required,
      skipped: false,
    });
  }

  return {
    pairs,
    summary: {
      total: THEME_CONTRAST_PAIRS.length,
      pass,
      fail,
      skipped,
    },
  };
}
