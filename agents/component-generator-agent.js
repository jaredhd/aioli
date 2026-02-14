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
    template: ({ type = 'text', label, placeholder = '', required = false, error = null, id }) => {
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
    template: ({ variant = 'default', title, content, image = null, actions = null }) => ({
      html: `<article class="card card--${variant}">
  ${image ? `<img src="${image}" alt="" class="card__image" />` : ''}
  <div class="card__body">
    ${title ? `<h3 class="card__title">${title}</h3>` : ''}
    <div class="card__content">${content || ''}</div>
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
    const parsed = this.parseDescription(description);
    
    if (parsed.error) {
      return parsed;
    }

    return this.generate(parsed.componentType, parsed.props);
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

    // Extract text content
    const labelMatch = desc.match(/(?:labeled?|text|says?)\s*["']([^"']+)["']/i);
    if (labelMatch) {
      props.children = labelMatch[1];
      props.label = labelMatch[1];
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
    const animatedComponents = ['modal', 'dropdown', 'accordion', 'toast', 'tooltip', 'alert', 'popover', 'progress'];
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
