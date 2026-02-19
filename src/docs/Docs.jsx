/**
 * Aioli Design System -- Documentation Site Shell
 *
 * Main layout component for the Aioli documentation page. Provides:
 *   - Sticky header with dark-mode toggle and gallery link
 *   - Fixed left sidebar with scroll-spy navigation
 *   - Responsive mobile hamburger overlay
 *   - Main content area that renders all eight section components
 *
 * Follows the same dark-mode toggle pattern as Demo.jsx:
 *   document.documentElement.dataset.theme = 'dark' | delete
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

// ---------------------------------------------------------------------------
// Section components (one per documentation chapter)
// ---------------------------------------------------------------------------

import GettingStarted from './sections/GettingStarted';
import TokenArchitecture from './sections/TokenArchitecture';
import ComponentReference from './sections/ComponentReference';
import ThemingAPI from './sections/ThemingAPI';
import CLIReference from './sections/CLIReference';
import Accessibility from './sections/Accessibility';
import MotionStandards from './sections/MotionStandards';
import AgentSystem from './sections/AgentSystem';

// ---------------------------------------------------------------------------
// Navigation definition
// ---------------------------------------------------------------------------

const NAV_SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'token-architecture', label: 'Token System' },
  { id: 'components', label: 'Components' },
  { id: 'theming', label: 'Theming API' },
  { id: 'cli', label: 'CLI Reference' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'motion', label: 'Motion Standards' },
  { id: 'agents', label: 'Agent System' },
];

// ---------------------------------------------------------------------------
// Main Docs component
// ---------------------------------------------------------------------------

export default function Docs() {
  // -- State ----------------------------------------------------------------

  const { darkMode, toggleDarkMode } = useDarkMode();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // -- Mobile sidebar toggle ------------------------------------------------

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // -- Scroll-spy via IntersectionObserver ----------------------------------

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );

    document.querySelectorAll('.docs-section').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // -- Close sidebar on nav click (mobile) ----------------------------------

  const handleNavClick = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // -- Render ---------------------------------------------------------------

  return (
    <div className="docs-page">
      {/* ================================================================= */}
      {/* HEADER                                                            */}
      {/* ================================================================= */}
      <header className="docs-header">
        <div className="docs-header__left">
          <button
            type="button"
            className="docs-header__hamburger"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={sidebarOpen}
          >
            <span className="docs-header__hamburger-line" />
            <span className="docs-header__hamburger-line" />
            <span className="docs-header__hamburger-line" />
          </button>

          <a href="./" className="docs-header__logo" aria-label="Aioli Home">
            <svg className="docs-header__logo-mark" width="28" height="28" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <path d="M60 2 Q32 12, 20 38 Q12 60, 24 78 Q36 92, 50 82 Q58 76, 58 66 Q58 60, 60 58" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
              <path d="M60 2 Q88 12, 100 38 Q108 60, 96 78 Q84 92, 70 82 Q62 76, 62 66 Q62 60, 60 58" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
              <path d="M36 106 Q28 88, 32 70 Q36 54, 46 48 Q54 44, 58 52 Q60 56, 60 58" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45"/>
              <path d="M84 106 Q92 88, 88 70 Q84 54, 74 48 Q66 44, 62 52 Q60 56, 60 58" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45"/>
              <circle cx="60" cy="58" r="8" fill="currentColor"/>
            </svg>
            <span className="docs-header__wordmark"><span className="docs-header__wordmark-ai">Ai</span>oli</span>
          </a>
          <span className="docs-header__separator" aria-hidden="true">/</span>
          <h1 className="docs-header__title">Docs</h1>
        </div>

        <div className="docs-header__actions">
          <nav className="docs-header__nav" aria-label="Main navigation">
            <a href="docs.html" className="docs-header__nav-link docs-header__nav-link--active" aria-current="page">Docs</a>
            <a href="demo.html" className="docs-header__nav-link">Gallery</a>
            <a href="playground.html" className="docs-header__nav-link">Playground</a>
            <a href="theme.html" className="docs-header__nav-link">Themes</a>
          </nav>
          <button
            type="button"
            className="docs-header__toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* LAYOUT: SIDEBAR + MAIN                                            */}
      {/* ================================================================= */}
      <div className="docs-layout">
        {/* -- Sidebar backdrop (mobile) --------------------------------- */}
        {sidebarOpen && (
          <div
            className="docs-sidebar__backdrop"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* -- Sidebar --------------------------------------------------- */}
        <aside
          className={`docs-sidebar${sidebarOpen ? ' docs-sidebar--open' : ''}`}
          role="navigation"
          aria-label="Documentation sections"
        >
          <nav className="docs-sidebar__nav">
            {NAV_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`docs-sidebar__link${
                  activeSection === section.id ? ' docs-sidebar__link--active' : ''
                }`}
                onClick={handleNavClick}
              >
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* -- Main content ---------------------------------------------- */}
        <main className="docs-main">
          <GettingStarted />
          <TokenArchitecture />
          <ComponentReference />
          <ThemingAPI />
          <CLIReference />
          <Accessibility />
          <MotionStandards />
          <AgentSystem />
        </main>
      </div>
    </div>
  );
}
