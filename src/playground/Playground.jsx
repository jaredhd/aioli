/**
 * Aioli Design System -- Playground
 *
 * An interactive page where users type natural-language component descriptions
 * and see a live preview, generated HTML, token references, and accessibility
 * annotations — all powered by the component-generator agent.
 *
 * Uses the same dark-mode toggle pattern as Demo.jsx and Docs.jsx:
 *   document.documentElement.dataset.theme = 'dark' | delete
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import {
  COMPONENT_TEMPLATES,
  STYLE_MODIFIERS,
  PAGE_COMPOSITIONS,
  createComponentGenerator,
} from '../../agents/component-generator-agent.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Suggested prompts for the placeholder carousel / quick-pick chips. */
const SUGGESTIONS = [
  'large primary button with icon',
  'glassmorphic card with title',
  'gradient danger button',
  'neumorphic input field',
  'marketing landing page',
  'dashboard page with stats',
  'elevated product card on sale',
  'dark luxury pricing table',
  'animated feature grid',
  'brutalist alert notification',
  'ai chat bubble',
  'confidence score meter',
  'agent status pipeline',
  'tool call card',
];

/** Instantiate a generator once (no token/motion agents needed for preview). */
const generator = createComponentGenerator();

// ---------------------------------------------------------------------------
// Main Playground component
// ---------------------------------------------------------------------------

export default function Playground() {
  // -- State ----------------------------------------------------------------

  const { darkMode, toggleDarkMode } = useDarkMode();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');
  const inputRef = useRef(null);

  // -- Generate from prompt -------------------------------------------------

  const handleGenerate = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setError(null);
    const output = generator.generateFromDescription(trimmed);

    if (output.error) {
      setError(output.message || 'Could not parse component description.');
      setResult(null);
    } else {
      setResult(output);
      setActiveTab('preview');
    }
  }, [prompt]);

  // -- Key handler (Enter to generate) --------------------------------------

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  // -- Quick-pick suggestion ------------------------------------------------

  const handleSuggestion = useCallback((text) => {
    setPrompt(text);
    setError(null);

    const output = generator.generateFromDescription(text);
    if (output.error) {
      setError(output.message || 'Could not parse component description.');
      setResult(null);
    } else {
      setResult(output);
      setActiveTab('preview');
    }
    inputRef.current?.focus();
  }, []);

  // -- Available components list --------------------------------------------

  const componentList = useMemo(
    () =>
      Object.entries(COMPONENT_TEMPLATES).map(([name, tpl]) => ({
        name,
        category: tpl.category,
        description: tpl.description,
      })),
    []
  );

  // -- Pretty print HTML ---------------------------------------------------

  const prettyHtml = useMemo(() => {
    if (!result?.html) return '';
    return result.html
      .replace(/^\s*\n/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }, [result]);

  // -- Render ---------------------------------------------------------------

  return (
    <div className="pg-page">
      {/* ================================================================= */}
      {/* HEADER                                                            */}
      {/* ================================================================= */}
      <header className="pg-header">
        <div className="pg-header__left">
          <a href="./" className="pg-header__logo" aria-label="Aioli Home">
            <svg className="pg-header__logo-mark" width="28" height="28" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <path d="M60 2 Q32 12, 20 38 Q12 60, 24 78 Q36 92, 50 82 Q58 76, 58 66 Q58 60, 60 58" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
              <path d="M60 2 Q88 12, 100 38 Q108 60, 96 78 Q84 92, 70 82 Q62 76, 62 66 Q62 60, 60 58" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
              <path d="M36 106 Q28 88, 32 70 Q36 54, 46 48 Q54 44, 58 52 Q60 56, 60 58" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45"/>
              <path d="M84 106 Q92 88, 88 70 Q84 54, 74 48 Q66 44, 62 52 Q60 56, 60 58" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45"/>
              <circle cx="60" cy="58" r="8" fill="currentColor"/>
            </svg>
            <span className="pg-header__wordmark"><span className="pg-header__wordmark-ai">Ai</span>oli</span>
          </a>
          <span className="pg-header__separator" aria-hidden="true">/</span>
          <h1 className="pg-header__title">Playground</h1>
        </div>

        <div className="pg-header__actions">
          <nav className="pg-header__nav" aria-label="Main navigation">
            <a href="docs.html" className="pg-header__nav-link">Docs</a>
            <a href="demo.html" className="pg-header__nav-link">Gallery</a>
            <a href="playground.html" className="pg-header__nav-link pg-header__nav-link--active" aria-current="page">Playground</a>
            <a href="theme.html" className="pg-header__nav-link">Themes</a>
          </nav>
          <button
            type="button"
            className="pg-header__toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* PROMPT BAR                                                        */}
      {/* ================================================================= */}
      <section className="pg-prompt">
        <label htmlFor="pg-input" className="pg-prompt__label">
          Describe any component or full page &mdash; Aioli generates accessible, themed HTML for free
        </label>

        <div className="pg-prompt__bar">
          <input
            ref={inputRef}
            id="pg-input"
            type="text"
            className="pg-prompt__input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "large danger button with icon"'
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="pg-prompt__btn"
            onClick={handleGenerate}
            disabled={!prompt.trim()}
          >
            Generate
          </button>
        </div>

        {/* -- Suggestion chips ------------------------------------------ */}
        <div className="pg-prompt__suggestions" role="list" aria-label="Suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="pg-prompt__chip"
              onClick={() => handleSuggestion(s)}
              role="listitem"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* RESULT AREA                                                       */}
      {/* ================================================================= */}
      <div className="pg-result">
        {error && (
          <div className="pg-result__error" role="alert">
            <strong>Could not generate:</strong> {error}
          </div>
        )}

        {!result && !error && (
          <div className="pg-result__empty">
            <p className="pg-result__empty-icon" aria-hidden="true">&#x1F9EA;</p>
            <p className="pg-result__empty-text">
              Type a description above and press <kbd>Enter</kbd> or click
              <strong> Generate</strong> to see a live component.
            </p>
            <p className="pg-result__empty-hint">
              Supports {componentList.length} component types across atoms,
              molecules, and organisms.
            </p>
          </div>
        )}

        {result && (
          <>
            {/* -- Tab bar ----------------------------------------------- */}
            <nav className="pg-tabs" aria-label="Result tabs">
              {['preview', 'html', 'tokens', 'a11y'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`pg-tabs__btn${activeTab === tab ? ' pg-tabs__btn--active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={activeTab === tab}
                >
                  {tab === 'preview' && 'Preview'}
                  {tab === 'html' && 'HTML'}
                  {tab === 'tokens' && 'Tokens'}
                  {tab === 'a11y' && 'Accessibility'}
                </button>
              ))}
            </nav>

            {/* -- Metadata bar ------------------------------------------ */}
            <div className="pg-result__meta">
              <span className="pg-result__meta-type">
                {result.type === 'page-composition' ? '📄 Page' : `🧩 ${result.category || 'Component'}`}
                {result.type !== 'page-composition' && result.type && (
                  <code className="pg-result__meta-name">{result.type}</code>
                )}
              </span>
              {result.pageType && (
                <span className="pg-result__meta-badge pg-result__meta-badge--page">
                  {result.pageType}
                </span>
              )}
              {result.styleModifiers && result.styleModifiers.map((mod) => (
                <span key={mod} className="pg-result__meta-badge pg-result__meta-badge--modifier">
                  ✨ {mod}
                </span>
              ))}
              {result.sectionCount && (
                <span className="pg-result__meta-badge">
                  {result.sectionCount} sections
                </span>
              )}
            </div>

            {/* -- Preview panel ----------------------------------------- */}
            {activeTab === 'preview' && (
              <div className="pg-panel pg-panel--preview">
                <div
                  className="pg-panel__render"
                  dangerouslySetInnerHTML={{ __html: result.html }}
                />
              </div>
            )}

            {/* -- HTML panel -------------------------------------------- */}
            {activeTab === 'html' && (
              <div className="pg-panel pg-panel--code">
                <div className="pg-panel__code-header">
                  <span className="pg-panel__code-lang">HTML</span>
                  <button
                    type="button"
                    className="pg-panel__code-copy"
                    onClick={() => navigator.clipboard.writeText(prettyHtml)}
                  >
                    Copy
                  </button>
                </div>
                <pre className="pg-panel__pre">
                  <code>{prettyHtml}</code>
                </pre>
              </div>
            )}

            {/* -- Tokens panel ------------------------------------------ */}
            {activeTab === 'tokens' && (
              <div className="pg-panel pg-panel--tokens">
                <h3 className="pg-panel__heading">Referenced Tokens</h3>
                {result.tokens && result.tokens.length > 0 ? (
                  <ul className="pg-panel__token-list">
                    {result.tokens.map((t, i) => (
                      <li key={i} className="pg-panel__token-item">
                        <code>{t}</code>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="pg-panel__empty">No tokens referenced.</p>
                )}
              </div>
            )}

            {/* -- Accessibility panel ----------------------------------- */}
            {activeTab === 'a11y' && (
              <div className="pg-panel pg-panel--a11y">
                <h3 className="pg-panel__heading">Accessibility Notes</h3>
                {result.a11y ? (
                  <dl className="pg-panel__a11y-list">
                    {Object.entries(result.a11y).map(([key, value]) => (
                      <div key={key} className="pg-panel__a11y-item">
                        <dt className="pg-panel__a11y-key">{key}</dt>
                        <dd className="pg-panel__a11y-value">
                          {typeof value === 'object'
                            ? JSON.stringify(value, null, 2)
                            : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="pg-panel__empty">No accessibility data.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ================================================================= */}
      {/* COMPONENT REFERENCE (collapsible)                                 */}
      {/* ================================================================= */}
      <details className="pg-reference">
        <summary className="pg-reference__summary">
          Available Components ({componentList.length})
        </summary>
        <div className="pg-reference__grid">
          {componentList.map((c) => (
            <button
              key={c.name}
              type="button"
              className="pg-reference__item"
              onClick={() => handleSuggestion(c.name)}
            >
              <span className="pg-reference__name">{c.name}</span>
              <span className={`pg-reference__badge pg-reference__badge--${c.category}`}>
                {c.category}
              </span>
            </button>
          ))}
        </div>
      </details>

      {/* ================================================================= */}
      {/* STYLE MODIFIERS REFERENCE                                          */}
      {/* ================================================================= */}
      <details className="pg-reference">
        <summary className="pg-reference__summary">
          Style Modifiers ({Object.keys(STYLE_MODIFIERS).length})
        </summary>
        <div className="pg-reference__grid">
          {Object.entries(STYLE_MODIFIERS).map(([name, mod]) => (
            <button
              key={name}
              type="button"
              className="pg-reference__item"
              onClick={() => handleSuggestion(`${name} card with title`)}
            >
              <span className="pg-reference__name">{name}</span>
              <span className="pg-reference__badge pg-reference__badge--modifier">
                modifier
              </span>
            </button>
          ))}
        </div>
      </details>

      {/* ================================================================= */}
      {/* PAGE COMPOSITIONS REFERENCE                                        */}
      {/* ================================================================= */}
      <details className="pg-reference">
        <summary className="pg-reference__summary">
          Page Compositions ({Object.keys(PAGE_COMPOSITIONS).length})
        </summary>
        <div className="pg-reference__grid">
          {Object.entries(PAGE_COMPOSITIONS).map(([name, comp]) => (
            <button
              key={name}
              type="button"
              className="pg-reference__item"
              onClick={() => handleSuggestion(comp.keywords[0])}
            >
              <span className="pg-reference__name">{name}</span>
              <span className="pg-reference__badge pg-reference__badge--template">
                {comp.components.length} sections
              </span>
            </button>
          ))}
        </div>
      </details>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <footer className="pg-footer">
        <p className="pg-footer__text">
          Aioli is free and open source. The same AI-powered design tools that
          premium platforms charge for &mdash; accessible to everyone.
        </p>
        <p className="pg-footer__license">
          MIT License &mdash; Free forever. That&apos;s the point.
        </p>
      </footer>
    </div>
  );
}
