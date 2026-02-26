/**
 * Aioli Design System — Theme Builder Wizard
 *
 * A 4-step wizard that guides users through building a brand theme:
 *   Step 0: Choose your brand color (or pick a starter palette)
 *   Step 1: Refine your palette (secondary, accent, harmonies)
 *   Step 2: Choose your style (preset, radius, typography, dark mode)
 *   Step 3: Export your theme (.aioli-theme.json, CSS, JSON)
 *
 * deriveBrandTheme() is ALWAYS active — no legacy mode.
 * Accessibility (WCAG AA) is validated live and surfaced at every step.
 */

import React, { useReducer, useCallback, useEffect, useMemo, useRef } from 'react';
import { createTheme, createDarkTheme } from '../../lib/theme.js';
import {
  THEME_PRESETS,
  deriveBrandTheme,
  suggestHarmonies,
  generateColorScale,
  auditTheme,
  contrastRatio,
  passesAA,
} from '../../lib/theme-presets.js';
import { importThemeFile, exportThemeFile } from '../../lib/theme-file.js';
import { useDarkMode } from '../hooks/useDarkMode';
import { STARTER_PALETTES } from './StarterPalettes.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEP_TITLES = [
  'Choose Your Brand Color',
  'Refine Your Palette',
  'Choose Your Style',
  'Export Your Theme',
];

const STEP_SUBTITLES = [
  'Pick your primary brand color, or start with a curated palette.',
  'Your secondary, accent, and status colors were auto-derived. Adjust any, or try a harmony.',
  'Adjust the visual character of your design system.',
  'Review your accessible brand theme and export it.',
];

/** Roles shown in Step 1 for refinement. */
const REFINE_ROLES = [
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent',    label: 'Accent' },
  { key: 'success',   label: 'Success' },
  { key: 'danger',    label: 'Danger' },
  { key: 'warning',   label: 'Warning' },
];

const RADIUS_PRESETS = [
  { label: 'None',   value: '0px' },
  { label: 'Small',  value: '4px' },
  { label: 'Medium', value: '8px' },
  { label: 'Large',  value: '12px' },
  { label: 'Pill',   value: '9999px' },
];

const FONT_PRESETS = [
  { label: 'System', value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { label: 'Inter',  value: "'Inter', system-ui, sans-serif" },
  { label: 'Mono',   value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: 'Serif',  value: "'Georgia', 'Times New Roman', serif" },
];

const PRESET_INFO = [
  { name: 'default',    emoji: '\u2728',     label: 'Clean' },
  { name: 'glass',      emoji: '\uD83E\uDE9F', label: 'Glass' },
  { name: 'neumorphic', emoji: '\uD83D\uDCA0', label: 'Neumorphic' },
  { name: 'brutalist',  emoji: '\u26A1',     label: 'Brutalist' },
  { name: 'gradient',   emoji: '\uD83C\uDF08', label: 'Gradient' },
  { name: 'darkLuxury', emoji: '\uD83D\uDC51', label: 'Dark Luxury' },
];

const HARMONY_LABELS = {
  complementary: 'Complementary',
  analogous: 'Analogous',
  splitComplementary: 'Split Complement',
  triadic: 'Triadic',
  tetradic: 'Tetradic',
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const initialState = {
  currentStep: 0,
  furthestStep: 0,
  // Step 0
  primaryColor: '#2563eb',
  activePaletteName: null,
  // Step 1
  secondaryColor: null,
  accentColor: null,
  successColor: null,
  dangerColor: null,
  warningColor: null,
  manualOverrides: {},
  // Step 2
  activePreset: 'default',
  radius: '8px',
  font: FONT_PRESETS[0].value,
  // Step 3
  themeName: 'My Brand Theme',
  activeExportTab: 'css',
  showContrastDetail: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'NEXT_STEP': {
      const next = Math.min(state.currentStep + 1, 3);
      return { ...state, currentStep: next, furthestStep: Math.max(state.furthestStep, next) };
    }
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case 'GO_TO_STEP':
      if (action.step <= state.furthestStep) {
        return { ...state, currentStep: action.step };
      }
      return state;
    case 'SET_PRIMARY':
      return { ...state, primaryColor: action.color, activePaletteName: null };
    case 'SELECT_PALETTE':
      return { ...state, primaryColor: action.primary, activePaletteName: action.name };
    case 'SET_ROLE_COLOR':
      return {
        ...state,
        [`${action.role}Color`]: action.color,
        manualOverrides: { ...state.manualOverrides, [action.role]: true },
      };
    case 'TOGGLE_AUTO_DERIVE': {
      const isNowAuto = state.manualOverrides[action.role];
      return {
        ...state,
        manualOverrides: { ...state.manualOverrides, [action.role]: !isNowAuto },
        ...(isNowAuto ? {} : { [`${action.role}Color`]: null }),
      };
    }
    case 'APPLY_HARMONY': {
      const update = { ...state, manualOverrides: { ...state.manualOverrides } };
      if (action.secondary) {
        update.secondaryColor = action.secondary;
        update.manualOverrides.secondary = true;
      }
      if (action.accent) {
        update.accentColor = action.accent;
        update.manualOverrides.accent = true;
      }
      return update;
    }
    case 'SET_PRESET': {
      const s = { ...state, activePreset: action.preset };
      const preset = THEME_PRESETS[action.preset];
      if (preset?.overrides['primitive.radius.md']) {
        s.radius = preset.overrides['primitive.radius.md'];
      }
      return s;
    }
    case 'SET_RADIUS':
      return { ...state, radius: action.radius };
    case 'SET_FONT':
      return { ...state, font: action.font };
    case 'SET_THEME_NAME':
      return { ...state, themeName: action.name };
    case 'SET_EXPORT_TAB':
      return { ...state, activeExportTab: action.tab };
    case 'TOGGLE_CONTRAST_DETAIL':
      return { ...state, showContrastDetail: !state.showContrastDetail };
    case 'IMPORT_THEME': {
      const s = { ...initialState, currentStep: 0, furthestStep: 3 };
      if (action.brand?.primary) s.primaryColor = action.brand.primary;
      if (action.brand?.secondary) { s.secondaryColor = action.brand.secondary; s.manualOverrides.secondary = true; }
      if (action.brand?.accent) { s.accentColor = action.brand.accent; s.manualOverrides.accent = true; }
      if (action.brand?.success) { s.successColor = action.brand.success; s.manualOverrides.success = true; }
      if (action.brand?.danger) { s.dangerColor = action.brand.danger; s.manualOverrides.danger = true; }
      if (action.options?.preset) s.activePreset = action.options.preset;
      if (action.options?.radius) s.radius = action.options.radius;
      if (action.options?.font) s.font = action.options.font;
      if (action.name) s.themeName = action.name;
      return s;
    }
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Validate that a string looks like a hex color. */
function isValidHex(s) {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

/** Get the resolved color for a role from the overrides map. */
function resolveRoleColor(overrides, role) {
  const key = `semantic.color.${role}.default`;
  return overrides[key] || null;
}

// ---------------------------------------------------------------------------
// ThemeBuilder Component
// ---------------------------------------------------------------------------

export default function ThemeBuilder() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { darkMode, toggleDarkMode, setDarkMode } = useDarkMode();
  const fileInputRef = useRef(null);

  // -- Derived values -------------------------------------------------------

  const overrides = useMemo(() => {
    const config = { primary: state.primaryColor };
    for (const role of REFINE_ROLES) {
      if (state.manualOverrides[role.key] && state[`${role.key}Color`]) {
        config[role.key] = state[`${role.key}Color`];
      }
    }
    const opts = {};
    if (state.activePreset !== 'default') opts.preset = state.activePreset;
    if (state.radius !== '8px') opts.radius = state.radius;
    if (state.font !== FONT_PRESETS[0].value) opts.font = state.font;
    if (Object.keys(opts).length > 0) config.options = opts;

    const o = deriveBrandTheme(config);
    o['primitive.font.family.sans'] = state.font;
    // Ensure button radius is also set
    o['component.button.radius'] = state.radius;
    o['component.card.radius'] = `calc(${state.radius} * 1.5)`;
    return o;
  }, [state.primaryColor, state.secondaryColor, state.accentColor,
      state.successColor, state.dangerColor, state.warningColor,
      state.manualOverrides, state.activePreset, state.radius, state.font]);

  const colorScale = useMemo(
    () => generateColorScale(state.primaryColor),
    [state.primaryColor]
  );

  const harmonies = useMemo(() => {
    try { return suggestHarmonies(state.primaryColor); }
    catch { return null; }
  }, [state.primaryColor]);

  const audit = useMemo(() => {
    try { return auditTheme(overrides); }
    catch { return null; }
  }, [overrides]);

  const allPassing = audit?.summary.fail === 0;

  const exportCSS = useMemo(() => createTheme(overrides).toCSS(), [overrides]);
  const exportJSON = useMemo(
    () => JSON.stringify(createTheme(overrides).toJSON(), null, 2),
    [overrides]
  );

  // -- Theme injection ------------------------------------------------------

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-aioli-theme', 'builder');

    let css;

    if (!darkMode) {
      // Light mode: inject ALL overrides scoped to .tb-preview
      css = createTheme(overrides, '.tb-preview').toCSS();
    } else {
      // Dark mode: filter overrides to dark-safe tokens, then merge with
      // DARK_MODE_DEFAULTS via createDarkTheme.  Surfaces, text, and semantic
      // borders are handled by the defaults (dark bg, light text).
      // We pass through brand colors, shadows, primitives, and component structure.
      const darkOverrides = Object.fromEntries(
        Object.entries(overrides).filter(([key]) => {
          if (key.includes('.dark.') || key.includes('.dark-')) return true;
          if (key.startsWith('primitive.')) return true;
          if (key.startsWith('semantic.color.')) return true;
          if (key.startsWith('semantic.shadow.')) return true;
          if (key.startsWith('semantic.gradient.') || key.startsWith('semantic.focus.')) return true;
          if (key.startsWith('component.button.')) return true;
          if (key.startsWith('component.card.') && !key.startsWith('component.card.bg')) return true;
          return false;
        })
      );
      // Scope to .tb-preview — use createTheme with merged dark defaults
      const darkTheme = createDarkTheme(darkOverrides);
      css = darkTheme.toCSS().replace('[data-theme="dark"]', '[data-theme="dark"] .tb-preview');
    }

    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, [overrides, darkMode, state.activePreset]);

  // Auto-enable dark mode for darkLuxury preset
  useEffect(() => {
    if (state.activePreset === 'darkLuxury' && !darkMode) {
      setDarkMode(true);
    }
  }, [state.activePreset]);

  // -- Callbacks ------------------------------------------------------------

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  const handleExportFile = useCallback(() => {
    const brand = { primary: state.primaryColor };
    for (const role of REFINE_ROLES) {
      if (state.manualOverrides[role.key] && state[`${role.key}Color`]) {
        brand[role.key] = state[`${role.key}Color`];
      }
    }
    const opts = {};
    if (state.activePreset !== 'default') opts.preset = state.activePreset;
    if (state.radius !== '8px') opts.radius = state.radius;
    if (state.font !== FONT_PRESETS[0].value) opts.font = state.font;

    const json = exportThemeFile({
      name: state.themeName,
      brand,
      options: Object.keys(opts).length > 0 ? opts : undefined,
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.aioli-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const handleFileImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        importThemeFile(json); // validates
        dispatch({
          type: 'IMPORT_THEME',
          brand: json.brand,
          options: json.options,
          name: json.name,
        });
      } catch (err) {
        console.error('Import failed:', err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // -- Render: Step 0 — Brand Color ----------------------------------------

  function renderStep0() {
    return (
      <div className="tb-step__content">
        {/* Primary color picker */}
        <div className="tb-picker">
          <label className="tb-picker__label" htmlFor="primary-color">
            Your primary brand color
          </label>
          <div className="tb-picker__row">
            <input
              id="primary-color"
              type="color"
              className="tb-picker__swatch"
              value={state.primaryColor}
              onChange={(e) => dispatch({ type: 'SET_PRIMARY', color: e.target.value })}
            />
            <input
              type="text"
              className="tb-picker__hex"
              value={state.primaryColor}
              onChange={(e) => {
                const v = e.target.value;
                if (isValidHex(v)) dispatch({ type: 'SET_PRIMARY', color: v });
              }}
              spellCheck={false}
              maxLength={7}
            />
          </div>
        </div>

        {/* Color scale strip */}
        <div className="tb-scale">
          {Object.entries(colorScale).map(([shade, hex]) => (
            <div
              key={shade}
              className="tb-scale__shade"
              style={{ background: hex }}
              title={`${shade}: ${hex}`}
            >
              <span className="tb-scale__label" style={{ color: parseInt(shade) >= 500 ? '#fff' : '#000' }}>
                {shade}
              </span>
            </div>
          ))}
        </div>

        {/* Starter palettes */}
        <div className="tb-palettes">
          <h3 className="tb-palettes__heading">Or start with a palette</h3>
          <div className="tb-palettes__grid">
            {STARTER_PALETTES.map((p) => {
              const isActive = state.activePaletteName === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  className={`tb-palettes__card${isActive ? ' tb-palettes__card--active' : ''}`}
                  onClick={() => dispatch({ type: 'SELECT_PALETTE', name: p.name, primary: p.primary })}
                >
                  <span className="tb-palettes__swatch" style={{ background: p.primary }} />
                  <span className="tb-palettes__info">
                    <span className="tb-palettes__emoji">{p.emoji}</span>
                    <span className="tb-palettes__name">{p.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -- Render: Step 1 — Refine Palette --------------------------------------

  function renderStep1() {
    const pageBackground = overrides['semantic.surface.page.default'] || '#ffffff';

    return (
      <div className="tb-step__content">
        {/* Role colors */}
        <div className="tb-roles">
          {REFINE_ROLES.map((role) => {
            const isManual = !!state.manualOverrides[role.key];
            const resolved = resolveRoleColor(overrides, role.key);
            const currentValue = isManual && state[`${role.key}Color`]
              ? state[`${role.key}Color`]
              : resolved || '#888888';
            const passes = resolved && isValidHex(resolved) && isValidHex(pageBackground)
              ? passesAA(resolved, pageBackground)
              : true;

            return (
              <div key={role.key} className="tb-roles__row">
                <div className="tb-roles__header">
                  <label className="tb-roles__label" htmlFor={`role-${role.key}`}>
                    {role.label}
                  </label>
                  <button
                    type="button"
                    className={`tb-roles__badge${isManual ? '' : ' tb-roles__badge--auto'}`}
                    onClick={() => dispatch({ type: 'TOGGLE_AUTO_DERIVE', role: role.key })}
                  >
                    {isManual ? 'Manual' : 'Auto'}
                  </button>
                  <span
                    className={`tb-roles__a11y${passes ? ' tb-roles__a11y--pass' : ' tb-roles__a11y--warn'}`}
                    title={passes ? 'Passes WCAG AA' : 'May not meet WCAG AA contrast'}
                  >
                    {passes ? '\u2713' : '\u26A0'}
                  </span>
                </div>
                <div className="tb-roles__input-row">
                  <input
                    id={`role-${role.key}`}
                    type="color"
                    className="tb-roles__swatch"
                    value={currentValue}
                    disabled={!isManual}
                    onChange={(e) => dispatch({ type: 'SET_ROLE_COLOR', role: role.key, color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="tb-roles__hex"
                    value={currentValue}
                    disabled={!isManual}
                    onChange={(e) => {
                      if (isValidHex(e.target.value)) {
                        dispatch({ type: 'SET_ROLE_COLOR', role: role.key, color: e.target.value });
                      }
                    }}
                    spellCheck={false}
                    maxLength={7}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Harmonies */}
        {harmonies && (
          <div className="tb-harmonies">
            <h3 className="tb-harmonies__heading">Suggested Harmonies</h3>
            <div className="tb-harmonies__grid">
              {Object.entries(harmonies).map(([type, data]) => (
                <button
                  key={type}
                  type="button"
                  className="tb-harmonies__card"
                  onClick={() => dispatch({
                    type: 'APPLY_HARMONY',
                    secondary: data.shades[0]?.raw,
                    accent: data.shades[1]?.raw,
                  })}
                  title={`Apply ${HARMONY_LABELS[type]}`}
                >
                  <span className="tb-harmonies__label">{HARMONY_LABELS[type] || type}</span>
                  <span className="tb-harmonies__swatches">
                    <span className="tb-harmonies__swatch" style={{ background: state.primaryColor }} />
                    {data.shades.map((s, i) => (
                      <span key={i} className="tb-harmonies__swatch" style={{ background: s.raw }} />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -- Render: Step 2 — Choose Style ----------------------------------------

  function renderStep2() {
    return (
      <div className="tb-step__content">
        {/* Presets */}
        <div className="tb-presets">
          <h3 className="tb-presets__heading">Design Preset</h3>
          <div className="tb-presets__grid">
            {PRESET_INFO.map((p) => (
              <button
                key={p.name}
                type="button"
                className={`tb-presets__card${state.activePreset === p.name ? ' tb-presets__card--active' : ''}`}
                onClick={() => dispatch({ type: 'SET_PRESET', preset: p.name })}
                aria-pressed={state.activePreset === p.name}
              >
                <span className="tb-presets__emoji" aria-hidden="true">{p.emoji}</span>
                <span className="tb-presets__label">{p.label}</span>
              </button>
            ))}
          </div>
          {state.activePreset !== 'default' && THEME_PRESETS[state.activePreset] && (
            <p className="tb-presets__desc">{THEME_PRESETS[state.activePreset].description}</p>
          )}
        </div>

        {/* Radius */}
        <div className="tb-option">
          <h3 className="tb-option__heading">Border Radius</h3>
          <div className="tb-option__chips">
            {RADIUS_PRESETS.map((r) => (
              <button
                key={r.label}
                type="button"
                className={`tb-option__chip${state.radius === r.value ? ' tb-option__chip--active' : ''}`}
                onClick={() => dispatch({ type: 'SET_RADIUS', radius: r.value })}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="tb-option">
          <h3 className="tb-option__heading">Typography</h3>
          <div className="tb-option__chips">
            {FONT_PRESETS.map((f) => (
              <button
                key={f.label}
                type="button"
                className={`tb-option__chip${state.font === f.value ? ' tb-option__chip--active' : ''}`}
                onClick={() => dispatch({ type: 'SET_FONT', font: f.value })}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dark mode */}
        <div className="tb-option">
          <div className="tb-option__toggle-row">
            <h3 className="tb-option__heading">Dark Mode</h3>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              className={`tb-toggle${darkMode ? ' tb-toggle--on' : ''}`}
              onClick={toggleDarkMode}
            >
              <span className="tb-toggle__thumb" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -- Render: Step 3 — Export ----------------------------------------------

  function renderStep3() {
    return (
      <div className="tb-step__content">
        {/* Theme name */}
        <div className="tb-export-name">
          <label className="tb-export-name__label" htmlFor="theme-name">Theme Name</label>
          <input
            id="theme-name"
            type="text"
            className="tb-export-name__input"
            value={state.themeName}
            onChange={(e) => dispatch({ type: 'SET_THEME_NAME', name: e.target.value })}
            spellCheck={false}
          />
        </div>

        {/* Summary card */}
        <div className="tb-summary">
          <h3 className="tb-summary__heading">Theme Summary</h3>
          <div className="tb-summary__colors">
            {['primary', 'secondary', 'accent', 'success', 'danger'].map((role) => {
              const color = resolveRoleColor(overrides, role);
              return (
                <div key={role} className="tb-summary__color">
                  <span className="tb-summary__swatch" style={{ background: color || '#ccc' }} />
                  <span className="tb-summary__role">{role}</span>
                </div>
              );
            })}
          </div>
          <div className="tb-summary__meta">
            <span>Preset: <strong>{PRESET_INFO.find(p => p.name === state.activePreset)?.label || 'Clean'}</strong></span>
            <span>Radius: <strong>{RADIUS_PRESETS.find(r => r.value === state.radius)?.label || state.radius}</strong></span>
            <span>Font: <strong>{FONT_PRESETS.find(f => f.value === state.font)?.label || 'System'}</strong></span>
          </div>
        </div>

        {/* Accessibility report */}
        <div className="tb-audit">
          <button
            type="button"
            className="tb-audit__toggle"
            onClick={() => dispatch({ type: 'TOGGLE_CONTRAST_DETAIL' })}
          >
            <span className="tb-audit__headline">
              WCAG Contrast Audit
              {audit && (
                <span className={`tb-audit__count${audit.summary.fail > 0 ? ' tb-audit__count--fail' : ''}`}>
                  {audit.summary.pass}/{audit.summary.total}
                </span>
              )}
            </span>
            <span className="tb-audit__arrow">{state.showContrastDetail ? '\u25B2' : '\u25BC'}</span>
          </button>
          {state.showContrastDetail && audit && (
            <div className="tb-audit__grid">
              {audit.pairs.map((pair, i) => (
                <div
                  key={i}
                  className={`tb-audit__row${pair.skipped ? ' tb-audit__row--skip' : pair.passes ? '' : ' tb-audit__row--fail'}`}
                >
                  <span className="tb-audit__label">{pair.label}</span>
                  <span className="tb-audit__swatches">
                    <span className="tb-audit__swatch" style={{ background: pair.fg }} />
                    <span className="tb-audit__swatch tb-audit__swatch--bg" style={{ background: pair.bg }} />
                  </span>
                  <span className="tb-audit__ratio">
                    {pair.ratio !== null ? `${pair.ratio}:1` : 'N/A'}
                  </span>
                  <span className={`tb-audit__status${pair.passes === true ? ' tb-audit__status--pass' : pair.passes === false ? ' tb-audit__status--fail' : ''}`}>
                    {pair.skipped ? 'SKIP' : pair.passes ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export actions */}
        <div className="tb-export-actions">
          <button type="button" className="tb-export-actions__primary" onClick={handleExportFile}>
            Download .aioli-theme.json
          </button>
          <div className="tb-export-actions__secondary">
            <button type="button" onClick={() => handleCopy(exportCSS)}>Copy CSS</button>
            <button type="button" onClick={() => handleCopy(exportJSON)}>Copy JSON</button>
          </div>
        </div>

        {/* Code preview */}
        <div className="tb-code">
          <div className="tb-code__tabs">
            <button
              type="button"
              className={`tb-code__tab${state.activeExportTab === 'css' ? ' tb-code__tab--active' : ''}`}
              onClick={() => dispatch({ type: 'SET_EXPORT_TAB', tab: 'css' })}
            >CSS</button>
            <button
              type="button"
              className={`tb-code__tab${state.activeExportTab === 'json' ? ' tb-code__tab--active' : ''}`}
              onClick={() => dispatch({ type: 'SET_EXPORT_TAB', tab: 'json' })}
            >JSON</button>
          </div>
          <pre className="tb-code__pre">
            <code>{state.activeExportTab === 'css' ? exportCSS : exportJSON}</code>
          </pre>
        </div>

        {/* Import */}
        <div className="tb-import">
          <button type="button" className="tb-import__link" onClick={() => fileInputRef.current?.click()}>
            Import existing .aioli-theme.json
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />
        </div>
      </div>
    );
  }

  // -- Render: Preview Panel ------------------------------------------------

  function renderPreview() {
    return (
      <div className="tb-preview">
        {/* Accessibility badge */}
        <div className={`tb-badge${allPassing ? ' tb-badge--pass' : ' tb-badge--warn'}`}>
          {allPassing ? '\u2713' : '\u26A0'}{' '}
          WCAG AA: {audit ? `${audit.summary.pass}/${audit.summary.total}` : '...'}
        </div>

        {/* Mini marketing page using real Aioli component classes */}
        <div className="tb-preview__page">
          {/* Hero */}
          <section className={`tb-preview__hero${state.activePreset === 'gradient' ? ' tb-preview__hero--gradient' : ''}`}>
            <h2 className="tb-preview__hero-headline">Your Brand, Beautifully</h2>
            <p className="tb-preview__hero-sub">Accessible by default. Stunning by design.</p>
            <div className="tb-preview__hero-ctas">
              <button type="button" className="btn btn--primary btn--md">Get Started</button>
              <button type="button" className="btn btn--secondary btn--md">Learn More</button>
            </div>
          </section>

          {/* Feature cards */}
          <section className="tb-preview__features">
            <article className="card">
              <div className="card__body">
                <h3 className="card__title">Design Tokens</h3>
                <div className="card__content">1,700+ tokens powering every pixel of your brand.</div>
              </div>
            </article>
            <article className="card">
              <div className="card__body">
                <h3 className="card__title">Accessible</h3>
                <div className="card__content">WCAG AA guaranteed across all themes and presets.</div>
              </div>
            </article>
            <article className="card">
              <div className="card__body">
                <h3 className="card__title">55 Components</h3>
                <div className="card__content">From atoms to full page layouts, ready to ship.</div>
              </div>
            </article>
          </section>

          {/* Form section */}
          <section className="tb-preview__form-section">
            <div className="form-field">
              <label className="form-field__label">Email address</label>
              <input type="email" className="form-field__input" placeholder="you@example.com" readOnly />
            </div>
            <button type="button" className="btn btn--primary btn--md">Subscribe</button>
          </section>

          {/* All button variants */}
          <section className="tb-preview__buttons">
            <button type="button" className="btn btn--primary btn--sm">Primary</button>
            <button type="button" className="btn btn--secondary btn--sm">Secondary</button>
            <button type="button" className="btn btn--success btn--sm">Success</button>
            <button type="button" className="btn btn--danger btn--sm">Danger</button>
            <button type="button" className="btn btn--outline btn--sm">Outline</button>
            <button type="button" className="btn btn--ghost btn--sm">Ghost</button>
          </section>

          {/* Success alert */}
          <div className="alert alert--success" role="alert">
            <span className="alert__icon" aria-hidden="true">{'\u2713'}</span>
            <div className="alert__content">
              <p className="alert__message">Theme passes all accessibility checks.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -- Render: Main ---------------------------------------------------------

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <div className="tb-page">
      {/* Header */}
      <header className="tb-header">
        <div className="tb-header__left">
          <a href="./" className="tb-header__logo" aria-label="Aioli Home">
            <svg className="tb-header__logo-mark" width="28" height="28" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <path d="M60 2 Q32 12, 20 38 Q12 60, 24 78 Q36 92, 50 82 Q58 76, 58 66 Q58 60, 60 58" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
              <path d="M60 2 Q88 12, 100 38 Q108 60, 96 78 Q84 92, 70 82 Q62 76, 62 66 Q62 60, 60 58" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
              <path d="M36 106 Q28 88, 32 70 Q36 54, 46 48 Q54 44, 58 52 Q60 56, 60 58" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45"/>
              <path d="M84 106 Q92 88, 88 70 Q84 54, 74 48 Q66 44, 62 52 Q60 56, 60 58" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45"/>
              <circle cx="60" cy="58" r="8" fill="currentColor"/>
            </svg>
            <span className="tb-header__wordmark"><span className="tb-header__wordmark-ai">Ai</span>oli</span>
          </a>
          <span className="tb-header__separator" aria-hidden="true">/</span>
          <h1 className="tb-header__title">Theme Builder</h1>
        </div>
        <div className="tb-header__actions">
          <nav className="tb-header__nav" aria-label="Main navigation">
            <a href="docs.html" className="tb-header__nav-link">Docs</a>
            <a href="demo.html" className="tb-header__nav-link">Gallery</a>
            <a href="playground.html" className="tb-header__nav-link">Playground</a>
            <a href="theme.html" className="tb-header__nav-link tb-header__nav-link--active" aria-current="page">Themes</a>
          </nav>
          <button
            type="button"
            className="tb-header__toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
        </div>
      </header>

      {/* Wizard layout */}
      <div className="tb-wizard">
        {/* Left: step panel */}
        <div className="tb-steps">
          {/* Step indicator */}
          <div className="tb-indicator">
            {STEP_TITLES.map((title, i) => (
              <button
                key={i}
                type="button"
                className={`tb-indicator__dot${
                  i === state.currentStep ? ' tb-indicator__dot--active' : ''
                }${i <= state.furthestStep ? ' tb-indicator__dot--visited' : ''}`}
                onClick={() => dispatch({ type: 'GO_TO_STEP', step: i })}
                disabled={i > state.furthestStep}
                aria-label={`Step ${i + 1}: ${title}`}
              >
                <span className="tb-indicator__number">{i + 1}</span>
              </button>
            ))}
            <div className="tb-indicator__line" />
          </div>

          {/* Step heading */}
          <div className="tb-step-header">
            <h2 className="tb-step-header__title">{STEP_TITLES[state.currentStep]}</h2>
            <p className="tb-step-header__subtitle">{STEP_SUBTITLES[state.currentStep]}</p>
          </div>

          {/* Step content */}
          <div className="tb-step">
            {steps[state.currentStep]()}
          </div>

          {/* Navigation */}
          <div className="tb-nav">
            {state.currentStep > 0 ? (
              <button
                type="button"
                className="tb-nav__btn tb-nav__btn--prev"
                onClick={() => dispatch({ type: 'PREV_STEP' })}
              >
                {'\u2190'} Previous
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="tb-nav__btn tb-nav__btn--reset"
              onClick={() => dispatch({ type: 'RESET' })}
            >
              Reset
            </button>
            {state.currentStep < 3 ? (
              <button
                type="button"
                className="tb-nav__btn tb-nav__btn--next"
                onClick={() => dispatch({ type: 'NEXT_STEP' })}
              >
                Next {'\u2192'}
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>

        {/* Right: preview panel */}
        {renderPreview()}
      </div>
    </div>
  );
}
