/**
 * Aioli Design System -- Theme Builder
 *
 * Interactive page for customising Aioli's design tokens in real-time.
 * Features:
 * - 6 named theme presets (Default, Glass, Neumorphic, Brutalist, Gradient, Dark Luxury)
 * - Smart palette auto-derivation from a single primary color
 * - Manual color, radius, and typography controls
 * - Live component preview
 * - CSS/JSON export
 *
 * Uses the theming API from lib/theme.js and lib/theme-presets.js.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createTheme, createDarkTheme } from '../../lib/theme.js';
import { THEME_PRESETS, derivePalette, listPresets } from '../../lib/theme-presets.js';
import { COMPONENT_TEMPLATES } from '../../agents/component-generator-agent.js';
import { useDarkMode } from '../hooks/useDarkMode';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Color controls exposed in the builder. */
const COLOR_CONTROLS = [
  { label: 'Primary', token: 'semantic.color.primary.default', defaultValue: '#2563eb' },
  { label: 'Success', token: 'semantic.color.success.default', defaultValue: '#047857' },
  { label: 'Warning', token: 'semantic.color.warning.default', defaultValue: '#b45309' },
  { label: 'Danger',  token: 'semantic.color.danger.default',  defaultValue: '#b91c1c' },
  { label: 'Info',    token: 'semantic.color.info.default',    defaultValue: '#2563eb' },
];

/** Radius presets. */
const RADIUS_PRESETS = [
  { label: 'None',   value: '0px' },
  { label: 'Small',  value: '4px' },
  { label: 'Medium', value: '8px' },
  { label: 'Large',  value: '12px' },
  { label: 'Full',   value: '9999px' },
];

/** Font presets. */
const FONT_PRESETS = [
  { label: 'System', value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { label: 'Inter',  value: "'Inter', system-ui, sans-serif" },
  { label: 'Mono',   value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: 'Serif',  value: "'Georgia', 'Times New Roman', serif" },
];

/** Sample components to render in the preview. */
const PREVIEW_COMPONENTS = ['button', 'card', 'alert', 'badge', 'input', 'tabs'];

/** Default props for preview components. */
const COMPONENT_DEFAULTS = {
  button:  { children: 'Button', variant: 'primary', size: 'md' },
  card:    { title: 'Card Title', content: 'Card body text goes here.' },
  alert:   { variant: 'info', message: 'This is an informational alert.' },
  badge:   { children: 'Badge', variant: 'primary' },
  input:   { label: 'Label', placeholder: 'Placeholder...' },
  tabs:    {},
};

/** Preset metadata with emoji icons. */
const PRESET_INFO = [
  { name: 'default', emoji: '\u2728', label: 'Clean' },
  { name: 'glass', emoji: '\uD83E\uDE9F', label: 'Glass' },
  { name: 'neumorphic', emoji: '\uD83D\uDCA0', label: 'Neumorphic' },
  { name: 'brutalist', emoji: '\u26A1', label: 'Brutalist' },
  { name: 'gradient', emoji: '\uD83C\uDF08', label: 'Gradient' },
  { name: 'darkLuxury', emoji: '\uD83D\uDC51', label: 'Dark Luxury' },
];

// ---------------------------------------------------------------------------
// Main ThemeBuilder component
// ---------------------------------------------------------------------------

export default function ThemeBuilder() {
  // -- State ----------------------------------------------------------------

  const { darkMode, toggleDarkMode, setDarkMode } = useDarkMode();
  const [activePreset, setActivePreset] = useState('default');
  const [smartDerive, setSmartDerive] = useState(false);
  const [colors, setColors] = useState(() =>
    Object.fromEntries(COLOR_CONTROLS.map((c) => [c.token, c.defaultValue]))
  );
  const [radius, setRadius] = useState('8px');
  const [font, setFont] = useState(FONT_PRESETS[0].value);
  const [activeExportTab, setActiveExportTab] = useState('css');

  // -- Preset selection -----------------------------------------------------

  const handlePresetChange = useCallback((presetName) => {
    setActivePreset(presetName);

    // If the preset has custom surface colors, apply them (like darkLuxury)
    const preset = THEME_PRESETS[presetName];
    if (!preset) return;

    // Reset colors to defaults when switching presets
    setColors(Object.fromEntries(COLOR_CONTROLS.map((c) => [c.token, c.defaultValue])));

    // Apply preset-specific radius if defined
    const presetRadius = preset.overrides['primitive.radius.md'];
    if (presetRadius) {
      setRadius(presetRadius);
    }

    // DarkLuxury sets dark mode automatically
    if (presetName === 'darkLuxury') {
      if (!darkMode) {
        setDarkMode(true);
      }
    }
  }, [darkMode]);

  // -- Build overrides from current state -----------------------------------

  const overrides = useMemo(() => {
    // Start with preset overrides
    const preset = THEME_PRESETS[activePreset];
    const o = { ...(preset ? preset.overrides : {}) };

    // Apply smart derivation if enabled
    if (smartDerive && colors['semantic.color.primary.default']) {
      const derived = derivePalette(colors['semantic.color.primary.default']);
      Object.assign(o, derived);
    }

    // Apply manual color overrides (on top of preset)
    Object.assign(o, colors);

    // Radius overrides
    o['primitive.radius.sm'] = radius === '0px' ? '0px' : `calc(${radius} * 0.5)`;
    o['primitive.radius.md'] = radius;
    o['primitive.radius.lg'] = `calc(${radius} * 1.5)`;
    o['primitive.radius.xl'] = `calc(${radius} * 2)`;

    // Font override
    o['primitive.font.family.sans'] = font;

    return o;
  }, [colors, radius, font, activePreset, smartDerive]);

  // -- Apply theme live on every change ------------------------------------
  // Uses <style> tag injection instead of inline styles so that
  // [data-theme="dark"] CSS rules can still override correctly.

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-aioli-theme', 'builder');

    const lightTheme = createTheme(overrides);
    let css = lightTheme.toCSS();

    // When dark mode is active, also inject dark-mode overrides so preset
    // surface/border/text values get properly remapped to dark variants.
    // We must filter OUT any light-mode surface/border/text overrides from
    // the preset, otherwise they overwrite DARK_MODE_DEFAULTS and the
    // surfaces stay light (e.g. Glass's white rgba cards in dark mode).
    if (darkMode) {
      const darkSafe = Object.fromEntries(
        Object.entries(overrides).filter(([key]) =>
          !key.startsWith('semantic.surface.') &&
          !key.startsWith('semantic.border.') &&
          !key.startsWith('semantic.text.')
        )
      );
      const darkTheme = createDarkTheme(darkSafe);
      css += '\n' + darkTheme.toCSS();
    }

    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
    };
  }, [overrides, darkMode]);

  // -- Export strings -------------------------------------------------------

  const exportCSS = useMemo(() => {
    const theme = createTheme(overrides);
    return theme.toCSS();
  }, [overrides]);

  const exportJSON = useMemo(() => {
    const theme = createTheme(overrides);
    return JSON.stringify(theme.toJSON(), null, 2);
  }, [overrides]);

  // -- Color change handler ------------------------------------------------

  const handleColorChange = useCallback((token, value) => {
    setColors((prev) => ({ ...prev, [token]: value }));
  }, []);

  // -- Reset to defaults ---------------------------------------------------

  const handleReset = useCallback(() => {
    setActivePreset('default');
    setSmartDerive(false);
    setColors(Object.fromEntries(COLOR_CONTROLS.map((c) => [c.token, c.defaultValue])));
    setRadius('8px');
    setFont(FONT_PRESETS[0].value);
    if (darkMode) {
      setDarkMode(false);
    }
  }, [darkMode]);

  // -- Copy to clipboard ---------------------------------------------------

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text);
  }, []);

  // -- Render component preview --------------------------------------------

  function renderPreview(name) {
    const tmpl = COMPONENT_TEMPLATES[name];
    if (!tmpl) return null;

    try {
      const defaults = COMPONENT_DEFAULTS[name] || {};
      const result = typeof tmpl.template === 'function'
        ? tmpl.template(defaults)
        : { html: tmpl.template || '' };
      const html = result.html || result;

      return (
        <div key={name} className="tb-preview__item">
          <div className="tb-preview__label">{name}</div>
          <div
            className="tb-preview__render"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      );
    } catch {
      return null;
    }
  }

  // -- Render ---------------------------------------------------------------

  return (
    <div className="tb-page">
      {/* ================================================================= */}
      {/* HEADER                                                            */}
      {/* ================================================================= */}
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
          <h1 className="tb-header__title">Themes</h1>
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

      {/* ================================================================= */}
      {/* LAYOUT: CONTROLS + PREVIEW                                        */}
      {/* ================================================================= */}
      <div className="tb-layout">
        {/* -- Controls panel -------------------------------------------- */}
        <aside className="tb-controls">
          {/* -- Preset selection --------------------------------------- */}
          <div className="tb-controls__section">
            <h2 className="tb-controls__heading">Design Preset</h2>
            <div className="tb-controls__preset-grid">
              {PRESET_INFO.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={`tb-controls__preset${activePreset === p.name ? ' tb-controls__preset--active' : ''}`}
                  onClick={() => handlePresetChange(p.name)}
                  aria-pressed={activePreset === p.name}
                >
                  <span className="tb-controls__preset-emoji" aria-hidden="true">{p.emoji}</span>
                  <span className="tb-controls__preset-label">{p.label}</span>
                </button>
              ))}
            </div>
            {activePreset !== 'default' && (
              <p className="tb-controls__preset-desc">
                {THEME_PRESETS[activePreset]?.description}
              </p>
            )}
          </div>

          {/* -- Smart derivation toggle ------------------------------- */}
          <div className="tb-controls__section">
            <div className="tb-controls__smart-row">
              <label className="tb-controls__heading" htmlFor="smart-derive">
                Smart Palette
              </label>
              <button
                type="button"
                id="smart-derive"
                role="switch"
                aria-checked={smartDerive}
                className={`tb-controls__toggle${smartDerive ? ' tb-controls__toggle--on' : ''}`}
                onClick={() => setSmartDerive((prev) => !prev)}
              >
                <span className="tb-controls__toggle-thumb" />
              </button>
            </div>
            <p className="tb-controls__hint">
              {smartDerive
                ? 'Auto-deriving hover, active, subtle, muted, gradients, and shadows from your primary color.'
                : 'Enable to auto-generate a full palette from your primary color.'}
            </p>
          </div>

          {/* -- Color controls ---------------------------------------- */}
          <div className="tb-controls__section">
            <h2 className="tb-controls__heading">Colors</h2>
            {COLOR_CONTROLS.map((ctrl) => (
              <div key={ctrl.token} className="tb-controls__field">
                <label className="tb-controls__label" htmlFor={`color-${ctrl.label}`}>
                  {ctrl.label}
                </label>
                <div className="tb-controls__color-row">
                  <input
                    id={`color-${ctrl.label}`}
                    type="color"
                    className="tb-controls__color-picker"
                    value={colors[ctrl.token]}
                    onChange={(e) => handleColorChange(ctrl.token, e.target.value)}
                  />
                  <input
                    type="text"
                    className="tb-controls__color-text"
                    value={colors[ctrl.token]}
                    onChange={(e) => handleColorChange(ctrl.token, e.target.value)}
                    spellCheck={false}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="tb-controls__section">
            <h2 className="tb-controls__heading">Border Radius</h2>
            <div className="tb-controls__chips">
              {RADIUS_PRESETS.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  className={`tb-controls__chip${radius === r.value ? ' tb-controls__chip--active' : ''}`}
                  onClick={() => setRadius(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tb-controls__section">
            <h2 className="tb-controls__heading">Typography</h2>
            <div className="tb-controls__chips">
              {FONT_PRESETS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  className={`tb-controls__chip${font === f.value ? ' tb-controls__chip--active' : ''}`}
                  onClick={() => setFont(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="tb-controls__reset"
            onClick={handleReset}
          >
            Reset to Defaults
          </button>
        </aside>

        {/* -- Preview panel --------------------------------------------- */}
        <main className="tb-main">
          <h2 className="tb-main__heading">Live Preview</h2>
          <div className="tb-preview__grid">
            {PREVIEW_COMPONENTS.map((name) => renderPreview(name))}
          </div>

          {/* -- Export section ----------------------------------------- */}
          <div className="tb-export">
            <div className="tb-export__tabs">
              <button
                type="button"
                className={`tb-export__tab${activeExportTab === 'css' ? ' tb-export__tab--active' : ''}`}
                onClick={() => setActiveExportTab('css')}
              >
                CSS
              </button>
              <button
                type="button"
                className={`tb-export__tab${activeExportTab === 'json' ? ' tb-export__tab--active' : ''}`}
                onClick={() => setActiveExportTab('json')}
              >
                JSON
              </button>
            </div>

            <div className="tb-export__panel">
              <div className="tb-export__header">
                <span className="tb-export__lang">
                  {activeExportTab === 'css' ? 'CSS' : 'JSON'}
                </span>
                <button
                  type="button"
                  className="tb-export__copy"
                  onClick={() => handleCopy(activeExportTab === 'css' ? exportCSS : exportJSON)}
                >
                  Copy
                </button>
              </div>
              <pre className="tb-export__pre">
                <code>{activeExportTab === 'css' ? exportCSS : exportJSON}</code>
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
