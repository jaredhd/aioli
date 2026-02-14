/**
 * Aioli Design System — Component Gallery
 *
 * A visual catalog of all 31 Aioli components rendered from the
 * component-generator-agent templates.  Each section shows variants,
 * sizes, states, and a collapsible raw-HTML code panel.
 *
 * Because the full agent system (createAioliKit) depends on Node.js
 * modules (fs, path), we import COMPONENT_TEMPLATES directly and call
 * each template function in the browser to obtain { html, tokens, a11y }.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { COMPONENT_TEMPLATES } from '../../agents/component-generator-agent.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Capitalise a hyphenated component name: "form-group" -> "Form Group" */
function formatName(name) {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Safely call a template, returning the html string (or an error note). */
function renderTemplate(name, props = {}) {
  try {
    const tpl = COMPONENT_TEMPLATES[name];
    if (!tpl) return { html: `<!-- unknown component: ${name} -->` };
    const result = tpl.template(props);
    return result;
  } catch (err) {
    return { html: `<!-- error rendering ${name}: ${err.message} -->` };
  }
}

/** Pretty-print HTML for the code panel (light indentation cleanup). */
function prettyHTML(raw) {
  return raw
    .replace(/^\s*\n/gm, '')     // remove blank lines
    .replace(/\n{3,}/g, '\n\n'); // collapse multiple blank lines
}

// ---------------------------------------------------------------------------
// Component category map (order matters for display)
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'atom', label: 'Atoms' },
  { key: 'molecule', label: 'Molecules' },
  { key: 'organism', label: 'Organisms' },
];

// ---------------------------------------------------------------------------
// Per-component demo definitions
//
// Each entry describes which props to pass for the variant/size/state
// showcases so every component renders meaningfully.
// ---------------------------------------------------------------------------

const COMPONENT_DEMOS = [
  // ===== ATOMS (15) =======================================================

  {
    name: 'button',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'primary', children: 'Primary' },
          { variant: 'secondary', children: 'Secondary' },
          { variant: 'danger', children: 'Danger' },
          { variant: 'ghost', children: 'Ghost' },
        ],
      },
      {
        label: 'Sizes',
        items: [
          { variant: 'primary', size: 'sm', children: 'Small' },
          { variant: 'primary', size: 'md', children: 'Medium' },
          { variant: 'primary', size: 'lg', children: 'Large' },
        ],
      },
      {
        label: 'States',
        items: [
          { variant: 'primary', disabled: true, children: 'Disabled' },
        ],
      },
    ],
  },

  {
    name: 'input',
    showcases: [
      {
        label: 'Variants',
        items: [
          { label: 'Username', placeholder: 'Enter username', id: 'demo-input-1' },
          { label: 'Email', type: 'email', placeholder: 'you@example.com', required: true, id: 'demo-input-2' },
          { label: 'Password', type: 'password', error: 'This field is required', id: 'demo-input-3' },
        ],
      },
    ],
  },

  {
    name: 'badge',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'default', children: 'Default' },
          { variant: 'primary', children: 'Primary' },
          { variant: 'success', children: 'Success' },
          { variant: 'warning', children: 'Warning' },
          { variant: 'danger', children: 'Danger' },
        ],
      },
      {
        label: 'Dot',
        items: [
          { variant: 'primary', dot: true },
        ],
      },
    ],
  },

  {
    name: 'avatar',
    showcases: [
      {
        label: 'Sizes (fallback)',
        items: [
          { size: 'xs', alt: 'Alice', fallback: 'A' },
          { size: 'sm', alt: 'Bob', fallback: 'B' },
          { size: 'md', alt: 'Carla', fallback: 'C' },
          { size: 'lg', alt: 'Dan', fallback: 'D' },
          { size: 'xl', alt: 'Eve', fallback: 'E' },
        ],
      },
    ],
  },

  {
    name: 'spinner',
    showcases: [
      {
        label: 'Sizes',
        items: [
          { size: 'sm' },
          { size: 'md' },
          { size: 'lg' },
        ],
      },
    ],
  },

  {
    name: 'link',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'default', children: 'Default Link', href: '#' },
          { variant: 'subtle', children: 'Subtle Link', href: '#' },
          { variant: 'inverse', children: 'Inverse Link', href: '#' },
        ],
      },
      {
        label: 'External',
        items: [
          { children: 'External Link', href: 'https://example.com', external: true },
        ],
      },
    ],
  },

  {
    name: 'chip',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'filled', children: 'Filled' },
          { variant: 'outlined', children: 'Outlined' },
          { variant: 'primary', children: 'Primary' },
          { variant: 'success', children: 'Success' },
          { variant: 'danger', children: 'Danger' },
        ],
      },
      {
        label: 'Removable',
        items: [
          { variant: 'primary', children: 'Removable', removable: true },
        ],
      },
    ],
  },

  {
    name: 'divider',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'default' },
          { variant: 'subtle' },
          { variant: 'strong' },
        ],
      },
      {
        label: 'With Label',
        items: [
          { variant: 'default', label: 'OR' },
        ],
      },
    ],
  },

  {
    name: 'skeleton',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'text', lines: 3 },
          { variant: 'circle', width: '48px' },
          { variant: 'rect', width: '200px' },
        ],
      },
    ],
  },

  {
    name: 'progress',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'default', value: 25, label: 'Uploading', showValue: true },
          { variant: 'success', value: 50, label: 'Building', showValue: true },
          { variant: 'warning', value: 75, label: 'Compiling', showValue: true },
          { variant: 'danger', value: 100, label: 'Complete', showValue: true },
        ],
      },
      {
        label: 'Sizes',
        items: [
          { size: 'sm', value: 40, label: 'Small' },
          { size: 'md', value: 60, label: 'Medium' },
          { size: 'lg', value: 80, label: 'Large' },
        ],
      },
    ],
  },

  {
    name: 'tooltip',
    showcases: [
      {
        label: 'Positions',
        items: [
          { position: 'top', content: 'Top tooltip', id: 'demo-tip-top' },
          { position: 'right', content: 'Right tooltip', id: 'demo-tip-right' },
          { position: 'bottom', content: 'Bottom tooltip', id: 'demo-tip-bottom' },
          { position: 'left', content: 'Left tooltip', id: 'demo-tip-left' },
        ],
      },
    ],
  },

  {
    name: 'checkbox',
    showcases: [
      {
        label: 'States',
        items: [
          { label: 'Unchecked', id: 'demo-cb-1' },
          { label: 'Checked', checked: true, id: 'demo-cb-2' },
          { label: 'Disabled', disabled: true, id: 'demo-cb-3' },
        ],
      },
    ],
  },

  {
    name: 'radio',
    showcases: [
      {
        label: 'Group',
        items: [
          {
            name: 'Favourite Color',
            options: [
              { label: 'Red', value: 'red' },
              { label: 'Green', value: 'green' },
              { label: 'Blue', value: 'blue' },
            ],
            selectedValue: 'green',
            id: 'demo-radio',
          },
        ],
      },
    ],
  },

  {
    name: 'rating',
    showcases: [
      {
        label: 'Readonly',
        items: [
          { value: 3, readonly: true, size: 'md', id: 'demo-rating-ro' },
        ],
      },
      {
        label: 'Interactive',
        items: [
          { value: 4, readonly: false, size: 'lg', id: 'demo-rating-int' },
        ],
      },
    ],
  },

  {
    name: 'toggle',
    showcases: [
      {
        label: 'States',
        items: [
          { label: 'Off', checked: false, id: 'demo-toggle-off' },
          { label: 'On', checked: true, id: 'demo-toggle-on' },
          { label: 'Disabled', disabled: true, id: 'demo-toggle-dis' },
        ],
      },
    ],
  },

  // ===== FORM ELEMENTS (2) ================================================

  {
    name: 'select',
    showcases: [
      {
        label: 'Variants',
        items: [
          {
            label: 'Country',
            options: [
              { label: 'United States', value: 'us' },
              { label: 'United Kingdom', value: 'uk' },
              { label: 'Canada', value: 'ca' },
            ],
            id: 'demo-select-1',
          },
          {
            label: 'Disabled Select',
            disabled: true,
            options: [{ label: 'N/A', value: '' }],
            id: 'demo-select-2',
          },
        ],
      },
    ],
  },

  {
    name: 'textarea',
    showcases: [
      {
        label: 'Variants',
        items: [
          { label: 'Comments', placeholder: 'Write your thoughts...', id: 'demo-ta-1' },
          { label: 'Bio', placeholder: 'Tell us about yourself', maxlength: 200, id: 'demo-ta-2' },
          { label: 'Feedback', error: 'Please provide feedback', id: 'demo-ta-3' },
        ],
      },
    ],
  },

  // ===== MOLECULES (10) ====================================================

  {
    name: 'alert',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'info', message: 'This is an informational alert.' },
          { variant: 'success', title: 'Success!', message: 'Operation completed.' },
          { variant: 'warning', message: 'Please review before proceeding.' },
          { variant: 'danger', message: 'Something went wrong.', dismissible: true },
        ],
      },
    ],
  },

  {
    name: 'tabs',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            tabs: [
              { label: 'Overview', content: 'Overview panel content goes here.' },
              { label: 'Features', content: 'Features panel content goes here.' },
              { label: 'Pricing', content: 'Pricing panel content goes here.' },
            ],
            activeIndex: 0,
          },
        ],
      },
    ],
  },

  {
    name: 'accordion',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            items: [
              { title: 'What is Aioli?', content: 'Aioli is an AI-native design system platform.' },
              { title: 'How does it work?', content: 'It uses a rules engine with agent orchestration.' },
              { title: 'Is it accessible?', content: 'Yes, WCAG 2.1 AA compliance is enforced.' },
            ],
          },
        ],
      },
    ],
  },

  {
    name: 'dropdown',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            trigger: 'Actions',
            items: [
              { label: 'Edit', icon: '\u270E' },
              { label: 'Duplicate' },
              { label: 'Delete', disabled: true },
            ],
            id: 'demo-dropdown',
          },
        ],
      },
    ],
  },

  {
    name: 'toast',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'info', message: 'New update available.' },
          { variant: 'success', message: 'Changes saved.' },
          { variant: 'warning', message: 'Storage almost full.' },
          { variant: 'error', message: 'Upload failed.' },
        ],
      },
    ],
  },

  {
    name: 'breadcrumb',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            items: [
              { label: 'Home', href: '/' },
              { label: 'Products', href: '/products' },
              { label: 'Current Item' },
            ],
          },
        ],
      },
    ],
  },

  {
    name: 'pagination',
    showcases: [
      {
        label: 'Default',
        items: [
          { totalPages: 5, currentPage: 3, id: 'demo-pagination' },
        ],
      },
    ],
  },

  {
    name: 'stepper',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            steps: [
              { label: 'Account', description: 'Create your account' },
              { label: 'Profile', description: 'Set up your profile' },
              { label: 'Review', description: 'Review details' },
              { label: 'Complete', description: 'All done' },
            ],
            currentStep: 2,
          },
        ],
      },
    ],
  },

  {
    name: 'popover',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            title: 'Popover Title',
            content: '<p>This is rich popover content with <strong>bold text</strong>.</p>',
            position: 'bottom',
            id: 'demo-popover',
          },
        ],
      },
    ],
  },

  {
    name: 'form-group',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            title: 'Contact Us',
            fields: [
              { label: 'Name', type: 'text', name: 'name', required: true, placeholder: 'Your name' },
              { label: 'Email', type: 'email', name: 'email', required: true, placeholder: 'you@example.com' },
              { label: 'Message', type: 'text', name: 'message', placeholder: 'How can we help?' },
            ],
            id: 'demo-form',
          },
        ],
      },
    ],
  },

  // ===== ORGANISMS (4) =====================================================

  {
    name: 'card',
    showcases: [
      {
        label: 'Variants',
        items: [
          { variant: 'default', title: 'Default Card', content: 'Simple card content with default styling.' },
          { variant: 'elevated', title: 'Elevated Card', content: 'This card has an elevated shadow effect.' },
          { variant: 'outlined', title: 'Outlined Card', content: 'This card has a visible border outline.' },
        ],
      },
    ],
  },

  {
    name: 'modal',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            title: 'Confirm Action',
            content: '<p>Are you sure you want to proceed? This action cannot be undone.</p>',
            actions: '<button type="button" class="btn btn--secondary btn--md"><span class="btn__text">Cancel</span></button> <button type="button" class="btn btn--primary btn--md"><span class="btn__text">Confirm</span></button>',
            id: 'demo-modal',
          },
        ],
      },
    ],
  },

  {
    name: 'table',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            caption: 'Team Members',
            striped: true,
            columns: [
              { label: 'Name', key: 'name' },
              { label: 'Role', key: 'role' },
              { label: 'Status', key: 'status' },
            ],
            rows: [
              { name: 'Alice Johnson', role: 'Designer', status: 'Active' },
              { name: 'Bob Smith', role: 'Developer', status: 'Active' },
              { name: 'Carla Lee', role: 'PM', status: 'On Leave' },
            ],
          },
        ],
      },
    ],
  },

  {
    name: 'navigation',
    showcases: [
      {
        label: 'Default',
        items: [
          {
            brand: 'Aioli',
            items: [
              { label: 'Home', href: '/' },
              { label: 'Components', href: '/components' },
              { label: 'Tokens', href: '/tokens' },
              { label: 'Docs', href: '/docs' },
            ],
            activeIndex: 1,
            id: 'demo-nav',
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main Demo component
// ---------------------------------------------------------------------------

export default function Demo() {
  // -- State ----------------------------------------------------------------

  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [openCode, setOpenCode] = useState({}); // { [componentName]: bool }

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

  // -- Code panel toggle ----------------------------------------------------

  const toggleCode = useCallback((name) => {
    setOpenCode((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  // -- Filtered list --------------------------------------------------------

  const filteredDemos = useMemo(() => {
    if (filter === 'all') return COMPONENT_DEMOS;
    return COMPONENT_DEMOS.filter((d) => {
      const tpl = COMPONENT_TEMPLATES[d.name];
      return tpl && tpl.category === filter;
    });
  }, [filter]);

  // -- Component count text -------------------------------------------------

  const countText = useMemo(() => {
    const total = Object.keys(COMPONENT_TEMPLATES).length;
    const shown = filteredDemos.length;
    return filter === 'all'
      ? `${total} components`
      : `${shown} of ${total} components`;
  }, [filter, filteredDemos]);

  // -- Render ---------------------------------------------------------------

  return (
    <div className="demo-page">
      {/* ================================================================= */}
      {/* HEADER                                                            */}
      {/* ================================================================= */}
      <header className="demo-header">
        <div className="demo-header__left">
          <a href="./" className="demo-header__home" aria-label="Back to Home">
            <span role="img" aria-label="garlic">&#x1F9C4;</span>
          </a>
          <h1 className="demo-header__title">
            Aioli Component Gallery
          </h1>
        </div>

        <div className="demo-header__controls">
          <span className="demo-header__count">{countText}</span>
          <a href="docs.html" className="demo-header__link">
            Docs
          </a>
          <button
            type="button"
            className="demo-header__theme-toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* CATEGORY FILTERS                                                  */}
      {/* ================================================================= */}
      <nav className="demo-filters" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`demo-filter-btn${filter === cat.key ? ' demo-filter-btn--active' : ''}`}
            onClick={() => setFilter(cat.key)}
            aria-pressed={filter === cat.key}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* ================================================================= */}
      {/* COMPONENT GRID                                                    */}
      {/* ================================================================= */}
      <div className="demo-grid">
        {filteredDemos.map((demo) => {
          const tpl = COMPONENT_TEMPLATES[demo.name];
          if (!tpl) return null;

          // Collect all rendered HTML snippets for the code panel
          const allHtmlSnippets = [];

          return (
            <section key={demo.name} className="demo-section">
              {/* -- Header: name + category badge -- */}
              <div className="demo-section__header">
                <h2 className="demo-section__name">{formatName(demo.name)}</h2>
                <span className={`demo-section__badge demo-section__badge--${tpl.category}`}>
                  {tpl.category}
                </span>
              </div>

              {/* -- Description -- */}
              <p className="demo-section__description">{tpl.description}</p>

              {/* -- Showcases (variants / sizes / states) -- */}
              {demo.showcases.map((showcase, si) => (
                <div className="demo-section__showcase" key={si}>
                  <span className="demo-section__showcase-label">{showcase.label}</span>

                  <div
                    className={`demo-section__showcase-row${
                      demo.name === 'modal' ? ' demo-modal-container' : ''
                    }`}
                  >
                    {showcase.items.map((props, ii) => {
                      const result = renderTemplate(demo.name, props);
                      allHtmlSnippets.push(result.html);

                      return (
                        <div
                          key={ii}
                          className="demo-section__showcase-item"
                          dangerouslySetInnerHTML={{ __html: result.html }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* -- Code toggle -- */}
              <button
                type="button"
                className="demo-section__code-toggle"
                onClick={() => toggleCode(demo.name)}
                aria-expanded={!!openCode[demo.name]}
              >
                {openCode[demo.name] ? 'Hide Code' : 'Show Code'}
              </button>

              {/* -- Code panel -- */}
              {openCode[demo.name] && (
                <pre className="demo-section__code">
                  <code>{prettyHTML(allHtmlSnippets.join('\n\n'))}</code>
                </pre>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
