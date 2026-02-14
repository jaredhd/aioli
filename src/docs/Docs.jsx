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

  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // -- Dark mode toggle -----------------------------------------------------

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.dataset.theme = 'dark';
      } else {
        delete document.documentElement.dataset.theme;
      }
      return next;
    });
  }, []);

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

          <h1 className="docs-header__title">
            <span role="img" aria-label="garlic">&#x1F9C4;</span>{' '}
            Aioli Documentation
          </h1>
        </div>

        <div className="docs-header__actions">
          <button
            type="button"
            className="docs-header__toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>

          <a href="demo.html" className="docs-header__link">
            Component Gallery &rarr;
          </a>
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
