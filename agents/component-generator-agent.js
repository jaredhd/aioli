/**
 * 🧩 Component Generator Agent
 * Part of the Aioli Design System
 * 
 * The builder — creates components from descriptions:
 * - Generates components from natural language
 * - Applies design tokens automatically
 * - Ensures semantic HTML structure
 * - Handles HTML/ARIA fixes routed from Orchestrator
 * - Integrates with Motion Agent for animations
 */

import { AGENTS, createFixResult } from './agent-protocol.js';

// ============================================================================
// COMPONENT TEMPLATES
// ============================================================================

/**
 * Base component templates with semantic HTML and ARIA support
 */
export const COMPONENT_TEMPLATES = {
  button: {
    category: 'atom',
    description: 'Interactive button element',
    variants: ['primary', 'secondary', 'danger', 'ghost'],
    sizes: ['sm', 'md', 'lg'],
    template: ({ variant = 'primary', size = 'md', children = 'Button', disabled = false, icon = null }) => ({
      html: `<button 
  type="button"
  class="btn btn--${variant} btn--${size}${disabled ? ' btn--disabled' : ''}"
  ${disabled ? 'disabled aria-disabled="true"' : ''}
>
  ${icon ? `<span class="btn__icon" aria-hidden="true">${icon}</span>` : ''}
  <span class="btn__text">${children}</span>
</button>`,
      tokens: [
        `component.button.${variant}.background`,
        `component.button.${variant}.color`,
        `component.button.${size}.padding`,
        `component.button.${size}.fontSize`,
      ],
      a11y: {
        role: 'button',
        focusable: true,
        keyboardNav: ['Enter', 'Space'],
      },
    }),
  },

  input: {
    category: 'atom',
    description: 'Text input field',
    variants: ['text', 'email', 'password', 'search', 'number'],
    template: ({ type = 'text', label = 'Label', placeholder = 'Enter value...', required = false, error = null, id }) => {
      const inputId = id || `input-${Date.now()}`;
      return {
        html: `<div class="form-field${error ? ' form-field--error' : ''}">
  <label for="${inputId}" class="form-field__label">
    ${label}${required ? '<span class="form-field__required" aria-hidden="true">*</span>' : ''}
  </label>
  <input
    type="${type}"
    id="${inputId}"
    class="form-field__input"
    placeholder="${placeholder}"
    ${required ? 'required aria-required="true"' : ''}
    ${error ? `aria-invalid="true" aria-describedby="${inputId}-error"` : ''}
  />
  ${error ? `<span id="${inputId}-error" class="form-field__error" role="alert">${error}</span>` : ''}
</div>`,
        tokens: [
          'component.input.background',
          'component.input.border',
          'component.input.borderRadius',
          'semantic.color.text.primary',
        ],
        a11y: {
          role: 'textbox',
          hasLabel: true,
          focusable: true,
          errorHandling: true,
        },
      };
    },
  },

  card: {
    category: 'organism',
    description: 'Content card container',
    variants: ['default', 'elevated', 'outlined'],
    template: ({ variant = 'default', title = 'Card Title', content = 'Simple card content with default styling.', image = null, actions = null }) => ({
      html: `<article class="card card--${variant}">
  ${image ? `<img src="${image}" alt="" class="card__image" />` : ''}
  <div class="card__body">
    <h3 class="card__title">${title}</h3>
    <div class="card__content">${content}</div>
  </div>
  ${actions ? `<div class="card__actions">${actions}</div>` : ''}
</article>`,
      tokens: [
        'component.card.background',
        'component.card.borderRadius',
        'component.card.shadow',
        'component.card.padding',
      ],
      a11y: {
        role: 'article',
        landmark: true,
      },
    }),
  },

  modal: {
    category: 'organism',
    description: 'Dialog/modal window',
    template: ({ title = 'Dialog Title', content = 'Dialog content goes here.', actions, id }) => {
      const modalId = id || `modal-${Date.now()}`;
      return {
        html: `<div
  class="modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="${modalId}-title"
  aria-describedby="${modalId}-content"
>
  <div class="modal__backdrop" aria-hidden="true"></div>
  <div class="modal__container">
    <header class="modal__header">
      <h2 id="${modalId}-title" class="modal__title">${title}</h2>
      <button
        type="button"
        class="modal__close"
        aria-label="Close dialog"
      >
        <span aria-hidden="true">×</span>
      </button>
    </header>
    <div id="${modalId}-content" class="modal__content">
      ${content}
    </div>
    ${actions ? `<footer class="modal__footer">${actions}</footer>` : ''}
  </div>
</div>`,
        tokens: [
          'component.modal.background',
          'component.modal.borderRadius',
          'component.modal.shadow',
          'component.modal.backdrop',
        ],
        a11y: {
          role: 'dialog',
          modal: true,
          focusTrap: true,
          labelledBy: `${modalId}-title`,
          describedBy: `${modalId}-content`,
        },
      };
    },
  },

  alert: {
    category: 'molecule',
    description: 'Alert/notification message',
    variants: ['info', 'success', 'warning', 'danger'],
    template: ({ variant = 'info', title, message = 'This is an alert message.', dismissible = false }) => ({
      html: `<div
  class="alert alert--${variant}"
  role="alert"
  aria-live="${variant === 'danger' ? 'assertive' : 'polite'}"
>
  <span class="alert__icon" aria-hidden="true">${getAlertIcon(variant)}</span>
  <div class="alert__content">
    ${title ? `<strong class="alert__title">${title}</strong>` : ''}
    <p class="alert__message">${message}</p>
  </div>
  ${dismissible ? `<button type="button" class="alert__dismiss" aria-label="Dismiss alert">×</button>` : ''}
</div>`,
      tokens: [
        `semantic.color.${variant}`,
        `component.alert.${variant}.background`,
        `component.alert.${variant}.border`,
      ],
      a11y: {
        role: 'alert',
        live: variant === 'danger' ? 'assertive' : 'polite',
      },
    }),
  },

  tabs: {
    category: 'molecule',
    description: 'Tabbed interface',
    template: ({ tabs = [{ label: 'Tab 1', content: 'Tab 1 content' }, { label: 'Tab 2', content: 'Tab 2 content' }], activeIndex = 0 }) => {
      const tabsId = `tabs-${Date.now()}`;
      return {
        html: `<div class="tabs">
  <div class="tabs__list" role="tablist">
    ${tabs.map((tab, i) => `
    <button
      type="button"
      role="tab"
      id="${tabsId}-tab-${i}"
      aria-selected="${i === activeIndex}"
      aria-controls="${tabsId}-panel-${i}"
      class="tabs__tab${i === activeIndex ? ' tabs__tab--active' : ''}"
      ${i !== activeIndex ? 'tabindex="-1"' : ''}
    >
      ${tab.label}
    </button>`).join('')}
  </div>
  ${tabs.map((tab, i) => `
  <div
    role="tabpanel"
    id="${tabsId}-panel-${i}"
    aria-labelledby="${tabsId}-tab-${i}"
    class="tabs__panel${i === activeIndex ? ' tabs__panel--active' : ''}"
    ${i !== activeIndex ? 'hidden' : ''}
  >
    ${tab.content}
  </div>`).join('')}
</div>`,
        tokens: [
          'component.tabs.background',
          'component.tabs.activeIndicator',
          'component.tabs.borderColor',
        ],
        a11y: {
          role: 'tablist',
          keyboardNav: ['ArrowLeft', 'ArrowRight', 'Home', 'End'],
          focusManagement: 'roving',
        },
      };
    },
  },

  accordion: {
    category: 'molecule',
    description: 'Expandable accordion sections',
    template: ({ items = [{ title: 'Section 1', content: 'Section 1 content' }, { title: 'Section 2', content: 'Section 2 content' }], allowMultiple = false }) => {
      const accId = `accordion-${Date.now()}`;
      return {
        html: `<div class="accordion" data-allow-multiple="${allowMultiple}">
  ${items.map((item, i) => `
  <div class="accordion__item">
    <h3 class="accordion__header">
      <button
        type="button"
        class="accordion__trigger"
        aria-expanded="false"
        aria-controls="${accId}-panel-${i}"
        id="${accId}-header-${i}"
      >
        <span class="accordion__title">${item.title}</span>
        <span class="accordion__icon" aria-hidden="true">▼</span>
      </button>
    </h3>
    <div
      id="${accId}-panel-${i}"
      role="region"
      aria-labelledby="${accId}-header-${i}"
      class="accordion__panel"
      hidden
    >
      <div class="accordion__content">${item.content}</div>
    </div>
  </div>`).join('')}
</div>`,
        tokens: [
          'component.accordion.background',
          'component.accordion.borderColor',
          'component.accordion.headerPadding',
        ],
        a11y: {
          role: 'region',
          expandable: true,
          keyboardNav: ['ArrowUp', 'ArrowDown', 'Home', 'End'],
        },
      };
    },
  },

  dropdown: {
    category: 'molecule',
    description: 'Dropdown menu',
    template: ({ trigger = 'Menu', items = [{ label: 'Option 1' }, { label: 'Option 2' }, { label: 'Option 3' }], id }) => {
      const dropId = id || `dropdown-${Date.now()}`;
      return {
        html: `<div class="dropdown">
  <button
    type="button"
    class="dropdown__trigger"
    aria-haspopup="menu"
    aria-expanded="false"
    aria-controls="${dropId}-menu"
    id="${dropId}-trigger"
  >
    ${trigger}
    <span class="dropdown__arrow" aria-hidden="true">▼</span>
  </button>
  <ul
    class="dropdown__menu"
    role="menu"
    id="${dropId}-menu"
    aria-labelledby="${dropId}-trigger"
    hidden
  >
    ${items.map((item, i) => `
    <li role="none">
      <${item.href ? 'a href="' + item.href + '"' : 'button type="button"'}
        role="menuitem"
        class="dropdown__item"
        ${item.disabled ? 'aria-disabled="true" tabindex="-1"' : ''}
      >
        ${item.icon ? `<span class="dropdown__icon" aria-hidden="true">${item.icon}</span>` : ''}
        ${item.label}
      </${item.href ? 'a' : 'button'}>
    </li>`).join('')}
  </ul>
</div>`,
        tokens: [
          'component.dropdown.background',
          'component.dropdown.shadow',
          'component.dropdown.borderRadius',
        ],
        a11y: {
          role: 'menu',
          expandable: true,
          keyboardNav: ['ArrowUp', 'ArrowDown', 'Escape', 'Enter'],
          focusManagement: 'activedescendant',
        },
      };
    },
  },

  toast: {
    category: 'molecule',
    description: 'Toast notification',
    variants: ['info', 'success', 'warning', 'error'],
    template: ({ variant = 'info', message = 'This is a notification.', action = null, duration = 5000 }) => ({
      html: `<div
  class="toast toast--${variant}"
  role="status"
  aria-live="polite"
  aria-atomic="true"
  data-duration="${duration}"
>
  <span class="toast__icon" aria-hidden="true">${getAlertIcon(variant)}</span>
  <p class="toast__message">${message}</p>
  ${action ? `<button type="button" class="toast__action">${action}</button>` : ''}
  <button type="button" class="toast__dismiss" aria-label="Dismiss">×</button>
</div>`,
      tokens: [
        `component.toast.${variant}.background`,
        'component.toast.borderRadius',
        'component.toast.shadow',
      ],
      a11y: {
        role: 'status',
        live: 'polite',
        atomic: true,
      },
    }),
  },

  badge: {
    category: 'atom',
    description: 'Status badge/tag',
    variants: ['default', 'primary', 'success', 'warning', 'danger'],
    template: ({ variant = 'default', children, dot = false }) => ({
      html: `<span class="badge badge--${variant}${dot ? ' badge--dot' : ''}">
  ${dot ? '' : children}
</span>`,
      tokens: [
        `component.badge.${variant}.background`,
        `component.badge.${variant}.color`,
      ],
      a11y: {
        role: 'status',
      },
    }),
  },

  avatar: {
    category: 'atom',
    description: 'User avatar',
    sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
    template: ({ src = '', alt = 'User', size = 'md', fallback }) => ({
      html: `<span class="avatar avatar--${size}">
  ${src 
    ? `<img src="${src}" alt="${alt}" class="avatar__image" />`
    : `<span class="avatar__fallback" aria-label="${alt}">${fallback || alt?.charAt(0) || '?'}</span>`
  }
</span>`,
      tokens: [
        `component.avatar.${size}.size`,
        'component.avatar.background',
        'component.avatar.borderRadius',
      ],
      a11y: {
        role: 'img',
        hasAlt: true,
      },
    }),
  },

  spinner: {
    category: 'atom',
    description: 'Loading spinner',
    sizes: ['sm', 'md', 'lg'],
    template: ({ size = 'md', label = 'Loading...' }) => ({
      html: `<span class="spinner spinner--${size}" role="status" aria-label="${label}">
  <span class="spinner__circle" aria-hidden="true"></span>
  <span class="visually-hidden">${label}</span>
</span>`,
      tokens: [
        `component.spinner.${size}.size`,
        'component.spinner.color',
        'motion.duration.slow',
      ],
      a11y: {
        role: 'status',
        essential: true, // Keep animation with reduced-motion
      },
    }),
  },

  tooltip: {
    category: 'atom',
    description: 'Tooltip/hint text',
    positions: ['top', 'right', 'bottom', 'left'],
    template: ({ content = 'Tooltip text', position = 'top', id }) => {
      const tipId = id || `tooltip-${Date.now()}`;
      return {
        html: `<span
  class="tooltip tooltip--${position}"
  role="tooltip"
  id="${tipId}"
>
  ${content}
</span>`,
        tokens: [
          'component.tooltip.background',
          'component.tooltip.color',
          'component.tooltip.borderRadius',
        ],
        a11y: {
          role: 'tooltip',
          triggeredBy: 'aria-describedby',
        },
        usage: `<!-- Usage: add aria-describedby="${tipId}" to trigger element -->`,
      };
    },
  },

  checkbox: {
    category: 'atom',
    description: 'Checkbox input',
    sizes: ['sm', 'md', 'lg'],
    template: ({ label, checked = false, disabled = false, required = false, error = null, id }) => {
      const cbId = id || `checkbox-${Date.now()}`;
      return {
        html: `<div class="form-field${error ? ' form-field--error' : ''}">
  <label class="checkbox${disabled ? ' checkbox--disabled' : ''}" for="${cbId}">
    <input
      type="checkbox"
      id="${cbId}"
      class="checkbox__input"
      ${checked ? 'checked' : ''}
      ${disabled ? 'disabled aria-disabled="true"' : ''}
      ${required ? 'required aria-required="true"' : ''}
      ${error ? `aria-invalid="true" aria-describedby="${cbId}-error"` : ''}
    />
    <span class="checkbox__control" aria-hidden="true"></span>
    <span class="checkbox__label">${label}</span>
  </label>
  ${error ? `<span id="${cbId}-error" class="form-field__error" role="alert">${error}</span>` : ''}
</div>`,
        tokens: [
          'component.checkbox.bg.default',
          'component.checkbox.bg.checked',
          'component.checkbox.border.color.default',
          'component.checkbox.border.color.checked',
          'component.checkbox.icon.color',
          'component.checkbox.label.color.default',
        ],
        a11y: {
          role: 'checkbox',
          hasLabel: true,
          focusable: true,
          keyboardNav: ['Space'],
          errorHandling: true,
        },
      };
    },
  },

  radio: {
    category: 'atom',
    description: 'Radio button input',
    sizes: ['sm', 'md', 'lg'],
    template: ({ name, options = [], selectedValue = null, disabled = false, error = null, id }) => {
      const groupId = id || `radio-${Date.now()}`;
      return {
        html: `<fieldset class="radio-group${error ? ' radio-group--error' : ''}" role="radiogroup" aria-labelledby="${groupId}-legend">
  <legend id="${groupId}-legend" class="radio-group__legend">${name}</legend>
  ${(options.length ? options : [{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }]).map((opt, i) => `
  <label class="radio${disabled ? ' radio--disabled' : ''}" for="${groupId}-${i}">
    <input
      type="radio"
      id="${groupId}-${i}"
      name="${groupId}"
      value="${opt.value}"
      class="radio__input"
      ${opt.value === selectedValue ? 'checked' : ''}
      ${disabled ? 'disabled aria-disabled="true"' : ''}
      ${error ? `aria-describedby="${groupId}-error"` : ''}
    />
    <span class="radio__control" aria-hidden="true"></span>
    <span class="radio__label">${opt.label}</span>
  </label>`).join('')}
  ${error ? `<span id="${groupId}-error" class="form-field__error" role="alert">${error}</span>` : ''}
</fieldset>`,
        tokens: [
          'component.radio.bg.default',
          'component.radio.bg.checked',
          'component.radio.border.color.default',
          'component.radio.border.color.checked',
          'component.radio.dot.color.default',
          'component.radio.label.color.default',
          'component.radio.group.gap',
        ],
        a11y: {
          role: 'radiogroup',
          hasLabel: true,
          focusable: true,
          keyboardNav: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
          errorHandling: true,
        },
      };
    },
  },

  select: {
    category: 'atom',
    description: 'Select dropdown input',
    sizes: ['sm', 'md', 'lg'],
    template: ({ label, options = [], placeholder = 'Select an option', required = false, disabled = false, error = null, size = 'md', id }) => {
      const selectId = id || `select-${Date.now()}`;
      return {
        html: `<div class="form-field${error ? ' form-field--error' : ''}">
  <label for="${selectId}" class="form-field__label">
    ${label}${required ? '<span class="form-field__required" aria-hidden="true">*</span>' : ''}
  </label>
  <select
    id="${selectId}"
    class="select select--${size}"
    ${required ? 'required aria-required="true"' : ''}
    ${disabled ? 'disabled aria-disabled="true"' : ''}
    ${error ? `aria-invalid="true" aria-describedby="${selectId}-error"` : ''}
  >
    <option value="" disabled selected>${placeholder}</option>
    ${(options.length ? options : [{ label: 'Option 1', value: '1' }]).map(opt => `
    <option value="${opt.value}">${opt.label}</option>`).join('')}
  </select>
  ${error ? `<span id="${selectId}-error" class="form-field__error" role="alert">${error}</span>` : ''}
</div>`,
        tokens: [
          'component.select.trigger.bg.default',
          'component.select.trigger.border.color.default',
          'component.select.trigger.text.default',
          `component.select.trigger.size.${size}.height`,
          'component.select.dropdown.bg',
          'component.select.dropdown.shadow',
          'component.select.option.bg.hover',
        ],
        a11y: {
          role: 'combobox',
          hasLabel: true,
          focusable: true,
          keyboardNav: ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'],
          errorHandling: true,
        },
      };
    },
  },

  textarea: {
    category: 'atom',
    description: 'Multi-line text input',
    template: ({ label, placeholder = '', required = false, disabled = false, error = null, rows = 4, maxlength = null, id }) => {
      const taId = id || `textarea-${Date.now()}`;
      return {
        html: `<div class="form-field${error ? ' form-field--error' : ''}">
  <label for="${taId}" class="form-field__label">
    ${label}${required ? '<span class="form-field__required" aria-hidden="true">*</span>' : ''}
  </label>
  <textarea
    id="${taId}"
    class="textarea"
    placeholder="${placeholder}"
    rows="${rows}"
    ${maxlength ? `maxlength="${maxlength}" aria-describedby="${taId}-count"` : ''}
    ${required ? 'required aria-required="true"' : ''}
    ${disabled ? 'disabled aria-disabled="true"' : ''}
    ${error ? `aria-invalid="true" aria-describedby="${taId}-error"` : ''}
  ></textarea>
  ${maxlength ? `<span id="${taId}-count" class="form-field__char-count" aria-live="polite">0/${maxlength}</span>` : ''}
  ${error ? `<span id="${taId}-error" class="form-field__error" role="alert">${error}</span>` : ''}
</div>`,
        tokens: [
          'component.textarea.bg.default',
          'component.textarea.border.color.default',
          'component.textarea.text.default',
          'component.textarea.padding.x',
          'component.textarea.padding.y',
          'component.textarea.fontSize',
          'component.textarea.radius',
        ],
        a11y: {
          role: 'textbox',
          multiline: true,
          hasLabel: true,
          focusable: true,
          errorHandling: true,
        },
      };
    },
  },

  toggle: {
    category: 'atom',
    description: 'Toggle switch input',
    sizes: ['sm', 'md', 'lg'],
    template: ({ label, checked = false, disabled = false, size = 'md', id }) => {
      const toggleId = id || `toggle-${Date.now()}`;
      return {
        html: `<label class="toggle toggle--${size}${disabled ? ' toggle--disabled' : ''}" for="${toggleId}">
  <input
    type="checkbox"
    id="${toggleId}"
    class="toggle__input"
    role="switch"
    aria-checked="${checked}"
    ${checked ? 'checked' : ''}
    ${disabled ? 'disabled aria-disabled="true"' : ''}
  />
  <span class="toggle__track" aria-hidden="true">
    <span class="toggle__thumb"></span>
  </span>
  <span class="toggle__label">${label}</span>
</label>`,
        tokens: [
          'component.toggle.track.bg.off',
          'component.toggle.track.bg.on',
          `component.toggle.track.size.${size}.width`,
          `component.toggle.track.size.${size}.height`,
          `component.toggle.thumb.size.${size}`,
          'component.toggle.thumb.bg.default',
          'component.toggle.label.color.default',
        ],
        a11y: {
          role: 'switch',
          hasLabel: true,
          focusable: true,
          keyboardNav: ['Space'],
        },
      };
    },
  },

  table: {
    category: 'organism',
    description: 'Data table',
    sizes: ['compact', 'default', 'relaxed'],
    template: ({ columns = [], rows = [], caption = '', striped = false, sortable = false, size = 'default' }) => {
      const tableId = `table-${Date.now()}`;
      return {
        html: `<div class="table-container" role="region" aria-labelledby="${tableId}-caption" tabindex="0">
  <table class="table table--${size}${striped ? ' table--striped' : ''}" id="${tableId}">
    ${caption ? `<caption id="${tableId}-caption" class="table__caption">${caption}</caption>` : ''}
    <thead class="table__head">
      <tr>
        ${(columns.length ? columns : [{ label: 'Column', key: 'col' }]).map(col => `
        <th scope="col" class="table__header"${sortable ? ' aria-sort="none"' : ''}>
          ${col.label}
          ${sortable ? '<button type="button" class="table__sort" aria-label="Sort by ' + col.label + '"><span aria-hidden="true">&#x21C5;</span></button>' : ''}
        </th>`).join('')}
      </tr>
    </thead>
    <tbody class="table__body">
      ${(rows.length ? rows : []).map(row => `
      <tr class="table__row">
        ${(columns.length ? columns : [{ key: 'col' }]).map(col => `
        <td class="table__cell">${row[col.key] || ''}</td>`).join('')}
      </tr>`).join('')}
    </tbody>
  </table>
</div>`,
        tokens: [
          'component.table.bg',
          'component.table.border.color',
          'component.table.header.bg',
          'component.table.header.color',
          'component.table.cell.color',
          'component.table.cell.borderColor',
          'component.table.row.bg.hover',
          `component.table.size.${size}.cellPaddingY`,
        ],
        a11y: {
          role: 'table',
          focusable: true,
          keyboardNav: sortable ? ['Enter', 'Space'] : [],
          scrollable: true,
        },
      };
    },
  },

  divider: {
    category: 'atom',
    description: 'Visual divider/separator',
    variants: ['default', 'subtle', 'strong'],
    template: ({ variant = 'default', orientation = 'horizontal', label = null }) => ({
      html: label
        ? `<div class="divider divider--${variant} divider--${orientation} divider--with-label" role="separator" aria-orientation="${orientation}">
  <span class="divider__line" aria-hidden="true"></span>
  <span class="divider__label">${label}</span>
  <span class="divider__line" aria-hidden="true"></span>
</div>`
        : `<hr class="divider divider--${variant} divider--${orientation}" role="separator" aria-orientation="${orientation}" />`,
      tokens: [
        `component.divider.color.${variant}`,
        'component.divider.thickness',
        'component.divider.spacing.md',
        'component.divider.withLabel.color',
        'component.divider.withLabel.fontSize',
      ],
      a11y: {
        role: 'separator',
        orientation,
      },
    }),
  },

  skeleton: {
    category: 'atom',
    description: 'Loading skeleton placeholder',
    variants: ['text', 'circle', 'rect'],
    template: ({ variant = 'text', width = '100%', lines = 1, animated = true }) => ({
      html: variant === 'text'
        ? `<div class="skeleton-group" aria-busy="true" aria-live="polite">
  <span class="visually-hidden">Loading content...</span>
  ${Array.from({ length: lines }, (_, i) => `
  <span class="skeleton skeleton--text${animated ? ' skeleton--animated' : ''}" style="width: ${i === lines - 1 && lines > 1 ? '60%' : width}" aria-hidden="true"></span>`).join('')}
</div>`
        : `<div aria-busy="true" aria-live="polite">
  <span class="visually-hidden">Loading content...</span>
  <span class="skeleton skeleton--${variant}${animated ? ' skeleton--animated' : ''}" style="width: ${width}" aria-hidden="true"></span>
</div>`,
      tokens: [
        'component.skeleton.bg.base',
        'component.skeleton.bg.shimmer',
        `component.skeleton.radius.${variant}`,
        `component.skeleton.height.${variant === 'text' ? 'text' : variant === 'circle' ? 'avatar' : 'card'}`,
        'component.skeleton.animation.duration',
      ],
      a11y: {
        role: 'status',
        live: 'polite',
        busy: true,
      },
    }),
  },

  navigation: {
    category: 'organism',
    description: 'Navigation bar',
    template: ({ brand = '', items = [], activeIndex = 0, id }) => {
      const navId = id || `nav-${Date.now()}`;
      return {
        html: `<nav class="nav" aria-label="Main navigation" id="${navId}">
  <div class="nav__container">
    ${brand ? `<a href="/" class="nav__brand" aria-label="Home">${brand}</a>` : ''}
    <button
      type="button"
      class="nav__mobile-trigger"
      aria-expanded="false"
      aria-controls="${navId}-menu"
      aria-label="Toggle navigation menu"
    >
      <span class="nav__hamburger" aria-hidden="true"></span>
    </button>
    <ul class="nav__menu" id="${navId}-menu" role="menubar">
      ${(items.length ? items : [{ label: 'Home', href: '/' }]).map((item, i) => `
      <li role="none">
        <a
          href="${item.href || '#'}"
          role="menuitem"
          class="nav__item${i === activeIndex ? ' nav__item--active' : ''}"
          ${i === activeIndex ? 'aria-current="page"' : ''}
        >
          ${item.label}
        </a>
      </li>`).join('')}
    </ul>
  </div>
</nav>`,
        tokens: [
          'component.nav.bg',
          'component.nav.height',
          'component.nav.border.color',
          'component.nav.item.color.default',
          'component.nav.item.color.active',
          'component.nav.item.bg.hover',
          'component.nav.item.indicator.color',
        ],
        a11y: {
          role: 'navigation',
          landmark: true,
          keyboardNav: ['ArrowLeft', 'ArrowRight', 'Home', 'End'],
          mobileToggle: true,
        },
      };
    },
  },

  breadcrumb: {
    category: 'molecule',
    description: 'Breadcrumb navigation',
    template: ({ items = [], separator = '/' }) => ({
      html: `<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol class="breadcrumb__list">
    ${(items.length ? items : [{ label: 'Home', href: '/' }, { label: 'Current' }]).map((item, i, arr) => `
    <li class="breadcrumb__item">
      ${i < arr.length - 1
        ? `<a href="${item.href || '#'}" class="breadcrumb__link">${item.label}</a>
      <span class="breadcrumb__separator" aria-hidden="true">${separator}</span>`
        : `<span class="breadcrumb__current" aria-current="page">${item.label}</span>`}
    </li>`).join('')}
  </ol>
</nav>`,
      tokens: [
        'component.breadcrumb.fontSize',
        'component.breadcrumb.gap',
        'component.breadcrumb.separator.color',
        'component.breadcrumb.item.color.default',
        'component.breadcrumb.item.color.hover',
        'component.breadcrumb.item.color.current',
      ],
      a11y: {
        role: 'navigation',
        landmark: true,
        currentPage: true,
      },
    }),
  },

  pagination: {
    category: 'molecule',
    description: 'Pagination controls',
    template: ({ totalPages = 5, currentPage = 1, id }) => {
      const pagId = id || `pagination-${Date.now()}`;
      return {
        html: `<nav class="pagination" aria-label="Pagination" id="${pagId}">
  <ul class="pagination__list">
    <li>
      <button
        type="button"
        class="pagination__item pagination__prev"
        aria-label="Go to previous page"
        ${currentPage === 1 ? 'disabled aria-disabled="true"' : ''}
      >
        <span aria-hidden="true">&laquo;</span>
      </button>
    </li>
    ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
    <li>
      <button
        type="button"
        class="pagination__item${page === currentPage ? ' pagination__item--active' : ''}"
        aria-label="Go to page ${page}"
        ${page === currentPage ? 'aria-current="page"' : ''}
      >
        ${page}
      </button>
    </li>`).join('')}
    <li>
      <button
        type="button"
        class="pagination__item pagination__next"
        aria-label="Go to next page"
        ${currentPage === totalPages ? 'disabled aria-disabled="true"' : ''}
      >
        <span aria-hidden="true">&raquo;</span>
      </button>
    </li>
  </ul>
</nav>`,
        tokens: [
          'component.pagination.gap',
          'component.pagination.item.size',
          'component.pagination.item.radius',
          'component.pagination.item.bg.default',
          'component.pagination.item.bg.active',
          'component.pagination.item.color.default',
          'component.pagination.item.color.active',
        ],
        a11y: {
          role: 'navigation',
          landmark: true,
          focusable: true,
          keyboardNav: ['ArrowLeft', 'ArrowRight'],
          currentPage: true,
        },
      };
    },
  },

  progress: {
    category: 'atom',
    description: 'Progress bar',
    variants: ['default', 'success', 'warning', 'danger'],
    sizes: ['sm', 'md', 'lg'],
    template: ({ value = 0, max = 100, variant = 'default', size = 'md', label = null, showValue = false }) => ({
      html: `<div class="progress progress--${size}">
  ${label ? `<div class="progress__header">
    <span class="progress__label">${label}</span>
    ${showValue ? `<span class="progress__value" aria-hidden="true">${Math.round((value / max) * 100)}%</span>` : ''}
  </div>` : ''}
  <div
    class="progress__track"
    role="progressbar"
    aria-valuenow="${value}"
    aria-valuemin="0"
    aria-valuemax="${max}"
    aria-label="${label || 'Progress'}"
  >
    <div class="progress__bar progress__bar--${variant}" style="width: ${(value / max) * 100}%"></div>
  </div>
</div>`,
      tokens: [
        'component.progress.track.bg',
        'component.progress.track.height',
        'component.progress.track.radius',
        `component.progress.bar.color.${variant}`,
        `component.progress.size.${size}`,
        'component.progress.label.fontSize',
        'component.progress.label.color',
      ],
      a11y: {
        role: 'progressbar',
        valueRange: true,
      },
    }),
  },

  stepper: {
    category: 'molecule',
    description: 'Step progress indicator',
    template: ({ steps = [], currentStep = 0, orientation = 'horizontal' }) => {
      const stepperId = `stepper-${Date.now()}`;
      return {
        html: `<nav class="stepper stepper--${orientation}" aria-label="Progress" id="${stepperId}">
  <ol class="stepper__list">
    ${(steps.length ? steps : [{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]).map((step, i) => {
      const state = i < currentStep ? 'completed' : i === currentStep ? 'active' : 'default';
      return `
    <li class="stepper__item stepper__item--${state}" aria-current="${state === 'active' ? 'step' : 'false'}">
      <span class="stepper__indicator">
        ${state === 'completed'
          ? '<span aria-hidden="true">&#x2713;</span><span class="visually-hidden">Completed: </span>'
          : `<span>${i + 1}</span>`}
      </span>
      <span class="stepper__content">
        <span class="stepper__label">${step.label}</span>
        ${step.description ? `<span class="stepper__description">${step.description}</span>` : ''}
      </span>
      ${i < (steps.length || 3) - 1 ? '<span class="stepper__connector" aria-hidden="true"></span>' : ''}
    </li>`;
    }).join('')}
  </ol>
</nav>`,
        tokens: [
          'component.stepper.step.bg.default',
          'component.stepper.step.bg.active',
          'component.stepper.step.bg.completed',
          'component.stepper.step.color.default',
          'component.stepper.step.color.active',
          'component.stepper.connector.color.default',
          'component.stepper.connector.color.completed',
          'component.stepper.step.label.color.active',
          'component.stepper.gap',
        ],
        a11y: {
          role: 'navigation',
          landmark: true,
          currentStep: true,
        },
      };
    },
  },

  popover: {
    category: 'molecule',
    description: 'Popover with rich content',
    positions: ['top', 'right', 'bottom', 'left'],
    template: ({ title = '', content, position = 'bottom', id }) => {
      const popId = id || `popover-${Date.now()}`;
      return {
        html: `<div class="popover popover--${position}" id="${popId}" role="dialog" aria-labelledby="${popId}-title">
  <div class="popover__arrow" aria-hidden="true"></div>
  <div class="popover__container">
    ${title ? `<header class="popover__header">
      <h3 id="${popId}-title" class="popover__title">${title}</h3>
      <button type="button" class="popover__close" aria-label="Close popover">
        <span aria-hidden="true">&times;</span>
      </button>
    </header>` : ''}
    <div class="popover__body">
      ${content || ''}
    </div>
  </div>
</div>`,
        tokens: [
          'component.popover.bg',
          'component.popover.border.color',
          'component.popover.radius',
          'component.popover.shadow',
          'component.popover.padding',
          'component.popover.header.fontSize',
          'component.popover.body.color',
          'component.popover.arrow.size',
        ],
        a11y: {
          role: 'dialog',
          focusTrap: true,
          focusable: true,
          keyboardNav: ['Escape'],
          triggeredBy: 'aria-controls',
        },
        usage: `<!-- Usage: add aria-controls="${popId}" and aria-expanded to trigger element -->`,
      };
    },
  },

  link: {
    category: 'atom',
    description: 'Hyperlink element',
    variants: ['default', 'subtle', 'inverse'],
    template: ({ href = '#', children = 'Link text', variant = 'default', external = false, disabled = false }) => ({
      html: `<a
  href="${href}"
  class="link link--${variant}${disabled ? ' link--disabled' : ''}"
  ${external ? 'target="_blank" rel="noopener noreferrer"' : ''}
  ${disabled ? 'aria-disabled="true" tabindex="-1"' : ''}
>
  ${children}
  ${external ? '<span class="link__external-icon" aria-hidden="true">&#x2197;</span><span class="visually-hidden">(opens in new tab)</span>' : ''}
</a>`,
      tokens: [
        `component.link.color.default`,
        `component.link.color.hover`,
        `component.link.color.visited`,
        'component.link.decoration.default',
        'component.link.decoration.hover',
        'component.link.fontWeight',
        'component.link.focus.ringColor',
      ],
      a11y: {
        role: 'link',
        focusable: true,
        externalIndicator: external,
      },
    }),
  },

  chip: {
    category: 'atom',
    description: 'Chip/tag element',
    variants: ['filled', 'outlined', 'primary', 'success', 'danger'],
    sizes: ['sm', 'md', 'lg'],
    template: ({ children = 'Chip', variant = 'filled', size = 'md', removable = false, disabled = false, icon = null }) => ({
      html: `<span class="chip chip--${variant} chip--${size}${disabled ? ' chip--disabled' : ''}"${disabled ? ' aria-disabled="true"' : ''}>
  ${icon ? `<span class="chip__icon" aria-hidden="true">${icon}</span>` : ''}
  <span class="chip__label">${children}</span>
  ${removable ? `<button type="button" class="chip__remove" aria-label="Remove ${children}"${disabled ? ' disabled' : ''}>
    <span aria-hidden="true">&times;</span>
  </button>` : ''}
</span>`,
      tokens: [
        `component.chip.variant.${variant}.bg`,
        `component.chip.variant.${variant}.color`,
        `component.chip.height.${size}`,
        `component.chip.paddingX.${size}`,
        'component.chip.radius',
        'component.chip.fontSize',
        'component.chip.closeButton.size',
      ],
      a11y: {
        role: 'status',
        removable: removable,
        focusable: removable,
        keyboardNav: removable ? ['Backspace', 'Delete'] : [],
      },
    }),
  },

  rating: {
    category: 'atom',
    description: 'Star rating input',
    sizes: ['sm', 'md', 'lg'],
    template: ({ value = 0, max = 5, readonly = false, disabled = false, size = 'md', label = 'Rating', id }) => {
      const ratingId = id || `rating-${Date.now()}`;
      return {
        html: readonly
          ? `<div class="rating rating--${size} rating--readonly" role="img" aria-label="${label}: ${value} out of ${max}">
  ${Array.from({ length: max }, (_, i) => `
  <span class="rating__star${i < value ? ' rating__star--filled' : ''}" aria-hidden="true">&#x2605;</span>`).join('')}
</div>`
          : `<fieldset class="rating rating--${size}${disabled ? ' rating--disabled' : ''}" id="${ratingId}">
  <legend class="visually-hidden">${label}</legend>
  ${Array.from({ length: max }, (_, i) => {
    const starVal = max - i;
    return `
  <input
    type="radio"
    id="${ratingId}-${starVal}"
    name="${ratingId}"
    value="${starVal}"
    class="rating__input visually-hidden"
    ${starVal === value ? 'checked' : ''}
    ${disabled ? 'disabled aria-disabled="true"' : ''}
  />
  <label for="${ratingId}-${starVal}" class="rating__star" aria-label="${starVal} star${starVal > 1 ? 's' : ''}">
    <span aria-hidden="true">&#x2605;</span>
  </label>`;
  }).join('')}
</fieldset>`,
        tokens: [
          `component.rating.size.${size}`,
          'component.rating.gap',
          'component.rating.color.filled',
          'component.rating.color.empty',
          'component.rating.color.hover',
          'component.rating.focus.ringColor',
        ],
        a11y: {
          role: readonly ? 'img' : 'radiogroup',
          hasLabel: true,
          focusable: !readonly && !disabled,
          keyboardNav: readonly ? [] : ['ArrowLeft', 'ArrowRight'],
        },
      };
    },
  },

  'form-group': {
    category: 'molecule',
    description: 'Form with labeled fields',
    template: ({ fields = [], action = '', method = 'post', title = null, id }) => {
      const formId = id || `form-${Date.now()}`;
      return {
        html: `<form class="form-group" id="${formId}" action="${action}" method="${method}"${title ? ` aria-labelledby="${formId}-title"` : ''}>
  ${title ? `<h2 id="${formId}-title" class="form-group__title">${title}</h2>` : ''}
  ${(fields.length ? fields : [{ label: 'Name', type: 'text', name: 'name', required: true }]).map((field, i) => {
    const fieldId = `${formId}-field-${i}`;
    return `
  <div class="form-group__field">
    <label for="${fieldId}" class="form-group__label">
      ${field.label}${field.required ? '<span class="form-group__required" aria-hidden="true">*</span>' : ''}
    </label>
    <input
      type="${field.type || 'text'}"
      id="${fieldId}"
      name="${field.name || field.label.toLowerCase()}"
      class="form-group__input"
      ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
      ${field.required ? 'required aria-required="true"' : ''}
    />
    ${field.helper ? `<span class="form-group__helper" id="${fieldId}-helper">${field.helper}</span>` : ''}
  </div>`;
  }).join('')}
  <div class="form-group__actions">
    <button type="submit" class="btn btn--primary">Submit</button>
  </div>
</form>`,
        tokens: [
          'component.formField.gap',
          'component.formField.label.fontSize',
          'component.formField.label.fontWeight',
          'component.formField.label.color.default',
          'component.formField.label.required.color',
          'component.formField.helper.fontSize',
          'component.formField.helper.color',
          'component.formField.error.color',
        ],
        a11y: {
          role: 'form',
          hasLabels: true,
          focusable: true,
          keyboardNav: ['Tab', 'Enter'],
          errorHandling: true,
        },
      };
    },
  },

  // ==========================================================================
  // ENHANCED COMPONENT VARIANTS
  // ==========================================================================

  'card-product': {
    category: 'organism',
    description: 'Product card with image, price, rating, and add-to-cart',
    variants: ['default', 'elevated', 'outlined'],
    template: ({ image = null, title = 'Product Name', price = '29.99', rating = 4, reviewCount = 12, badge = null, onSale = false, salePrice = null, variant = 'default', id }) => {
      const cardId = id || `card-product-${Date.now()}`;
      return {
        html: `<article class="card-product card-product--${variant} card-product--interactive" id="${cardId}">
  <div class="card-product__image-wrapper">
    ${image
      ? `<img src="${image}" alt="${title}" class="card-product__image" style="aspect-ratio: 4/3; object-fit: cover;" />`
      : `<div class="card-product__image" style="aspect-ratio: 4/3; background: var(--primitive-color-neutral-200); display: flex; align-items: center; justify-content: center; color: var(--primitive-color-neutral-500); font-size: 0.875rem;" role="img" aria-label="${title} image placeholder">📷 Product Image</div>`}
    ${badge ? `<span class="card-product__badge badge badge--primary">${badge}</span>` : ''}
    ${onSale ? '<span class="card-product__badge card-product__badge--sale badge badge--danger">Sale</span>' : ''}
  </div>
  <div class="card-product__body">
    <h3 class="card-product__title">${title}</h3>
    <div class="card-product__price-group">
      ${onSale && salePrice
        ? `<span class="card-product__price card-product__price--sale" aria-label="Sale price: $${salePrice}">$${salePrice}</span>
      <span class="card-product__price card-product__price--original" aria-label="Original price: $${price}"><s>$${price}</s></span>`
        : `<span class="card-product__price" aria-label="Price: $${price}">$${price}</span>`}
    </div>
    <div class="card-product__rating" role="img" aria-label="Rating: ${rating} out of 5, ${reviewCount} reviews">
      ${Array.from({ length: 5 }, (_, i) => `<span class="card-product__star${i < rating ? ' card-product__star--filled' : ''}" aria-hidden="true">&#x2605;</span>`).join('')}
      <span class="card-product__review-count" aria-hidden="true">(${reviewCount})</span>
    </div>
    <button type="button" class="btn btn--primary card-product__add-to-cart" aria-label="Add ${title} to cart">
      Add to Cart
    </button>
  </div>
</article>`,
        tokens: [
          'component.card.background',
          'component.card.borderRadius',
          'component.card.shadow',
          'component.card.padding',
          'semantic.color.success.default',
          'semantic.color.success.text',
          'component.button.primary.background',
          'component.button.primary.color',
        ],
        a11y: {
          role: 'article',
          landmark: true,
          priceLabels: true,
          ratingDisplay: true,
          focusable: true,
        },
      };
    },
  },

  'card-profile': {
    category: 'organism',
    description: 'Profile/team member card',
    template: ({ name = 'Jane Doe', role = 'Designer', avatar = '', bio = '', socialLinks = [], email = '', variant = 'default', id }) => {
      const cardId = id || `card-profile-${Date.now()}`;
      return {
        html: `<article class="card-profile card-profile--${variant}" id="${cardId}">
  <div class="card-profile__header">
    <span class="avatar avatar--xl card-profile__avatar">
      ${avatar
        ? `<img src="${avatar}" alt="${name}" class="avatar__image" style="width: 128px; height: 128px; border-radius: 50%;" />`
        : `<span class="avatar__fallback" aria-label="${name}" style="width: 128px; height: 128px; border-radius: 50%;">${name.charAt(0)}</span>`}
    </span>
  </div>
  <div class="card-profile__body">
    <h3 class="card-profile__name">${name}</h3>
    <p class="card-profile__role">${role}</p>
    ${bio ? `<p class="card-profile__bio">${bio}</p>` : ''}
  </div>
  <div class="card-profile__footer">
    ${socialLinks.length ? `<div class="card-profile__social">
      ${socialLinks.map(link => `<a href="${link.url}" class="card-profile__social-link" aria-label="${link.platform} profile for ${name}" target="_blank" rel="noopener noreferrer">
        <span aria-hidden="true">${link.icon || link.platform.charAt(0)}</span>
      </a>`).join('')}
    </div>` : ''}
    ${email ? `<a href="mailto:${email}" class="card-profile__email link" aria-label="Email ${name}">
      <span aria-hidden="true">&#x2709;</span> ${email}
    </a>` : ''}
  </div>
</article>`,
        tokens: [
          'component.card.background',
          'component.card.borderRadius',
          'component.card.shadow',
          'component.card.padding',
          'component.avatar.background',
          'component.avatar.borderRadius',
        ],
        a11y: {
          role: 'article',
          landmark: true,
          socialLabels: true,
        },
      };
    },
  },

  'card-stats': {
    category: 'molecule',
    description: 'Statistics/KPI card',
    variants: ['default', 'primary', 'success', 'danger'],
    template: ({ label = 'Total Users', value = '1,234', change = '+12.5%', changeDirection = 'up', icon = null, variant = 'default', id }) => {
      const cardId = id || `card-stats-${Date.now()}`;
      const changeColor = changeDirection === 'up' ? 'success' : 'danger';
      const changeArrow = changeDirection === 'up' ? '\u25B2' : '\u25BC';
      return {
        html: `<div class="card-stats card-stats--${variant}" role="group" aria-label="${label}: ${value}" id="${cardId}">
  ${icon ? `<div class="card-stats__icon" aria-hidden="true">${icon}</div>` : ''}
  <div class="card-stats__content">
    <span class="card-stats__label">${label}</span>
    <span class="card-stats__value">${value}</span>
    ${change ? `<span class="card-stats__change card-stats__change--${changeColor}" aria-label="Change: ${change} ${changeDirection}">
      <span aria-hidden="true">${changeArrow}</span> ${change}
    </span>` : ''}
  </div>
</div>`,
        tokens: [
          'component.card.background',
          'component.card.borderRadius',
          'component.card.shadow',
          'component.card.padding',
          'semantic.color.success.default',
          'semantic.color.danger.default',
          'semantic.color.text.muted',
        ],
        a11y: {
          role: 'group',
          labelledBy: true,
          changeIndicator: true,
        },
      };
    },
  },

  hero: {
    category: 'organism',
    description: 'Hero section with headline, CTAs, and optional background',
    template: ({ headline = 'Welcome to Our Platform', subheadline = '', description = '', primaryCta = 'Get Started', secondaryCta = '', image = '', alignment = 'center', gradient = false, id }) => {
      const heroId = id || `hero-${Date.now()}`;
      return {
        html: `<section class="hero hero--${alignment}${gradient ? ' hero--gradient' : ''}" id="${heroId}" style="min-height: 60vh;">
  ${image ? `<div class="hero__background" aria-hidden="true">
    <img src="${image}" alt="" class="hero__background-image" aria-hidden="true" />
    <div class="hero__overlay"></div>
  </div>` : ''}
  <div class="hero__container animate-fade-in-up">
    <h1 class="hero__headline">${headline}</h1>
    ${subheadline ? `<p class="hero__subheadline">${subheadline}</p>` : ''}
    ${description ? `<p class="hero__description">${description}</p>` : ''}
    <div class="hero__cta-group">
      ${primaryCta ? `<a href="#" class="btn btn--primary btn--lg hero__cta hero__cta--primary">${primaryCta}</a>` : ''}
      ${secondaryCta ? `<a href="#" class="btn btn--secondary btn--lg hero__cta hero__cta--secondary">${secondaryCta}</a>` : ''}
    </div>
  </div>
</section>`,
        tokens: [
          'semantic.gradient.surface.hero',
          'component.button.primary.background',
          'component.button.primary.color',
          'component.button.secondary.background',
          'component.button.secondary.color',
          'semantic.color.text.inverse',
        ],
        a11y: {
          role: 'region',
          headingHierarchy: true,
          ctaAccessible: true,
          decorativeImage: true,
        },
      };
    },
  },

  'feature-grid': {
    category: 'organism',
    description: 'Features showcase grid with icons',
    template: ({ features = [{ icon: '&#x2605;', title: 'Feature One', description: 'Description of feature one.' }, { icon: '&#x2665;', title: 'Feature Two', description: 'Description of feature two.' }, { icon: '&#x2714;', title: 'Feature Three', description: 'Description of feature three.' }], columns = 3, id }) => {
      const gridId = id || `feature-grid-${Date.now()}`;
      return {
        html: `<section class="feature-grid" aria-label="Features" id="${gridId}" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--semantic-spacing-lg, 2rem);">
  ${features.map((feature, i) => `
  <div class="feature-grid__item animate-stagger" style="--stagger-index: ${i};">
    <div class="feature-grid__icon" aria-hidden="true" style="width: 64px; height: 64px;">
      ${feature.icon}
    </div>
    <h3 class="feature-grid__title">${feature.title}</h3>
    <p class="feature-grid__description">${feature.description}</p>
  </div>`).join('')}
</section>`,
        tokens: [
          'component.card.background',
          'component.card.borderRadius',
          'component.card.padding',
          'semantic.color.text.primary',
          'semantic.color.text.secondary',
        ],
        a11y: {
          role: 'region',
          landmark: true,
          headingHierarchy: true,
        },
      };
    },
  },

  'pricing-table': {
    category: 'organism',
    description: 'Pricing comparison card',
    variants: ['default', 'highlighted'],
    template: ({ name = 'Pro', price = '29', period = '/mo', features = [{ label: 'Feature A', included: true }, { label: 'Feature B', included: true }, { label: 'Feature C', included: false }], cta = 'Choose Plan', highlighted = false, description = '', id }) => {
      const pricingId = id || `pricing-${Date.now()}`;
      return {
        html: `<article class="pricing-card${highlighted ? ' pricing-card--highlighted' : ''}" id="${pricingId}">
  ${highlighted ? '<span class="pricing-card__badge badge badge--primary">Popular</span>' : ''}
  <header class="pricing-card__header">
    <h3 class="pricing-card__name">${name}</h3>
    ${description ? `<p class="pricing-card__description">${description}</p>` : ''}
    <div class="pricing-card__price" aria-label="Price: $${price} ${period}">
      <span class="pricing-card__currency">$</span>
      <span class="pricing-card__amount">${price}</span>
      <span class="pricing-card__period">${period}</span>
    </div>
  </header>
  <ul class="pricing-card__features" role="list">
    ${features.map(feature => `
    <li class="pricing-card__feature pricing-card__feature--${feature.included ? 'included' : 'excluded'}">
      <span class="pricing-card__feature-icon" aria-hidden="true">${feature.included ? '&#x2713;' : '&#x2717;'}</span>
      <span${!feature.included ? ' class="pricing-card__feature--muted"' : ''}>${feature.label}</span>
    </li>`).join('')}
  </ul>
  <footer class="pricing-card__footer">
    <button type="button" class="btn ${highlighted ? 'btn--primary' : 'btn--secondary'} btn--lg pricing-card__cta">
      ${cta}
    </button>
  </footer>
</article>`,
        tokens: [
          'component.card.background',
          'component.card.borderRadius',
          'component.card.shadow',
          'component.card.padding',
          'semantic.gradient.surface.primary',
          'component.button.primary.background',
          'component.button.secondary.background',
        ],
        a11y: {
          role: 'article',
          landmark: true,
          priceLabels: true,
          listMarkup: true,
        },
      };
    },
  },

  // ==========================================================================
  // LAYOUT TEMPLATES (Atomic Design "Template" tier)
  // ==========================================================================

  'layout-dashboard': {
    category: 'template',
    description: 'Dashboard layout with sidebar and header',
    template: ({ sidebar = '', header = '', content = '', title = 'Dashboard', id }) => {
      const layoutId = id || `layout-dashboard-${Date.now()}`;
      return {
        html: `<div class="layout-dashboard" id="${layoutId}">
  <a href="#${layoutId}-main" class="skip-link visually-hidden">Skip to main content</a>
  <aside class="layout-dashboard__sidebar" id="${layoutId}-sidebar" aria-label="Sidebar navigation" style="width: 260px;">
    <nav class="layout-dashboard__nav" aria-label="Dashboard navigation">
      ${sidebar || `<ul class="layout-dashboard__nav-list" role="menubar" aria-orientation="vertical">
        <li role="none"><a href="#" role="menuitem" class="layout-dashboard__nav-item layout-dashboard__nav-item--active" aria-current="page">Dashboard</a></li>
        <li role="none"><a href="#" role="menuitem" class="layout-dashboard__nav-item">Analytics</a></li>
        <li role="none"><a href="#" role="menuitem" class="layout-dashboard__nav-item">Settings</a></li>
      </ul>`}
    </nav>
  </aside>
  <div class="layout-dashboard__main-area">
    <header class="layout-dashboard__header" role="banner">
      <button type="button" class="layout-dashboard__sidebar-toggle" aria-expanded="true" aria-controls="${layoutId}-sidebar" aria-label="Toggle sidebar navigation">
        <span aria-hidden="true">&#x2630;</span>
      </button>
      ${header || `<h1 class="layout-dashboard__title">${title}</h1>`}
    </header>
    <main class="layout-dashboard__content" id="${layoutId}-main" role="main">
      ${content || '<p>Dashboard content goes here.</p>'}
    </main>
  </div>
</div>`,
        tokens: [
          'semantic.surface.background',
          'semantic.surface.elevated',
          'semantic.surface.border',
          'component.nav.bg',
          'component.nav.item.color.default',
          'component.nav.item.color.active',
          'component.nav.item.bg.hover',
        ],
        a11y: {
          role: 'application',
          landmarks: ['navigation', 'banner', 'main'],
          skipLink: true,
          sidebarToggle: true,
          focusable: true,
          keyboardNav: ['Tab'],
        },
      };
    },
  },

  'layout-marketing': {
    category: 'template',
    description: 'Marketing/landing page layout with sticky header',
    template: ({ brand = 'Brand', navItems = [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Contact', href: '#contact' }], heroContent = '', sections = '', footer = '', id }) => {
      const layoutId = id || `layout-marketing-${Date.now()}`;
      return {
        html: `<div class="layout-marketing" id="${layoutId}">
  <a href="#${layoutId}-main" class="skip-link visually-hidden">Skip to main content</a>
  <header class="layout-marketing__header" role="banner" style="position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px); background: var(--semantic-glass-bg, rgba(255,255,255,0.8));">
    <div class="layout-marketing__header-container">
      <a href="/" class="layout-marketing__brand" aria-label="Home">${brand}</a>
      <nav class="layout-marketing__nav" aria-label="Main navigation">
        <ul class="layout-marketing__nav-list" role="menubar">
          ${navItems.map((item, i) => `
          <li role="none">
            <a href="${item.href || '#'}" role="menuitem" class="layout-marketing__nav-item">${item.label}</a>
          </li>`).join('')}
        </ul>
      </nav>
      <button type="button" class="layout-marketing__mobile-trigger" aria-expanded="false" aria-label="Toggle navigation menu">
        <span aria-hidden="true">&#x2630;</span>
      </button>
    </div>
  </header>
  <main id="${layoutId}-main" role="main">
    ${heroContent || `<section class="layout-marketing__hero hero hero--center hero--gradient" style="min-height: 60vh;">
      <div class="hero__container animate-fade-in-up">
        <h1 class="hero__headline">Build Something Amazing</h1>
        <p class="hero__subheadline">A compelling description of your product or service.</p>
        <div class="hero__cta-group">
          <a href="#" class="btn btn--primary btn--lg">Get Started</a>
          <a href="#" class="btn btn--secondary btn--lg">Learn More</a>
        </div>
      </div>
    </section>`}
    ${sections || ''}
  </main>
  <footer class="layout-marketing__footer" role="contentinfo">
    ${footer || `<p>&copy; ${new Date().getFullYear()} ${brand}. All rights reserved.</p>`}
  </footer>
</div>`,
        tokens: [
          'semantic.glass.bg',
          'semantic.glass.border',
          'semantic.gradient.surface.hero',
          'component.nav.bg',
          'component.nav.item.color.default',
          'component.nav.item.color.active',
          'component.button.primary.background',
          'component.button.secondary.background',
        ],
        a11y: {
          role: 'document',
          landmarks: ['banner', 'navigation', 'main', 'contentinfo'],
          skipLink: true,
          headingHierarchy: true,
          focusable: true,
        },
      };
    },
  },

  'layout-blog': {
    category: 'template',
    description: 'Blog/article layout with sidebar TOC',
    template: ({ title = 'Article Title', author = 'Author Name', date = '2025-01-01', content = '', tags = [], relatedPosts = [], id }) => {
      const layoutId = id || `layout-blog-${Date.now()}`;
      const readingTime = Math.max(1, Math.ceil((content.length || 200) / 1000));
      return {
        html: `<div class="layout-blog" id="${layoutId}">
  <a href="#${layoutId}-article" class="skip-link visually-hidden">Skip to article</a>
  <div class="layout-blog__container" style="max-width: 1120px; margin: 0 auto;">
    <aside class="layout-blog__toc-sidebar" aria-label="Table of contents" style="position: sticky; top: 1rem;">
      <nav class="layout-blog__toc" aria-label="Table of contents">
        <h2 class="layout-blog__toc-title">Contents</h2>
        <ul class="layout-blog__toc-list" role="list">
          <li><a href="#" class="layout-blog__toc-link">Introduction</a></li>
        </ul>
      </nav>
    </aside>
    <article class="layout-blog__article" id="${layoutId}-article" style="max-width: 720px; margin: 0 auto;">
      <header class="layout-blog__header">
        <h1 class="layout-blog__title">${title}</h1>
        <div class="layout-blog__meta">
          <span class="layout-blog__author">${author}</span>
          <time class="layout-blog__date" datetime="${date}">${date}</time>
          <span class="layout-blog__reading-time" aria-label="Estimated reading time">${readingTime} min read</span>
        </div>
      </header>
      <div class="layout-blog__content">
        ${content || '<p>Article content goes here.</p>'}
      </div>
      ${tags.length ? `<footer class="layout-blog__tags" aria-label="Article tags">
        ${tags.map(tag => `<span class="chip chip--outlined chip--sm">${tag}</span>`).join('')}
      </footer>` : ''}
    </article>
  </div>
  ${relatedPosts.length ? `<section class="layout-blog__related" aria-label="Related posts">
    <h2 class="layout-blog__related-title">Related Posts</h2>
    <div class="layout-blog__related-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--semantic-spacing-lg, 2rem);">
      ${relatedPosts.map(post => `
      <article class="card card--default">
        <div class="card__body">
          <h3 class="card__title"><a href="${post.href || '#'}">${post.title}</a></h3>
          ${post.excerpt ? `<p class="card__content">${post.excerpt}</p>` : ''}
        </div>
      </article>`).join('')}
    </div>
  </section>` : ''}
</div>`,
        tokens: [
          'semantic.color.text.primary',
          'semantic.color.text.secondary',
          'semantic.color.text.muted',
          'component.card.background',
          'component.card.borderRadius',
          'component.card.shadow',
          'component.chip.variant.outlined.bg',
          'component.chip.variant.outlined.color',
        ],
        a11y: {
          role: 'article',
          landmark: true,
          headingHierarchy: true,
          timeElement: true,
          skipLink: true,
        },
      };
    },
  },

  // ==========================================================================
  // COMPOUND COMPONENTS
  // ==========================================================================

  'search-autocomplete': {
    category: 'molecule',
    description: 'Search input with autocomplete suggestions',
    template: ({ placeholder = 'Search...', suggestions = ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'], recentSearches = [], id }) => {
      const searchId = id || `search-autocomplete-${Date.now()}`;
      return {
        html: `<div class="search-autocomplete" id="${searchId}">
  <div class="search-autocomplete__input-wrapper">
    <span class="search-autocomplete__icon" aria-hidden="true">&#x1F50D;</span>
    <input
      type="search"
      class="search-autocomplete__input"
      id="${searchId}-input"
      placeholder="${placeholder}"
      role="combobox"
      aria-expanded="false"
      aria-controls="${searchId}-listbox"
      aria-activedescendant=""
      aria-autocomplete="list"
      aria-label="Search"
      autocomplete="off"
    />
  </div>
  <div class="search-autocomplete__dropdown" id="${searchId}-dropdown" hidden>
    ${recentSearches.length ? `<div class="search-autocomplete__section">
      <h3 class="search-autocomplete__section-title" id="${searchId}-recent-label">Recent Searches</h3>
      <ul class="search-autocomplete__list" role="listbox" aria-labelledby="${searchId}-recent-label">
        ${recentSearches.map((item, i) => `
        <li class="search-autocomplete__item" role="option" id="${searchId}-recent-${i}" aria-selected="false">
          <span class="search-autocomplete__item-icon" aria-hidden="true">&#x1F552;</span>
          ${item}
        </li>`).join('')}
      </ul>
    </div>` : ''}
    <div class="search-autocomplete__section">
      <h3 class="search-autocomplete__section-title" id="${searchId}-suggestions-label">Suggestions</h3>
      <ul class="search-autocomplete__list" role="listbox" id="${searchId}-listbox" aria-labelledby="${searchId}-suggestions-label">
        ${suggestions.map((item, i) => `
        <li class="search-autocomplete__item" role="option" id="${searchId}-option-${i}" aria-selected="false">
          ${item}
        </li>`).join('')}
      </ul>
    </div>
    <div class="search-autocomplete__footer" aria-hidden="true">
      <kbd>&#x2191;&#x2193;</kbd> to navigate &middot; <kbd>Enter</kbd> to select &middot; <kbd>Esc</kbd> to close
    </div>
  </div>
</div>`,
        tokens: [
          'component.input.background',
          'component.input.border',
          'component.input.borderRadius',
          'component.dropdown.background',
          'component.dropdown.shadow',
          'component.dropdown.borderRadius',
        ],
        a11y: {
          role: 'combobox',
          expandable: true,
          activedescendant: true,
          keyboardNav: ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'],
          focusManagement: 'activedescendant',
        },
      };
    },
  },

  'data-table': {
    category: 'organism',
    description: 'Advanced data table with search, sort, filter, and pagination',
    template: ({ columns = [{ label: 'Name', key: 'name' }, { label: 'Email', key: 'email' }, { label: 'Role', key: 'role' }], rows = [], searchable = true, filterable = false, paginated = true, selectable = false, pageSize = 10, id }) => {
      const tableId = id || `data-table-${Date.now()}`;
      return {
        html: `<div class="data-table" id="${tableId}">
  <div class="data-table__toolbar">
    ${searchable ? `<div class="data-table__search">
      <label for="${tableId}-search" class="visually-hidden">Search table</label>
      <input
        type="search"
        id="${tableId}-search"
        class="data-table__search-input form-field__input"
        placeholder="Search..."
        aria-controls="${tableId}-table"
      />
    </div>` : ''}
    ${filterable ? `<div class="data-table__filters">
      <button type="button" class="btn btn--secondary data-table__filter-trigger" aria-haspopup="menu" aria-expanded="false">
        <span aria-hidden="true">&#x25BD;</span> Filter
      </button>
    </div>` : ''}
    <div class="data-table__actions">
      <button type="button" class="btn btn--ghost data-table__columns-toggle" aria-haspopup="menu" aria-expanded="false" aria-label="Toggle column visibility">
        <span aria-hidden="true">&#x2630;</span> Columns
      </button>
    </div>
  </div>
  <div class="data-table__container" role="region" aria-labelledby="${tableId}-caption" tabindex="0">
    <table class="data-table__table" id="${tableId}-table">
      <caption id="${tableId}-caption" class="visually-hidden">Data table</caption>
      <thead class="data-table__head" style="position: sticky; top: 0;">
        <tr>
          ${selectable ? `<th scope="col" class="data-table__header data-table__header--checkbox">
            <label class="checkbox" for="${tableId}-select-all">
              <input type="checkbox" id="${tableId}-select-all" class="checkbox__input" aria-label="Select all rows" />
              <span class="checkbox__control" aria-hidden="true"></span>
            </label>
          </th>` : ''}
          ${columns.map(col => `
          <th scope="col" class="data-table__header" aria-sort="none">
            <button type="button" class="data-table__sort-button" aria-label="Sort by ${col.label}">
              ${col.label}
              <span class="data-table__sort-icon" aria-hidden="true">&#x21C5;</span>
            </button>
          </th>`).join('')}
        </tr>
      </thead>
      <tbody class="data-table__body">
        ${(rows.length ? rows : []).map((row, rowIdx) => `
        <tr class="data-table__row">
          ${selectable ? `<td class="data-table__cell data-table__cell--checkbox">
            <label class="checkbox" for="${tableId}-select-${rowIdx}">
              <input type="checkbox" id="${tableId}-select-${rowIdx}" class="checkbox__input" aria-label="Select row ${rowIdx + 1}" />
              <span class="checkbox__control" aria-hidden="true"></span>
            </label>
          </td>` : ''}
          ${columns.map(col => `
          <td class="data-table__cell">${row[col.key] || ''}</td>`).join('')}
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  ${paginated ? `<div class="data-table__footer">
    <span class="data-table__info" aria-live="polite">Showing 1-${Math.min(pageSize, rows.length || pageSize)} of ${rows.length || pageSize} results</span>
    <nav class="pagination data-table__pagination" aria-label="Table pagination">
      <ul class="pagination__list">
        <li>
          <button type="button" class="pagination__item pagination__prev" aria-label="Go to previous page" disabled aria-disabled="true">
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>
        <li>
          <button type="button" class="pagination__item pagination__item--active" aria-label="Go to page 1" aria-current="page">1</button>
        </li>
        <li>
          <button type="button" class="pagination__item" aria-label="Go to page 2">2</button>
        </li>
        <li>
          <button type="button" class="pagination__item pagination__next" aria-label="Go to next page">
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>
      </ul>
    </nav>
  </div>` : ''}
</div>`,
        tokens: [
          'component.table.bg',
          'component.table.border.color',
          'component.table.header.bg',
          'component.table.header.color',
          'component.table.cell.color',
          'component.table.cell.borderColor',
          'component.table.row.bg.hover',
          'component.input.background',
          'component.input.border',
          'component.pagination.item.bg.default',
          'component.pagination.item.bg.active',
        ],
        a11y: {
          role: 'table',
          sortable: true,
          selectable: selectable,
          focusable: true,
          keyboardNav: ['ArrowUp', 'ArrowDown', 'Space', 'Enter'],
          liveRegion: true,
          scrollable: true,
        },
      };
    },
  },

  'form-wizard': {
    category: 'molecule',
    description: 'Multi-step form wizard',
    template: ({ steps = [{ title: 'Account', fields: [{ label: 'Email', type: 'email', name: 'email', required: true }] }, { title: 'Profile', fields: [{ label: 'Name', type: 'text', name: 'name', required: true }] }, { title: 'Review', fields: [] }], currentStep = 0, id }) => {
      const wizardId = id || `form-wizard-${Date.now()}`;
      return {
        html: `<div class="form-wizard" id="${wizardId}">
  <nav class="form-wizard__stepper stepper stepper--horizontal" aria-label="Form progress">
    <ol class="stepper__list">
      ${steps.map((step, i) => {
        const state = i < currentStep ? 'completed' : i === currentStep ? 'active' : 'default';
        return `
      <li class="stepper__item stepper__item--${state}" aria-current="${state === 'active' ? 'step' : 'false'}">
        <span class="stepper__indicator">
          ${state === 'completed'
            ? '<span aria-hidden="true">&#x2713;</span><span class="visually-hidden">Completed: </span>'
            : `<span>${i + 1}</span>`}
        </span>
        <span class="stepper__label">${step.title}</span>
        ${i < steps.length - 1 ? '<span class="stepper__connector" aria-hidden="true"></span>' : ''}
      </li>`;
      }).join('')}
    </ol>
  </nav>
  <div class="form-wizard__progress" role="progressbar" aria-valuenow="${currentStep + 1}" aria-valuemin="1" aria-valuemax="${steps.length}" aria-label="Step ${currentStep + 1} of ${steps.length}">
    <div class="form-wizard__progress-bar" style="width: ${((currentStep + 1) / steps.length) * 100}%"></div>
  </div>
  <div class="form-wizard__step-announcement" aria-live="polite" aria-atomic="true" class="visually-hidden">
    Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]?.title || 'Step'}
  </div>
  <form class="form-wizard__form" id="${wizardId}-form">
    ${steps.map((step, stepIdx) => `
    <fieldset class="form-wizard__step${stepIdx === currentStep ? ' form-wizard__step--active' : ''}" ${stepIdx !== currentStep ? 'hidden' : ''} aria-labelledby="${wizardId}-step-title-${stepIdx}">
      <legend id="${wizardId}-step-title-${stepIdx}" class="form-wizard__step-title">${step.title}</legend>
      ${(step.fields || []).map((field, fieldIdx) => {
        const fieldId = `${wizardId}-step-${stepIdx}-field-${fieldIdx}`;
        return `
      <div class="form-group__field">
        <label for="${fieldId}" class="form-group__label">
          ${field.label}${field.required ? '<span class="form-group__required" aria-hidden="true">*</span>' : ''}
        </label>
        <input
          type="${field.type || 'text'}"
          id="${fieldId}"
          name="${field.name || field.label.toLowerCase()}"
          class="form-group__input"
          ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
          ${field.required ? 'required aria-required="true"' : ''}
        />
      </div>`;
      }).join('')}
    </fieldset>`).join('')}
    <div class="form-wizard__actions">
      <button type="button" class="btn btn--secondary form-wizard__prev"${currentStep === 0 ? ' disabled aria-disabled="true"' : ''} aria-label="Go to previous step">
        Back
      </button>
      ${currentStep < steps.length - 1
        ? '<button type="button" class="btn btn--primary form-wizard__next" aria-label="Go to next step">Next</button>'
        : '<button type="submit" class="btn btn--primary form-wizard__submit">Submit</button>'}
    </div>
  </form>
</div>`,
        tokens: [
          'component.stepper.step.bg.default',
          'component.stepper.step.bg.active',
          'component.stepper.step.bg.completed',
          'component.stepper.connector.color.default',
          'component.stepper.connector.color.completed',
          'component.input.background',
          'component.input.border',
          'component.button.primary.background',
          'component.button.secondary.background',
        ],
        a11y: {
          role: 'form',
          currentStep: true,
          liveRegion: true,
          hasLabels: true,
          focusable: true,
          keyboardNav: ['Tab', 'Enter'],
          formValidation: true,
        },
      };
    },
  },
};

// ============================================================================
// STYLE MODIFIERS — visual style overrides applied on top of base components
// ============================================================================

/**
 * Style modifiers that can be applied to any component via NL descriptions.
 * Each modifier adds CSS classes, wrapper styles, or token overrides.
 */
export const STYLE_MODIFIERS = {
  glass: {
    keywords: ['glass', 'glassmorphic', 'frosted', 'translucent', 'blur'],
    description: 'Frosted glass effect with backdrop blur',
    cssClasses: ['card--glass'],
    wrapperStyle: 'backdrop-filter: blur(var(--semantic-backdrop-blur-md)); -webkit-backdrop-filter: blur(var(--semantic-backdrop-blur-md)); background: var(--semantic-glass-surface-light); border: 1px solid var(--semantic-glass-border-light);',
    tokenOverrides: {
      background: 'var(--semantic-glass-surface-light)',
      borderColor: 'var(--semantic-glass-border-light)',
    },
  },
  gradient: {
    keywords: ['gradient', 'colorful', 'vibrant', 'rainbow'],
    description: 'Gradient background or accent',
    cssClasses: ['card--gradient'],
    wrapperStyle: 'background: var(--semantic-gradient-primary-default);',
    tokenOverrides: {
      background: 'var(--semantic-gradient-primary-default)',
    },
  },
  neumorphic: {
    keywords: ['neumorphic', 'neumorphism', 'soft', 'embossed'],
    description: 'Soft shadow neumorphism effect',
    cssClasses: [],
    wrapperStyle: 'background: var(--primitive-color-neutral-100); box-shadow: 8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7); border-radius: var(--primitive-radius-xl); border: none;',
    tokenOverrides: {},
  },
  brutalist: {
    keywords: ['brutalist', 'brutal', 'harsh', 'raw', 'bold border'],
    description: 'Thick borders, hard shadows, stark contrast',
    cssClasses: [],
    wrapperStyle: 'border: 3px solid var(--semantic-text-default); box-shadow: 4px 4px 0 var(--semantic-text-default); border-radius: 0;',
    tokenOverrides: {},
  },
  elevated: {
    keywords: ['elevated', 'floating', 'raised', 'lifted'],
    description: 'Strong elevation with large shadow',
    cssClasses: ['card--elevated'],
    wrapperStyle: 'box-shadow: var(--semantic-shadow-xl);',
    tokenOverrides: {},
  },
  'dark-luxury': {
    keywords: ['luxury', 'premium', 'elegant', 'gold', 'dark luxury'],
    description: 'Dark background with gold accents',
    cssClasses: [],
    wrapperStyle: 'background: var(--primitive-color-neutral-900); color: var(--primitive-color-neutral-100); border: 1px solid rgba(217, 119, 6, 0.3); box-shadow: 0 4px 12px -2px rgba(217, 119, 6, 0.2);',
    tokenOverrides: {},
  },
  'colored-shadow': {
    keywords: ['glow', 'colored shadow', 'tinted shadow', 'neon'],
    description: 'Color-tinted shadow matching the component variant',
    cssClasses: ['card--primary-shadow'],
    wrapperStyle: 'box-shadow: var(--semantic-shadow-colored-primary-md);',
    tokenOverrides: {},
  },
  animated: {
    keywords: ['animated', 'animate', 'entrance', 'fade in', 'slide in'],
    description: 'Entrance animation applied',
    cssClasses: ['animate-fade-in-up'],
    wrapperStyle: '',
    tokenOverrides: {},
  },
};

// ============================================================================
// PAGE COMPOSITIONS — full page layouts generated from descriptions
// ============================================================================

/**
 * Page compositions combine multiple component templates into full pages.
 * Triggered when the NL description mentions a page type or multiple sections.
 */
export const PAGE_COMPOSITIONS = {
  'marketing-page': {
    keywords: ['marketing page', 'landing page', 'homepage', 'product page'],
    description: 'Full marketing landing page',
    sections: ['layout-marketing'],
    components: [
      { type: 'hero', props: { headline: 'Build Something Amazing', subheadline: 'The modern way to create beautiful products', description: 'A comprehensive platform that helps you design, build, and ship faster.', primaryCta: 'Get Started', secondaryCta: 'Learn More', alignment: 'center' } },
      { type: 'feature-grid', props: { features: [{ icon: '🎨', title: 'Beautiful Design', description: 'Pixel-perfect components built with design tokens.' }, { icon: '⚡', title: 'Lightning Fast', description: 'Optimized for performance with GPU-accelerated animations.' }, { icon: '♿', title: 'Accessible', description: 'WCAG AA compliant with full keyboard navigation.' }, { icon: '🌙', title: 'Dark Mode', description: 'Automatic dark mode support via design tokens.' }, { icon: '📱', title: 'Responsive', description: 'Mobile-first design that works on any screen size.' }, { icon: '🧩', title: 'Composable', description: 'Mix and match components to build any layout.' }] } },
      { type: 'pricing-table', props: { name: 'Pro', price: '$29', period: '/month', features: [{ label: 'Unlimited projects', included: true }, { label: 'Priority support', included: true }, { label: 'Custom themes', included: true }, { label: 'API access', included: true }], cta: 'Start Free Trial', highlighted: true } },
    ],
  },
  'dashboard-page': {
    keywords: ['dashboard page', 'admin page', 'admin dashboard', 'app page'],
    description: 'Admin dashboard with sidebar, stats, and data table',
    sections: ['layout-dashboard'],
    components: [
      { type: 'card-stats', props: { label: 'Total Revenue', value: '$45,231', change: '+12.5%', changeDirection: 'up', icon: '💰' } },
      { type: 'card-stats', props: { label: 'Active Users', value: '2,345', change: '+8.2%', changeDirection: 'up', icon: '👥' } },
      { type: 'card-stats', props: { label: 'Conversion Rate', value: '3.24%', change: '-0.4%', changeDirection: 'down', icon: '📊' } },
      { type: 'data-table', props: { columns: [{ label: 'Name', key: 'name' }, { label: 'Status', key: 'status' }, { label: 'Revenue', key: 'revenue' }], rows: [{ name: 'Project Alpha', status: 'Active', revenue: '$12,400' }, { name: 'Project Beta', status: 'Review', revenue: '$8,200' }, { name: 'Project Gamma', status: 'Active', revenue: '$24,600' }], searchable: true, sortable: true } },
    ],
  },
  'blog-page': {
    keywords: ['blog page', 'article page', 'post page', 'blog'],
    description: 'Blog article with sidebar TOC',
    sections: ['layout-blog'],
    components: [
      { type: 'card', props: { title: 'Getting Started with Design Tokens', content: 'Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes.' } },
    ],
  },
  'pricing-page': {
    keywords: ['pricing page', 'plans page', 'subscription page'],
    description: 'Pricing comparison page with multiple plan cards',
    sections: [],
    components: [
      { type: 'hero', props: { headline: 'Simple, Transparent Pricing', subheadline: 'Choose the plan that works for you', alignment: 'center' } },
      { type: 'pricing-table', props: { name: 'Starter', price: '$0', period: '/month', description: 'Perfect for side projects', features: [{ label: '3 projects', included: true }, { label: 'Basic support', included: true }, { label: 'Custom themes', included: false }, { label: 'API access', included: false }], cta: 'Get Started' } },
      { type: 'pricing-table', props: { name: 'Pro', price: '$29', period: '/month', description: 'For growing teams', features: [{ label: 'Unlimited projects', included: true }, { label: 'Priority support', included: true }, { label: 'Custom themes', included: true }, { label: 'API access', included: false }], cta: 'Start Free Trial', highlighted: true } },
      { type: 'pricing-table', props: { name: 'Enterprise', price: '$99', period: '/month', description: 'For large organizations', features: [{ label: 'Unlimited projects', included: true }, { label: '24/7 support', included: true }, { label: 'Custom themes', included: true }, { label: 'API access', included: true }], cta: 'Contact Sales' } },
    ],
  },
};

// Helper for alert icons
function getAlertIcon(variant) {
  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠',
    danger: '✕',
    error: '✕',
  };
  return icons[variant] || icons.info;
}

// ============================================================================
// SEMANTIC HTML RULES
// ============================================================================

export const SEMANTIC_RULES = {
  // Interactive elements must be focusable
  interactive: {
    clickable: ['button', 'a'],
    notClickable: ['div', 'span', 'p'],
  },

  // Heading hierarchy
  headings: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

  // Landmark regions
  landmarks: {
    header: ['banner'],
    nav: ['navigation'],
    main: ['main'],
    aside: ['complementary'],
    footer: ['contentinfo'],
    section: ['region'],
  },

  // Required attributes
  required: {
    img: ['alt'],
    a: ['href'],
    input: ['type'],
    label: ['for'],
    button: ['type'],
  },

  // ARIA role mappings
  implicitRoles: {
    a: 'link',
    button: 'button',
    input: 'textbox',
    select: 'combobox',
    textarea: 'textbox',
    table: 'table',
    ul: 'list',
    ol: 'list',
    li: 'listitem',
    nav: 'navigation',
    main: 'main',
    header: 'banner',
    footer: 'contentinfo',
    aside: 'complementary',
    article: 'article',
    section: 'region',
    form: 'form',
    img: 'img',
  },
};

// ============================================================================
// COMPONENT GENERATOR CLASS
// ============================================================================

export class ComponentGeneratorAgent {
  constructor(options = {}) {
    this.tokenAgent = options.tokenAgent || null;
    this.motionAgent = options.motionAgent || null;
    this.issues = [];
  }

  /**
   * Reset issues
   */
  reset() {
    this.issues = [];
  }

  /**
   * Add an issue
   */
  addIssue(type, severity, message, context = {}) {
    this.issues.push({
      type,
      severity,
      message,
      ...context,
      timestamp: new Date().toISOString(),
    });
  }

  // ==========================================================================
  // COMPONENT GENERATION
  // ==========================================================================

  /**
   * Generate a component from a template
   * @param {string} componentType - Type of component (button, input, etc.)
   * @param {Object} props - Component properties
   * @returns {Object} Generated component
   */
  generate(componentType, props = {}) {
    const template = COMPONENT_TEMPLATES[componentType];
    
    if (!template) {
      return {
        error: true,
        message: `Unknown component type: ${componentType}`,
        availableTypes: Object.keys(COMPONENT_TEMPLATES),
      };
    }

    try {
      // Ensure sensible defaults for common template params
      const defaultLabels = {
        button: 'Button', input: 'Label', checkbox: 'Option', radio: 'Group',
        select: 'Select', textarea: 'Message', toggle: 'Toggle', spinner: 'Loading',
        divider: '', progress: 'Progress', rating: 'Rating', chip: 'Tag',
        link: 'Link', popover: 'Info', stepper: 'Step', navigation: 'Main',
      };
      if (!props.children) props.children = defaultLabels[componentType] || 'Content';
      if (!props.label) props.label = defaultLabels[componentType] || 'Label';
      if (!props.name) props.name = defaultLabels[componentType] || 'Group';

      const result = template.template(props);

      // Apply style modifiers if present
      if (props._styleModifiers && props._styleModifiers.length > 0) {
        const modifierClasses = [];
        const modifierStyles = [];
        for (const modName of props._styleModifiers) {
          const mod = STYLE_MODIFIERS[modName];
          if (mod) {
            modifierClasses.push(...(mod.cssClasses || []));
            if (mod.wrapperStyle) modifierStyles.push(mod.wrapperStyle);
          }
        }

        // Combine classes and styles onto the root element directly
        const allClasses = modifierClasses.join(' ');
        const allStyles = modifierStyles.join(' ');

        if (allClasses || allStyles) {
          // Inject classes into the first element's class attribute
          if (allClasses) {
            result.html = result.html.replace(
              /class="([^"]*?)"/,
              (match, existing) => `class="${existing} ${allClasses}"`
            );
          }
          // Inject styles into the first element (add or merge style attr)
          if (allStyles) {
            const hasStyle = /^(\s*<[^>]*?)(\sstyle="([^"]*)")/.test(result.html);
            if (hasStyle) {
              result.html = result.html.replace(
                /style="([^"]*)"/,
                (match, existing) => `style="${existing} ${allStyles}"`
              );
            } else {
              result.html = result.html.replace(
                /^(\s*<\w[^>]*?)(>)/,
                `$1 style="${allStyles}"$2`
              );
            }
          }
        }

        result.styleModifiers = props._styleModifiers;
      }

      // Resolve tokens if token agent is available
      if (this.tokenAgent && result.tokens) {
        result.resolvedTokens = this.resolveTokens(result.tokens);
      }

      // Add motion if motion agent is available
      if (this.motionAgent && this.needsAnimation(componentType)) {
        result.motion = this.getMotionConfig(componentType, props);
      }

      return {
        type: componentType,
        category: template.category,
        props,
        ...result,
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
      };
    }
  }

  /**
   * Generate component from natural language description
   * @param {string} description - Natural language description
   * @returns {Object} Generated component(s)
   */
  generateFromDescription(description) {
    // Check for page composition first
    const descLower = description.toLowerCase();
    const pageKeywords = ['page', 'layout', 'full page', 'website', 'site', 'landing'];
    const isPageRequest = pageKeywords.some(kw => descLower.includes(kw));

    if (isPageRequest) {
      const pageResult = this.generatePageComposition(description);
      if (!pageResult.error) {
        return pageResult;
      }
      // Fall through to single component if page composition didn't match
    }

    const parsed = this.parseDescription(description);

    if (parsed.error) {
      return parsed;
    }

    return this.generate(parsed.componentType, parsed.props);
  }

  /**
   * Generate a full page composition from a description
   * @param {string} description - Natural language page description
   * @returns {Object} Composed page with multiple components
   */
  generatePageComposition(description) {
    const desc = description.toLowerCase();

    // Check for page composition matches
    let matchedPage = null;
    for (const [pageType, composition] of Object.entries(PAGE_COMPOSITIONS)) {
      for (const keyword of composition.keywords) {
        if (desc.includes(keyword)) {
          matchedPage = { type: pageType, ...composition };
          break;
        }
      }
      if (matchedPage) break;
    }

    if (!matchedPage) {
      return {
        error: true,
        message: 'Could not determine page type from description',
        suggestion: 'Try: "marketing page", "dashboard page", "pricing page", "blog page"',
        availablePages: Object.keys(PAGE_COMPOSITIONS),
      };
    }

    // Generate each component in the composition
    const sections = [];
    for (const compDef of matchedPage.components) {
      const generated = this.generate(compDef.type, compDef.props || {});
      if (!generated.error) {
        sections.push(generated);
      }
    }

    // Compose the full page HTML
    const pageHtml = sections.map(s => s.html).join('\n\n<!-- Section divider -->\n\n');

    // Combine all tokens
    const allTokens = [...new Set(sections.flatMap(s => s.tokens || []))];

    return {
      type: 'page-composition',
      pageType: matchedPage.type,
      description: matchedPage.description,
      html: `<div class="page-composition page-composition--${matchedPage.type}">\n${pageHtml}\n</div>`,
      sections,
      tokens: allTokens,
      sectionCount: sections.length,
      a11y: {
        role: 'document',
        landmarks: true,
        headingHierarchy: true,
      },
    };
  }

  /**
   * Parse natural language description
   */
  parseDescription(description) {
    const desc = description.toLowerCase();
    
    // Match patterns
    const patterns = {
      button: /\b(button|btn|cta)\b/,
      input: /\b(input|text\s*field|form\s*field|text\s*box|search\s*field|search\s*input|search\s*bar)\b/,
      card: /\b(card|tile|box)\b/,
      modal: /\b(modal|dialog|popup|overlay)\b/,
      alert: /\b(alert|notification|message|banner)\b/,
      tabs: /\b(tabs|tabbed|tab\s*list)\b/,
      accordion: /\b(accordion|collapsible|expandable)\b/,
      dropdown: /\b(dropdown|menu)\b/,
      toast: /\b(toast|snackbar)\b/,
      badge: /\b(badge|tag)\b/,
      avatar: /\b(avatar|profile\s*pic|user\s*image)\b/,
      spinner: /\b(spinner|loader|loading)\b/,
      tooltip: /\b(tooltip|hint|help\s*text)\b/,
      checkbox: /\b(checkbox|check\s*box|check\s*mark)\b/,
      radio: /\b(radio|radio\s*button|radio\s*group)\b/,
      select: /\b(select|select\s*box|combobox|combo\s*box)\b/,
      textarea: /\b(textarea|text\s*area|multi\s*line)\b/,
      toggle: /\b(toggle|switch)\b/,
      table: /\b(table|data\s*table|data\s*grid)\b/,
      divider: /\b(divider|separator|hr|horizontal\s*rule)\b/,
      skeleton: /\b(skeleton|placeholder|shimmer)\b/,
      navigation: /\b(nav|navbar|navigation|nav\s*bar|header\s*nav)\b/,
      breadcrumb: /\b(breadcrumb|bread\s*crumb|crumb\s*trail)\b/,
      pagination: /\b(pagination|pager|page\s*nav)\b/,
      progress: /\b(progress|progress\s*bar|loading\s*bar)\b/,
      stepper: /\b(stepper|step\s*indicator|wizard|multi\s*step)\b/,
      popover: /\b(popover|pop\s*over|flyout)\b/,
      link: /\b(link|hyperlink|anchor)\b/,
      chip: /\b(chip|pill|tag\s*item)\b/,
      rating: /\b(rating|star\s*rating|stars|review\s*score)\b/,
      'form-group': /\b(form\s*group|form\s*layout|field\s*group|form\s*section)\b/,
      'card-product': /\b(product\s*card|shop\s*card|product\s*tile)\b/,
      'card-profile': /\b(profile\s*card|team\s*card|member\s*card|user\s*card)\b/,
      'card-stats': /\b(stat\s*card|stats\s*card|kpi\s*card|metric\s*card|analytics\s*card)\b/,
      'hero': /\b(hero|hero\s*section|landing\s*hero|banner\s*section)\b/,
      'feature-grid': /\b(feature\s*grid|features|feature\s*list|feature\s*section)\b/,
      'pricing-table': /\b(pricing|pricing\s*table|pricing\s*card|price\s*card|plan\s*card)\b/,
      'layout-dashboard': /\b(dashboard\s*layout|admin\s*layout|app\s*layout|dashboard\s*template)\b/,
      'layout-marketing': /\b(marketing\s*layout|landing\s*page\s*layout|marketing\s*template)\b/,
      'layout-blog': /\b(blog\s*layout|article\s*layout|blog\s*template|post\s*layout)\b/,
      'search-autocomplete': /\b(search\s*autocomplete|search\s*with\s*suggestions|autocomplete\s*search|search\s*combo)\b/,
      'data-table': /\b(data\s*table|advanced\s*table|sortable\s*table|filterable\s*table)\b/,
      'form-wizard': /\b(form\s*wizard|multi\s*step\s*form|step\s*form|wizard\s*form)\b/,
    };

    // Find matching component — prefer earliest match position in input
    let componentType = null;
    let bestPos = Infinity;
    for (const [type, pattern] of Object.entries(patterns)) {
      const match = pattern.exec(desc);
      if (match && match.index < bestPos) {
        bestPos = match.index;
        componentType = type;
      }
    }

    if (!componentType) {
      return {
        error: true,
        message: 'Could not determine component type from description',
        suggestion: 'Try including words like: button, input, card, modal, alert, tabs, dropdown',
      };
    }

    // Extract props from description
    const props = this.extractPropsFromDescription(desc, componentType);

    return {
      componentType,
      props,
      confidence: this.calculateConfidence(desc, componentType),
    };
  }

  /**
   * Extract props from description
   */
  extractPropsFromDescription(desc, componentType) {
    const props = {};

    // Variants
    const variants = {
      primary: /\b(primary|main|default)\b/,
      secondary: /\b(secondary|alternate)\b/,
      danger: /\b(danger|error|destructive|delete|remove)\b/,
      warning: /\b(warning|caution)\b/,
      success: /\b(success|confirm|positive)\b/,
      info: /\b(info|information)\b/,
      ghost: /\b(ghost|text|link)\b/,
      outlined: /\b(outlined|outline|border)\b/,
    };

    for (const [variant, pattern] of Object.entries(variants)) {
      if (pattern.test(desc)) {
        props.variant = variant;
        break;
      }
    }

    // Sizes
    const sizes = {
      sm: /\b(small|sm|tiny|compact)\b/,
      md: /\b(medium|md|default)\b/,
      lg: /\b(large|lg|big)\b/,
      xl: /\b(extra\s*large|xl|huge)\b/,
    };

    for (const [size, pattern] of Object.entries(sizes)) {
      if (pattern.test(desc)) {
        props.size = size;
        break;
      }
    }

    // States
    if (/\b(disabled|inactive)\b/.test(desc)) {
      props.disabled = true;
    }
    if (/\b(required|mandatory)\b/.test(desc)) {
      props.required = true;
    }
    if (/\b(dismissible|closable|close)\b/.test(desc)) {
      props.dismissible = true;
    }

    // Icon detection
    if (/\b(with\s*icon|icon|has\s*icon)\b/.test(desc)) {
      props.icon = '★';
    }

    // Title / heading detection
    const titleMatch = desc.match(/(?:titled?|heading|with\s*title)\s*["']([^"']+)["']/i);
    if (titleMatch) {
      props.title = titleMatch[1];
    } else if (/\bwith\s*title\b/.test(desc)) {
      props.title = props.title || 'Card Title';
    }

    // Content / body detection
    const contentMatch = desc.match(/(?:content|body|text)\s*["']([^"']+)["']/i);
    if (contentMatch) {
      props.content = contentMatch[1];
    }

    // Sale detection (for product cards)
    if (/\b(on\s*sale|sale|discounted|discount)\b/.test(desc)) {
      props.onSale = true;
      props.salePrice = props.salePrice || '19.99';
    }

    // Extract text content (label)
    const labelMatch = desc.match(/(?:labeled?|says?)\s*["']([^"']+)["']/i);
    if (labelMatch) {
      props.children = labelMatch[1];
      props.label = labelMatch[1];
    }

    // Style modifiers
    const detectedModifiers = [];
    for (const [modName, mod] of Object.entries(STYLE_MODIFIERS)) {
      for (const keyword of mod.keywords) {
        if (desc.includes(keyword)) {
          detectedModifiers.push(modName);
          break;
        }
      }
    }
    if (detectedModifiers.length > 0) {
      props._styleModifiers = detectedModifiers;
    }

    return props;
  }

  /**
   * Calculate confidence score for parsing
   */
  calculateConfidence(desc, componentType) {
    let score = 0.5; // Base score

    // Boost if explicit component name mentioned
    if (new RegExp(`\\b${componentType}\\b`, 'i').test(desc)) {
      score += 0.3;
    }

    // Boost if props detected
    if (desc.includes('primary') || desc.includes('secondary')) score += 0.1;
    if (desc.includes('small') || desc.includes('large')) score += 0.1;

    return Math.min(score, 1);
  }

  /**
   * Resolve tokens for a component
   */
  resolveTokens(tokenPaths) {
    if (!this.tokenAgent) return {};

    const resolved = {};
    for (const path of tokenPaths) {
      const token = this.tokenAgent.getToken(path);
      if (token) {
        resolved[path] = token.resolvedValue;
      }
    }
    return resolved;
  }

  /**
   * Check if component needs animation
   */
  needsAnimation(componentType) {
    const animatedComponents = ['modal', 'dropdown', 'accordion', 'toast', 'tooltip', 'alert', 'popover', 'progress', 'hero', 'feature-grid', 'pricing-table', 'search-autocomplete'];
    return animatedComponents.includes(componentType);
  }

  /**
   * Get motion configuration for component
   */
  getMotionConfig(componentType, props) {
    if (!this.motionAgent) return null;

    const motionMap = {
      modal: { type: 'modal-open', direction: 'enter' },
      dropdown: { type: 'dropdown-open', direction: 'enter' },
      accordion: { type: 'accordion-expand', direction: 'enter' },
      toast: { type: 'toast-enter', direction: 'enter' },
      tooltip: { type: 'tooltip-show', direction: 'enter' },
      alert: { type: 'fade-in', direction: 'enter' },
      popover: { type: 'popover-show', direction: 'enter' },
      progress: { type: 'progress-fill', direction: 'enter' },
      hero: { type: 'fade-in-up', direction: 'enter' },
      'feature-grid': { type: 'fade-in-up', direction: 'enter' },
      'pricing-table': { type: 'scale-in', direction: 'enter' },
      'search-autocomplete': { type: 'dropdown-open', direction: 'enter' },
    };

    const config = motionMap[componentType];
    if (!config) return null;

    const duration = this.motionAgent.getDuration(config.type);
    const easing = this.motionAgent.getEasing({ direction: config.direction });

    return {
      enter: {
        duration: duration.duration,
        easing: easing.easing,
        css: `transition: opacity ${duration.css} ${easing.css}, transform ${duration.css} ${easing.css}`,
      },
      exit: {
        duration: Math.round(duration.duration * 0.8),
        easing: this.motionAgent.getEasing({ direction: 'exit' }).easing,
      },
    };
  }

  // ==========================================================================
  // FIX APPLICATION (from Orchestrator)
  // ==========================================================================

  /**
   * Apply a fix request routed from Orchestrator
   * @param {Object} fix - Fix request
   * @returns {Object} Fix result
   */
  applyFix(fix) {
    if (!fix || !fix.fix) {
      return createFixResult({
        requestId: fix?.id,
        success: false,
        error: 'Invalid fix request',
      });
    }

    const { action, params } = fix.fix;

    try {
      switch (action) {
        case 'addAttribute': {
          const result = this.fixAddAttribute(fix.issue, params);
          return createFixResult({
            requestId: fix.id,
            success: true,
            changes: result,
            needsValidation: true,
          });
        }

        case 'replaceElement': {
          const result = this.fixReplaceElement(fix.issue, params);
          return createFixResult({
            requestId: fix.id,
            success: true,
            changes: result,
            needsValidation: true,
          });
        }

        case 'addLabel': {
          const result = this.fixAddLabel(fix.issue, params);
          return createFixResult({
            requestId: fix.id,
            success: true,
            changes: result,
            needsValidation: true,
          });
        }

        case 'removeAttribute': {
          const result = this.fixRemoveAttribute(fix.issue, params);
          return createFixResult({
            requestId: fix.id,
            success: true,
            changes: result,
            needsValidation: true,
          });
        }

        case 'replaceAttribute': {
          const result = this.fixReplaceAttribute(fix.issue, params);
          return createFixResult({
            requestId: fix.id,
            success: true,
            changes: result,
            needsValidation: true,
          });
        }

        default:
          return createFixResult({
            requestId: fix.id,
            success: false,
            error: `Unknown fix action: ${action}`,
          });
      }
    } catch (err) {
      return createFixResult({
        requestId: fix.id,
        success: false,
        error: err.message,
      });
    }
  }

  /**
   * Fix: Add attribute to element
   */
  fixAddAttribute(issue, params) {
    const { attribute, value = '' } = params;
    const element = issue?.element || 'element';

    // Generate the fix
    const before = `<${element}>`;
    const after = `<${element} ${attribute}="${value}">`;

    return {
      action: 'addAttribute',
      element,
      attribute,
      value,
      before,
      after,
      codeHint: `// Add ${attribute} to ${element}\nelement.setAttribute('${attribute}', '${value}');`,
    };
  }

  /**
   * Fix: Replace element with semantic alternative
   */
  fixReplaceElement(issue, params) {
    const { from, to } = params;

    const before = `<${from} onClick={handler}>...</${from}>`;
    const after = `<${to} onClick={handler}>...</${to}>`;

    return {
      action: 'replaceElement',
      from,
      to,
      before,
      after,
      reason: `${to} is the semantic element for interactive content`,
      codeHint: `// Replace <${from}> with <${to}> for proper semantics`,
    };
  }

  /**
   * Fix: Add label to form element
   */
  fixAddLabel(issue, params) {
    const { type = 'aria-label' } = params;
    const element = issue?.element || 'input';

    if (type === 'aria-label') {
      return {
        action: 'addLabel',
        type: 'aria-label',
        before: `<${element} />`,
        after: `<${element} aria-label="Description" />`,
        codeHint: `// Add aria-label for accessible name\nelement.setAttribute('aria-label', 'Description');`,
      };
    }

    // Using <label> element
    return {
      action: 'addLabel',
      type: 'label',
      before: `<${element} id="field" />`,
      after: `<label for="field">Label</label>\n<${element} id="field" />`,
      codeHint: `// Add label element with htmlFor\n<label htmlFor="field">Label</label>`,
    };
  }

  /**
   * Fix: Remove attribute from element
   */
  fixRemoveAttribute(issue, params) {
    const { attribute } = params;
    const element = issue?.element || 'element';

    return {
      action: 'removeAttribute',
      element,
      attribute,
      before: `<${element} ${attribute}="...">`,
      after: `<${element}>`,
      codeHint: `element.removeAttribute('${attribute}');`,
    };
  }

  /**
   * Fix: Replace attribute value
   */
  fixReplaceAttribute(issue, params) {
    const { attribute, validRoles = [] } = params;
    const element = issue?.element || 'element';

    return {
      action: 'replaceAttribute',
      element,
      attribute,
      suggestedValues: validRoles,
      codeHint: `// Replace invalid ${attribute} with valid value\n// Options: ${validRoles.join(', ')}`,
    };
  }

  // ==========================================================================
  // COMPONENT LISTING
  // ==========================================================================

  /**
   * List all available components
   */
  listComponents() {
    return Object.entries(COMPONENT_TEMPLATES).map(([name, template]) => ({
      name,
      category: template.category,
      description: template.description,
      variants: template.variants || [],
      sizes: template.sizes || [],
    }));
  }

  /**
   * Get component info
   */
  getComponentInfo(componentType) {
    const template = COMPONENT_TEMPLATES[componentType];
    if (!template) return null;

    return {
      name: componentType,
      category: template.category,
      description: template.description,
      variants: template.variants || [],
      sizes: template.sizes || [],
      a11yFeatures: template.template({}).a11y,
    };
  }

  // ==========================================================================
  // AGENT REQUEST HANDLER
  // ==========================================================================

  /**
   * Handle requests from Orchestrator or other agents
   */
  handleRequest(request) {
    if (!request || !request.action) {
      return { success: false, error: 'Request must include an action' };
    }

    const { action } = request;

    try {
      switch (action) {
        case 'generate':
          return {
            success: true,
            data: this.generate(request.componentType, request.props),
          };

        case 'generateFromDescription':
          return {
            success: true,
            data: this.generateFromDescription(request.description),
          };

        case 'parseDescription':
          return {
            success: true,
            data: this.parseDescription(request.description),
          };

        case 'listComponents':
          return {
            success: true,
            data: this.listComponents(),
          };

        case 'getComponentInfo':
          return {
            success: true,
            data: this.getComponentInfo(request.componentType),
          };

        case 'applyFix':
          return this.applyFix(request.fix);

        case 'generatePageComposition':
          return {
            success: true,
            data: this.generatePageComposition(request.description),
          };

        case 'listPageCompositions':
          return {
            success: true,
            data: Object.entries(PAGE_COMPOSITIONS).map(([name, comp]) => ({
              name,
              description: comp.description,
              componentCount: comp.components.length,
            })),
          };

        case 'listStyleModifiers':
          return {
            success: true,
            data: Object.entries(STYLE_MODIFIERS).map(([name, mod]) => ({
              name,
              description: mod.description,
              keywords: mod.keywords,
            })),
          };

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

export function createComponentGenerator(options = {}) {
  return new ComponentGeneratorAgent(options);
}

export default ComponentGeneratorAgent;
