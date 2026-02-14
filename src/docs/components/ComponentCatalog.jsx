import React, { useState, useMemo } from 'react';
import { COMPONENT_TEMPLATES } from '../../../agents/component-generator-agent.js';

// ---------------------------------------------------------------------------
// Build the component list from the template registry
// ---------------------------------------------------------------------------

const COMPONENTS = Object.entries(COMPONENT_TEMPLATES).map(([name, tpl]) => ({
  name,
  category: tpl.category,
  description: tpl.description,
}));

// ---------------------------------------------------------------------------
// Category filter options
// ---------------------------------------------------------------------------

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'atom', label: 'Atoms' },
  { key: 'molecule', label: 'Molecules' },
  { key: 'organism', label: 'Organisms' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ComponentCatalog() {
  const [expandedComponent, setExpandedComponent] = useState(null);
  const [filter, setFilter] = useState('all');

  // Filtered list
  const filteredComponents = useMemo(() => {
    if (filter === 'all') return COMPONENTS;
    return COMPONENTS.filter((c) => c.category === filter);
  }, [filter]);

  // Toggle expanded row
  function handleRowClick(name) {
    setExpandedComponent((prev) => (prev === name ? null : name));
  }

  // Safely generate preview HTML from a template
  function getPreviewHtml(name) {
    const tpl = COMPONENT_TEMPLATES[name];
    if (!tpl || typeof tpl.template !== 'function') {
      return { html: '<!-- Template not available -->', error: null };
    }
    try {
      const result = tpl.template({});
      return { html: result.html || '', error: null };
    } catch (err) {
      return { html: '', error: err.message };
    }
  }

  // Badge modifier class based on category
  function badgeModifier(category) {
    switch (category) {
      case 'atom':
        return 'docs-catalog__badge--atom';
      case 'molecule':
        return 'docs-catalog__badge--molecule';
      case 'organism':
        return 'docs-catalog__badge--organism';
      default:
        return '';
    }
  }

  return (
    <div className="docs-catalog">
      {/* Filter bar */}
      <div className="docs-catalog__filters">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`docs-catalog__filter-btn${filter === opt.key ? ' docs-catalog__filter-btn--active' : ''}`}
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
          </button>
        ))}
        <span className="docs-catalog__count">
          {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <table className="docs-catalog__table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {filteredComponents.map((comp) => {
            const isExpanded = expandedComponent === comp.name;
            const preview = isExpanded ? getPreviewHtml(comp.name) : null;

            return (
              <React.Fragment key={comp.name}>
                {/* Main row */}
                <tr
                  className={`docs-catalog__row${isExpanded ? ' docs-catalog__row--expanded' : ''}`}
                  onClick={() => handleRowClick(comp.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(comp.name);
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  <td>{comp.name}</td>
                  <td>
                    <span className={`docs-catalog__badge ${badgeModifier(comp.category)}`}>
                      {comp.category}
                    </span>
                  </td>
                  <td>{comp.description}</td>
                </tr>

                {/* Expanded detail row */}
                {isExpanded && (
                  <tr className="docs-catalog__detail-row">
                    <td colSpan={3}>
                      <div className="docs-catalog__preview">
                        <h4 className="docs-catalog__preview-heading">Preview</h4>
                        {preview.error ? (
                          <p className="docs-catalog__error">
                            Error rendering template: {preview.error}
                          </p>
                        ) : (
                          <div
                            className="docs-catalog__preview-render"
                            dangerouslySetInnerHTML={{ __html: preview.html }}
                          />
                        )}

                        <h4 className="docs-catalog__code-heading">HTML</h4>
                        <div className="docs-catalog__code">
                          <pre>
                            <code>{preview.error ? `// ${preview.error}` : preview.html}</code>
                          </pre>
                        </div>

                        <a
                          className="docs-catalog__gallery-link"
                          href="demo.html"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View in Gallery &rarr;
                        </a>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
