import{r as u,j as c,c as w,R as x}from"./client-DYDkQYN6.js";const b={button:{category:"atom",description:"Interactive button element",variants:["primary","secondary","danger","ghost"],sizes:["sm","md","lg"],template:({variant:e="primary",size:t="md",children:o="Button",disabled:n=!1,icon:a=null})=>({html:`<button 
  type="button"
  class="btn btn--${e} btn--${t}${n?" btn--disabled":""}"
  ${n?'disabled aria-disabled="true"':""}
>
  ${a?`<span class="btn__icon" aria-hidden="true">${a}</span>`:""}
  <span class="btn__text">${o}</span>
</button>`,tokens:[`component.button.${e}.background`,`component.button.${e}.color`,`component.button.${t}.padding`,`component.button.${t}.fontSize`],a11y:{role:"button",focusable:!0,keyboardNav:["Enter","Space"]}})},input:{category:"atom",description:"Text input field",variants:["text","email","password","search","number"],template:({type:e="text",label:t,placeholder:o="",required:n=!1,error:a=null,id:l})=>{const r=l||`input-${Date.now()}`;return{html:`<div class="form-field${a?" form-field--error":""}">
  <label for="${r}" class="form-field__label">
    ${t}${n?'<span class="form-field__required" aria-hidden="true">*</span>':""}
  </label>
  <input
    type="${e}"
    id="${r}"
    class="form-field__input"
    placeholder="${o}"
    ${n?'required aria-required="true"':""}
    ${a?`aria-invalid="true" aria-describedby="${r}-error"`:""}
  />
  ${a?`<span id="${r}-error" class="form-field__error" role="alert">${a}</span>`:""}
</div>`,tokens:["component.input.background","component.input.border","component.input.borderRadius","semantic.color.text.primary"],a11y:{role:"textbox",hasLabel:!0,focusable:!0,errorHandling:!0}}}},card:{category:"organism",description:"Content card container",variants:["default","elevated","outlined"],template:({variant:e="default",title:t,content:o,image:n=null,actions:a=null})=>({html:`<article class="card card--${e}">
  ${n?`<img src="${n}" alt="" class="card__image" />`:""}
  <div class="card__body">
    ${t?`<h3 class="card__title">${t}</h3>`:""}
    <div class="card__content">${o||""}</div>
  </div>
  ${a?`<div class="card__actions">${a}</div>`:""}
</article>`,tokens:["component.card.background","component.card.borderRadius","component.card.shadow","component.card.padding"],a11y:{role:"article",landmark:!0}})},modal:{category:"organism",description:"Dialog/modal window",template:({title:e="Dialog Title",content:t="Dialog content goes here.",actions:o,id:n})=>{const a=n||`modal-${Date.now()}`;return{html:`<div
  class="modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="${a}-title"
  aria-describedby="${a}-content"
>
  <div class="modal__backdrop" aria-hidden="true"></div>
  <div class="modal__container">
    <header class="modal__header">
      <h2 id="${a}-title" class="modal__title">${e}</h2>
      <button
        type="button"
        class="modal__close"
        aria-label="Close dialog"
      >
        <span aria-hidden="true">×</span>
      </button>
    </header>
    <div id="${a}-content" class="modal__content">
      ${t}
    </div>
    ${o?`<footer class="modal__footer">${o}</footer>`:""}
  </div>
</div>`,tokens:["component.modal.background","component.modal.borderRadius","component.modal.shadow","component.modal.backdrop"],a11y:{role:"dialog",modal:!0,focusTrap:!0,labelledBy:`${a}-title`,describedBy:`${a}-content`}}}},alert:{category:"molecule",description:"Alert/notification message",variants:["info","success","warning","danger"],template:({variant:e="info",title:t,message:o="This is an alert message.",dismissible:n=!1})=>({html:`<div
  class="alert alert--${e}"
  role="alert"
  aria-live="${e==="danger"?"assertive":"polite"}"
>
  <span class="alert__icon" aria-hidden="true">${v(e)}</span>
  <div class="alert__content">
    ${t?`<strong class="alert__title">${t}</strong>`:""}
    <p class="alert__message">${o}</p>
  </div>
  ${n?'<button type="button" class="alert__dismiss" aria-label="Dismiss alert">×</button>':""}
</div>`,tokens:[`semantic.color.${e}`,`component.alert.${e}.background`,`component.alert.${e}.border`],a11y:{role:"alert",live:e==="danger"?"assertive":"polite"}})},tabs:{category:"molecule",description:"Tabbed interface",template:({tabs:e=[{label:"Tab 1",content:"Tab 1 content"},{label:"Tab 2",content:"Tab 2 content"}],activeIndex:t=0})=>{const o=`tabs-${Date.now()}`;return{html:`<div class="tabs">
  <div class="tabs__list" role="tablist">
    ${e.map((n,a)=>`
    <button
      type="button"
      role="tab"
      id="${o}-tab-${a}"
      aria-selected="${a===t}"
      aria-controls="${o}-panel-${a}"
      class="tabs__tab${a===t?" tabs__tab--active":""}"
      ${a!==t?'tabindex="-1"':""}
    >
      ${n.label}
    </button>`).join("")}
  </div>
  ${e.map((n,a)=>`
  <div
    role="tabpanel"
    id="${o}-panel-${a}"
    aria-labelledby="${o}-tab-${a}"
    class="tabs__panel${a===t?" tabs__panel--active":""}"
    ${a!==t?"hidden":""}
  >
    ${n.content}
  </div>`).join("")}
</div>`,tokens:["component.tabs.background","component.tabs.activeIndicator","component.tabs.borderColor"],a11y:{role:"tablist",keyboardNav:["ArrowLeft","ArrowRight","Home","End"],focusManagement:"roving"}}}},accordion:{category:"molecule",description:"Expandable accordion sections",template:({items:e=[{title:"Section 1",content:"Section 1 content"},{title:"Section 2",content:"Section 2 content"}],allowMultiple:t=!1})=>{const o=`accordion-${Date.now()}`;return{html:`<div class="accordion" data-allow-multiple="${t}">
  ${e.map((n,a)=>`
  <div class="accordion__item">
    <h3 class="accordion__header">
      <button
        type="button"
        class="accordion__trigger"
        aria-expanded="false"
        aria-controls="${o}-panel-${a}"
        id="${o}-header-${a}"
      >
        <span class="accordion__title">${n.title}</span>
        <span class="accordion__icon" aria-hidden="true">▼</span>
      </button>
    </h3>
    <div
      id="${o}-panel-${a}"
      role="region"
      aria-labelledby="${o}-header-${a}"
      class="accordion__panel"
      hidden
    >
      <div class="accordion__content">${n.content}</div>
    </div>
  </div>`).join("")}
</div>`,tokens:["component.accordion.background","component.accordion.borderColor","component.accordion.headerPadding"],a11y:{role:"region",expandable:!0,keyboardNav:["ArrowUp","ArrowDown","Home","End"]}}}},dropdown:{category:"molecule",description:"Dropdown menu",template:({trigger:e="Menu",items:t=[{label:"Option 1"},{label:"Option 2"},{label:"Option 3"}],id:o})=>{const n=o||`dropdown-${Date.now()}`;return{html:`<div class="dropdown">
  <button
    type="button"
    class="dropdown__trigger"
    aria-haspopup="menu"
    aria-expanded="false"
    aria-controls="${n}-menu"
    id="${n}-trigger"
  >
    ${e}
    <span class="dropdown__arrow" aria-hidden="true">▼</span>
  </button>
  <ul
    class="dropdown__menu"
    role="menu"
    id="${n}-menu"
    aria-labelledby="${n}-trigger"
    hidden
  >
    ${t.map((a,l)=>`
    <li role="none">
      <${a.href?'a href="'+a.href+'"':'button type="button"'}
        role="menuitem"
        class="dropdown__item"
        ${a.disabled?'aria-disabled="true" tabindex="-1"':""}
      >
        ${a.icon?`<span class="dropdown__icon" aria-hidden="true">${a.icon}</span>`:""}
        ${a.label}
      </${a.href?"a":"button"}>
    </li>`).join("")}
  </ul>
</div>`,tokens:["component.dropdown.background","component.dropdown.shadow","component.dropdown.borderRadius"],a11y:{role:"menu",expandable:!0,keyboardNav:["ArrowUp","ArrowDown","Escape","Enter"],focusManagement:"activedescendant"}}}},toast:{category:"molecule",description:"Toast notification",variants:["info","success","warning","error"],template:({variant:e="info",message:t="This is a notification.",action:o=null,duration:n=5e3})=>({html:`<div
  class="toast toast--${e}"
  role="status"
  aria-live="polite"
  aria-atomic="true"
  data-duration="${n}"
>
  <span class="toast__icon" aria-hidden="true">${v(e)}</span>
  <p class="toast__message">${t}</p>
  ${o?`<button type="button" class="toast__action">${o}</button>`:""}
  <button type="button" class="toast__dismiss" aria-label="Dismiss">×</button>
</div>`,tokens:[`component.toast.${e}.background`,"component.toast.borderRadius","component.toast.shadow"],a11y:{role:"status",live:"polite",atomic:!0}})},badge:{category:"atom",description:"Status badge/tag",variants:["default","primary","success","warning","danger"],template:({variant:e="default",children:t,dot:o=!1})=>({html:`<span class="badge badge--${e}${o?" badge--dot":""}">
  ${o?"":t}
</span>`,tokens:[`component.badge.${e}.background`,`component.badge.${e}.color`],a11y:{role:"status"}})},avatar:{category:"atom",description:"User avatar",sizes:["xs","sm","md","lg","xl"],template:({src:e="",alt:t="User",size:o="md",fallback:n})=>({html:`<span class="avatar avatar--${o}">
  ${e?`<img src="${e}" alt="${t}" class="avatar__image" />`:`<span class="avatar__fallback" aria-label="${t}">${n||(t==null?void 0:t.charAt(0))||"?"}</span>`}
</span>`,tokens:[`component.avatar.${o}.size`,"component.avatar.background","component.avatar.borderRadius"],a11y:{role:"img",hasAlt:!0}})},spinner:{category:"atom",description:"Loading spinner",sizes:["sm","md","lg"],template:({size:e="md",label:t="Loading..."})=>({html:`<span class="spinner spinner--${e}" role="status" aria-label="${t}">
  <span class="spinner__circle" aria-hidden="true"></span>
  <span class="visually-hidden">${t}</span>
</span>`,tokens:[`component.spinner.${e}.size`,"component.spinner.color","motion.duration.slow"],a11y:{role:"status",essential:!0}})},tooltip:{category:"atom",description:"Tooltip/hint text",positions:["top","right","bottom","left"],template:({content:e="Tooltip text",position:t="top",id:o})=>{const n=o||`tooltip-${Date.now()}`;return{html:`<span
  class="tooltip tooltip--${t}"
  role="tooltip"
  id="${n}"
>
  ${e}
</span>`,tokens:["component.tooltip.background","component.tooltip.color","component.tooltip.borderRadius"],a11y:{role:"tooltip",triggeredBy:"aria-describedby"},usage:`<!-- Usage: add aria-describedby="${n}" to trigger element -->`}}},checkbox:{category:"atom",description:"Checkbox input",sizes:["sm","md","lg"],template:({label:e,checked:t=!1,disabled:o=!1,required:n=!1,error:a=null,id:l})=>{const r=l||`checkbox-${Date.now()}`;return{html:`<div class="form-field${a?" form-field--error":""}">
  <label class="checkbox${o?" checkbox--disabled":""}" for="${r}">
    <input
      type="checkbox"
      id="${r}"
      class="checkbox__input"
      ${t?"checked":""}
      ${o?'disabled aria-disabled="true"':""}
      ${n?'required aria-required="true"':""}
      ${a?`aria-invalid="true" aria-describedby="${r}-error"`:""}
    />
    <span class="checkbox__control" aria-hidden="true"></span>
    <span class="checkbox__label">${e}</span>
  </label>
  ${a?`<span id="${r}-error" class="form-field__error" role="alert">${a}</span>`:""}
</div>`,tokens:["component.checkbox.bg.default","component.checkbox.bg.checked","component.checkbox.border.color.default","component.checkbox.border.color.checked","component.checkbox.icon.color","component.checkbox.label.color.default"],a11y:{role:"checkbox",hasLabel:!0,focusable:!0,keyboardNav:["Space"],errorHandling:!0}}}},radio:{category:"atom",description:"Radio button input",sizes:["sm","md","lg"],template:({name:e,options:t=[],selectedValue:o=null,disabled:n=!1,error:a=null,id:l})=>{const r=l||`radio-${Date.now()}`;return{html:`<fieldset class="radio-group${a?" radio-group--error":""}" role="radiogroup" aria-labelledby="${r}-legend">
  <legend id="${r}-legend" class="radio-group__legend">${e}</legend>
  ${(t.length?t:[{label:"Option 1",value:"1"},{label:"Option 2",value:"2"}]).map((d,i)=>`
  <label class="radio${n?" radio--disabled":""}" for="${r}-${i}">
    <input
      type="radio"
      id="${r}-${i}"
      name="${r}"
      value="${d.value}"
      class="radio__input"
      ${d.value===o?"checked":""}
      ${n?'disabled aria-disabled="true"':""}
      ${a?`aria-describedby="${r}-error"`:""}
    />
    <span class="radio__control" aria-hidden="true"></span>
    <span class="radio__label">${d.label}</span>
  </label>`).join("")}
  ${a?`<span id="${r}-error" class="form-field__error" role="alert">${a}</span>`:""}
</fieldset>`,tokens:["component.radio.bg.default","component.radio.bg.checked","component.radio.border.color.default","component.radio.border.color.checked","component.radio.dot.color.default","component.radio.label.color.default","component.radio.group.gap"],a11y:{role:"radiogroup",hasLabel:!0,focusable:!0,keyboardNav:["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"],errorHandling:!0}}}},select:{category:"atom",description:"Select dropdown input",sizes:["sm","md","lg"],template:({label:e,options:t=[],placeholder:o="Select an option",required:n=!1,disabled:a=!1,error:l=null,size:r="md",id:d})=>{const i=d||`select-${Date.now()}`;return{html:`<div class="form-field${l?" form-field--error":""}">
  <label for="${i}" class="form-field__label">
    ${e}${n?'<span class="form-field__required" aria-hidden="true">*</span>':""}
  </label>
  <select
    id="${i}"
    class="select select--${r}"
    ${n?'required aria-required="true"':""}
    ${a?'disabled aria-disabled="true"':""}
    ${l?`aria-invalid="true" aria-describedby="${i}-error"`:""}
  >
    <option value="" disabled selected>${o}</option>
    ${(t.length?t:[{label:"Option 1",value:"1"}]).map(m=>`
    <option value="${m.value}">${m.label}</option>`).join("")}
  </select>
  ${l?`<span id="${i}-error" class="form-field__error" role="alert">${l}</span>`:""}
</div>`,tokens:["component.select.trigger.bg.default","component.select.trigger.border.color.default","component.select.trigger.text.default",`component.select.trigger.size.${r}.height`,"component.select.dropdown.bg","component.select.dropdown.shadow","component.select.option.bg.hover"],a11y:{role:"combobox",hasLabel:!0,focusable:!0,keyboardNav:["ArrowUp","ArrowDown","Enter","Escape"],errorHandling:!0}}}},textarea:{category:"atom",description:"Multi-line text input",template:({label:e,placeholder:t="",required:o=!1,disabled:n=!1,error:a=null,rows:l=4,maxlength:r=null,id:d})=>{const i=d||`textarea-${Date.now()}`;return{html:`<div class="form-field${a?" form-field--error":""}">
  <label for="${i}" class="form-field__label">
    ${e}${o?'<span class="form-field__required" aria-hidden="true">*</span>':""}
  </label>
  <textarea
    id="${i}"
    class="textarea"
    placeholder="${t}"
    rows="${l}"
    ${r?`maxlength="${r}" aria-describedby="${i}-count"`:""}
    ${o?'required aria-required="true"':""}
    ${n?'disabled aria-disabled="true"':""}
    ${a?`aria-invalid="true" aria-describedby="${i}-error"`:""}
  ></textarea>
  ${r?`<span id="${i}-count" class="form-field__char-count" aria-live="polite">0/${r}</span>`:""}
  ${a?`<span id="${i}-error" class="form-field__error" role="alert">${a}</span>`:""}
</div>`,tokens:["component.textarea.bg.default","component.textarea.border.color.default","component.textarea.text.default","component.textarea.padding.x","component.textarea.padding.y","component.textarea.fontSize","component.textarea.radius"],a11y:{role:"textbox",multiline:!0,hasLabel:!0,focusable:!0,errorHandling:!0}}}},toggle:{category:"atom",description:"Toggle switch input",sizes:["sm","md","lg"],template:({label:e,checked:t=!1,disabled:o=!1,size:n="md",id:a})=>{const l=a||`toggle-${Date.now()}`;return{html:`<label class="toggle toggle--${n}${o?" toggle--disabled":""}" for="${l}">
  <input
    type="checkbox"
    id="${l}"
    class="toggle__input"
    role="switch"
    aria-checked="${t}"
    ${t?"checked":""}
    ${o?'disabled aria-disabled="true"':""}
  />
  <span class="toggle__track" aria-hidden="true">
    <span class="toggle__thumb"></span>
  </span>
  <span class="toggle__label">${e}</span>
</label>`,tokens:["component.toggle.track.bg.off","component.toggle.track.bg.on",`component.toggle.track.size.${n}.width`,`component.toggle.track.size.${n}.height`,`component.toggle.thumb.size.${n}`,"component.toggle.thumb.bg.default","component.toggle.label.color.default"],a11y:{role:"switch",hasLabel:!0,focusable:!0,keyboardNav:["Space"]}}}},table:{category:"organism",description:"Data table",sizes:["compact","default","relaxed"],template:({columns:e=[],rows:t=[],caption:o="",striped:n=!1,sortable:a=!1,size:l="default"})=>{const r=`table-${Date.now()}`;return{html:`<div class="table-container" role="region" aria-labelledby="${r}-caption" tabindex="0">
  <table class="table table--${l}${n?" table--striped":""}" id="${r}">
    ${o?`<caption id="${r}-caption" class="table__caption">${o}</caption>`:""}
    <thead class="table__head">
      <tr>
        ${(e.length?e:[{label:"Column",key:"col"}]).map(d=>`
        <th scope="col" class="table__header"${a?' aria-sort="none"':""}>
          ${d.label}
          ${a?'<button type="button" class="table__sort" aria-label="Sort by '+d.label+'"><span aria-hidden="true">&#x21C5;</span></button>':""}
        </th>`).join("")}
      </tr>
    </thead>
    <tbody class="table__body">
      ${(t.length?t:[]).map(d=>`
      <tr class="table__row">
        ${(e.length?e:[{key:"col"}]).map(i=>`
        <td class="table__cell">${d[i.key]||""}</td>`).join("")}
      </tr>`).join("")}
    </tbody>
  </table>
</div>`,tokens:["component.table.bg","component.table.border.color","component.table.header.bg","component.table.header.color","component.table.cell.color","component.table.cell.borderColor","component.table.row.bg.hover",`component.table.size.${l}.cellPaddingY`],a11y:{role:"table",focusable:!0,keyboardNav:a?["Enter","Space"]:[],scrollable:!0}}}},divider:{category:"atom",description:"Visual divider/separator",variants:["default","subtle","strong"],template:({variant:e="default",orientation:t="horizontal",label:o=null})=>({html:o?`<div class="divider divider--${e} divider--${t} divider--with-label" role="separator" aria-orientation="${t}">
  <span class="divider__line" aria-hidden="true"></span>
  <span class="divider__label">${o}</span>
  <span class="divider__line" aria-hidden="true"></span>
</div>`:`<hr class="divider divider--${e} divider--${t}" role="separator" aria-orientation="${t}" />`,tokens:[`component.divider.color.${e}`,"component.divider.thickness","component.divider.spacing.md","component.divider.withLabel.color","component.divider.withLabel.fontSize"],a11y:{role:"separator",orientation:t}})},skeleton:{category:"atom",description:"Loading skeleton placeholder",variants:["text","circle","rect"],template:({variant:e="text",width:t="100%",lines:o=1,animated:n=!0})=>({html:e==="text"?`<div class="skeleton-group" aria-busy="true" aria-live="polite">
  <span class="visually-hidden">Loading content...</span>
  ${Array.from({length:o},(a,l)=>`
  <span class="skeleton skeleton--text${n?" skeleton--animated":""}" style="width: ${l===o-1&&o>1?"60%":t}" aria-hidden="true"></span>`).join("")}
</div>`:`<div aria-busy="true" aria-live="polite">
  <span class="visually-hidden">Loading content...</span>
  <span class="skeleton skeleton--${e}${n?" skeleton--animated":""}" style="width: ${t}" aria-hidden="true"></span>
</div>`,tokens:["component.skeleton.bg.base","component.skeleton.bg.shimmer",`component.skeleton.radius.${e}`,`component.skeleton.height.${e==="text"?"text":e==="circle"?"avatar":"card"}`,"component.skeleton.animation.duration"],a11y:{role:"status",live:"polite",busy:!0}})},navigation:{category:"organism",description:"Navigation bar",template:({brand:e="",items:t=[],activeIndex:o=0,id:n})=>{const a=n||`nav-${Date.now()}`;return{html:`<nav class="nav" aria-label="Main navigation" id="${a}">
  <div class="nav__container">
    ${e?`<a href="/" class="nav__brand" aria-label="Home">${e}</a>`:""}
    <button
      type="button"
      class="nav__mobile-trigger"
      aria-expanded="false"
      aria-controls="${a}-menu"
      aria-label="Toggle navigation menu"
    >
      <span class="nav__hamburger" aria-hidden="true"></span>
    </button>
    <ul class="nav__menu" id="${a}-menu" role="menubar">
      ${(t.length?t:[{label:"Home",href:"/"}]).map((l,r)=>`
      <li role="none">
        <a
          href="${l.href||"#"}"
          role="menuitem"
          class="nav__item${r===o?" nav__item--active":""}"
          ${r===o?'aria-current="page"':""}
        >
          ${l.label}
        </a>
      </li>`).join("")}
    </ul>
  </div>
</nav>`,tokens:["component.nav.bg","component.nav.height","component.nav.border.color","component.nav.item.color.default","component.nav.item.color.active","component.nav.item.bg.hover","component.nav.item.indicator.color"],a11y:{role:"navigation",landmark:!0,keyboardNav:["ArrowLeft","ArrowRight","Home","End"],mobileToggle:!0}}}},breadcrumb:{category:"molecule",description:"Breadcrumb navigation",template:({items:e=[],separator:t="/"})=>({html:`<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol class="breadcrumb__list">
    ${(e.length?e:[{label:"Home",href:"/"},{label:"Current"}]).map((o,n,a)=>`
    <li class="breadcrumb__item">
      ${n<a.length-1?`<a href="${o.href||"#"}" class="breadcrumb__link">${o.label}</a>
      <span class="breadcrumb__separator" aria-hidden="true">${t}</span>`:`<span class="breadcrumb__current" aria-current="page">${o.label}</span>`}
    </li>`).join("")}
  </ol>
</nav>`,tokens:["component.breadcrumb.fontSize","component.breadcrumb.gap","component.breadcrumb.separator.color","component.breadcrumb.item.color.default","component.breadcrumb.item.color.hover","component.breadcrumb.item.color.current"],a11y:{role:"navigation",landmark:!0,currentPage:!0}})},pagination:{category:"molecule",description:"Pagination controls",template:({totalPages:e=5,currentPage:t=1,id:o})=>({html:`<nav class="pagination" aria-label="Pagination" id="${o||`pagination-${Date.now()}`}">
  <ul class="pagination__list">
    <li>
      <button
        type="button"
        class="pagination__item pagination__prev"
        aria-label="Go to previous page"
        ${t===1?'disabled aria-disabled="true"':""}
      >
        <span aria-hidden="true">&laquo;</span>
      </button>
    </li>
    ${Array.from({length:e},(a,l)=>l+1).map(a=>`
    <li>
      <button
        type="button"
        class="pagination__item${a===t?" pagination__item--active":""}"
        aria-label="Go to page ${a}"
        ${a===t?'aria-current="page"':""}
      >
        ${a}
      </button>
    </li>`).join("")}
    <li>
      <button
        type="button"
        class="pagination__item pagination__next"
        aria-label="Go to next page"
        ${t===e?'disabled aria-disabled="true"':""}
      >
        <span aria-hidden="true">&raquo;</span>
      </button>
    </li>
  </ul>
</nav>`,tokens:["component.pagination.gap","component.pagination.item.size","component.pagination.item.radius","component.pagination.item.bg.default","component.pagination.item.bg.active","component.pagination.item.color.default","component.pagination.item.color.active"],a11y:{role:"navigation",landmark:!0,focusable:!0,keyboardNav:["ArrowLeft","ArrowRight"],currentPage:!0}})},progress:{category:"atom",description:"Progress bar",variants:["default","success","warning","danger"],sizes:["sm","md","lg"],template:({value:e=0,max:t=100,variant:o="default",size:n="md",label:a=null,showValue:l=!1})=>({html:`<div class="progress progress--${n}">
  ${a?`<div class="progress__header">
    <span class="progress__label">${a}</span>
    ${l?`<span class="progress__value" aria-hidden="true">${Math.round(e/t*100)}%</span>`:""}
  </div>`:""}
  <div
    class="progress__track"
    role="progressbar"
    aria-valuenow="${e}"
    aria-valuemin="0"
    aria-valuemax="${t}"
    aria-label="${a||"Progress"}"
  >
    <div class="progress__bar progress__bar--${o}" style="width: ${e/t*100}%"></div>
  </div>
</div>`,tokens:["component.progress.track.bg","component.progress.track.height","component.progress.track.radius",`component.progress.bar.color.${o}`,`component.progress.size.${n}`,"component.progress.label.fontSize","component.progress.label.color"],a11y:{role:"progressbar",valueRange:!0}})},stepper:{category:"molecule",description:"Step progress indicator",template:({steps:e=[],currentStep:t=0,orientation:o="horizontal"})=>{const n=`stepper-${Date.now()}`;return{html:`<nav class="stepper stepper--${o}" aria-label="Progress" id="${n}">
  <ol class="stepper__list">
    ${(e.length?e:[{label:"Step 1"},{label:"Step 2"},{label:"Step 3"}]).map((a,l)=>{const r=l<t?"completed":l===t?"active":"default";return`
    <li class="stepper__item stepper__item--${r}" aria-current="${r==="active"?"step":"false"}">
      <span class="stepper__indicator">
        ${r==="completed"?'<span aria-hidden="true">&#x2713;</span><span class="visually-hidden">Completed: </span>':`<span>${l+1}</span>`}
      </span>
      <span class="stepper__content">
        <span class="stepper__label">${a.label}</span>
        ${a.description?`<span class="stepper__description">${a.description}</span>`:""}
      </span>
      ${l<(e.length||3)-1?'<span class="stepper__connector" aria-hidden="true"></span>':""}
    </li>`}).join("")}
  </ol>
</nav>`,tokens:["component.stepper.step.bg.default","component.stepper.step.bg.active","component.stepper.step.bg.completed","component.stepper.step.color.default","component.stepper.step.color.active","component.stepper.connector.color.default","component.stepper.connector.color.completed","component.stepper.step.label.color.active","component.stepper.gap"],a11y:{role:"navigation",landmark:!0,currentStep:!0}}}},popover:{category:"molecule",description:"Popover with rich content",positions:["top","right","bottom","left"],template:({title:e="",content:t,position:o="bottom",id:n})=>{const a=n||`popover-${Date.now()}`;return{html:`<div class="popover popover--${o}" id="${a}" role="dialog" aria-labelledby="${a}-title">
  <div class="popover__arrow" aria-hidden="true"></div>
  <div class="popover__container">
    ${e?`<header class="popover__header">
      <h3 id="${a}-title" class="popover__title">${e}</h3>
      <button type="button" class="popover__close" aria-label="Close popover">
        <span aria-hidden="true">&times;</span>
      </button>
    </header>`:""}
    <div class="popover__body">
      ${t||""}
    </div>
  </div>
</div>`,tokens:["component.popover.bg","component.popover.border.color","component.popover.radius","component.popover.shadow","component.popover.padding","component.popover.header.fontSize","component.popover.body.color","component.popover.arrow.size"],a11y:{role:"dialog",focusTrap:!0,focusable:!0,keyboardNav:["Escape"],triggeredBy:"aria-controls"},usage:`<!-- Usage: add aria-controls="${a}" and aria-expanded to trigger element -->`}}},link:{category:"atom",description:"Hyperlink element",variants:["default","subtle","inverse"],template:({href:e="#",children:t="Link text",variant:o="default",external:n=!1,disabled:a=!1})=>({html:`<a
  href="${e}"
  class="link link--${o}${a?" link--disabled":""}"
  ${n?'target="_blank" rel="noopener noreferrer"':""}
  ${a?'aria-disabled="true" tabindex="-1"':""}
>
  ${t}
  ${n?'<span class="link__external-icon" aria-hidden="true">&#x2197;</span><span class="visually-hidden">(opens in new tab)</span>':""}
</a>`,tokens:["component.link.color.default","component.link.color.hover","component.link.color.visited","component.link.decoration.default","component.link.decoration.hover","component.link.fontWeight","component.link.focus.ringColor"],a11y:{role:"link",focusable:!0,externalIndicator:n}})},chip:{category:"atom",description:"Chip/tag element",variants:["filled","outlined","primary","success","danger"],sizes:["sm","md","lg"],template:({children:e="Chip",variant:t="filled",size:o="md",removable:n=!1,disabled:a=!1,icon:l=null})=>({html:`<span class="chip chip--${t} chip--${o}${a?" chip--disabled":""}"${a?' aria-disabled="true"':""}>
  ${l?`<span class="chip__icon" aria-hidden="true">${l}</span>`:""}
  <span class="chip__label">${e}</span>
  ${n?`<button type="button" class="chip__remove" aria-label="Remove ${e}"${a?" disabled":""}>
    <span aria-hidden="true">&times;</span>
  </button>`:""}
</span>`,tokens:[`component.chip.variant.${t}.bg`,`component.chip.variant.${t}.color`,`component.chip.height.${o}`,`component.chip.paddingX.${o}`,"component.chip.radius","component.chip.fontSize","component.chip.closeButton.size"],a11y:{role:"status",removable:n,focusable:n,keyboardNav:n?["Backspace","Delete"]:[]}})},rating:{category:"atom",description:"Star rating input",sizes:["sm","md","lg"],template:({value:e=0,max:t=5,readonly:o=!1,disabled:n=!1,size:a="md",label:l="Rating",id:r})=>{const d=r||`rating-${Date.now()}`;return{html:o?`<div class="rating rating--${a} rating--readonly" role="img" aria-label="${l}: ${e} out of ${t}">
  ${Array.from({length:t},(i,m)=>`
  <span class="rating__star${m<e?" rating__star--filled":""}" aria-hidden="true">&#x2605;</span>`).join("")}
</div>`:`<fieldset class="rating rating--${a}${n?" rating--disabled":""}" id="${d}">
  <legend class="visually-hidden">${l}</legend>
  ${Array.from({length:t},(i,m)=>{const s=t-m;return`
  <input
    type="radio"
    id="${d}-${s}"
    name="${d}"
    value="${s}"
    class="rating__input visually-hidden"
    ${s===e?"checked":""}
    ${n?'disabled aria-disabled="true"':""}
  />
  <label for="${d}-${s}" class="rating__star" aria-label="${s} star${s>1?"s":""}">
    <span aria-hidden="true">&#x2605;</span>
  </label>`}).join("")}
</fieldset>`,tokens:[`component.rating.size.${a}`,"component.rating.gap","component.rating.color.filled","component.rating.color.empty","component.rating.color.hover","component.rating.focus.ringColor"],a11y:{role:o?"img":"radiogroup",hasLabel:!0,focusable:!o&&!n,keyboardNav:o?[]:["ArrowLeft","ArrowRight"]}}}},"form-group":{category:"molecule",description:"Form with labeled fields",template:({fields:e=[],action:t="",method:o="post",title:n=null,id:a})=>{const l=a||`form-${Date.now()}`;return{html:`<form class="form-group" id="${l}" action="${t}" method="${o}"${n?` aria-labelledby="${l}-title"`:""}>
  ${n?`<h2 id="${l}-title" class="form-group__title">${n}</h2>`:""}
  ${(e.length?e:[{label:"Name",type:"text",name:"name",required:!0}]).map((r,d)=>{const i=`${l}-field-${d}`;return`
  <div class="form-group__field">
    <label for="${i}" class="form-group__label">
      ${r.label}${r.required?'<span class="form-group__required" aria-hidden="true">*</span>':""}
    </label>
    <input
      type="${r.type||"text"}"
      id="${i}"
      name="${r.name||r.label.toLowerCase()}"
      class="form-group__input"
      ${r.placeholder?`placeholder="${r.placeholder}"`:""}
      ${r.required?'required aria-required="true"':""}
    />
    ${r.helper?`<span class="form-group__helper" id="${i}-helper">${r.helper}</span>`:""}
  </div>`}).join("")}
  <div class="form-group__actions">
    <button type="submit" class="btn btn--primary">Submit</button>
  </div>
</form>`,tokens:["component.formField.gap","component.formField.label.fontSize","component.formField.label.fontWeight","component.formField.label.color.default","component.formField.label.required.color","component.formField.helper.fontSize","component.formField.helper.color","component.formField.error.color"],a11y:{role:"form",hasLabels:!0,focusable:!0,keyboardNav:["Tab","Enter"],errorHandling:!0}}}}};function v(e){const t={info:"ℹ️",success:"✓",warning:"⚠",danger:"✕",error:"✕"};return t[e]||t.info}function D(e){return e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}function S(e,t={}){try{const o=b[e];return o?o.template(t):{html:`<!-- unknown component: ${e} -->`}}catch(o){return{html:`<!-- error rendering ${e}: ${o.message} -->`}}}function C(e){return e.replace(/^\s*\n/gm,"").replace(/\n{3,}/g,`

`)}const A=[{key:"all",label:"All"},{key:"atom",label:"Atoms"},{key:"molecule",label:"Molecules"},{key:"organism",label:"Organisms"}],_=[{name:"button",showcases:[{label:"Variants",items:[{variant:"primary",children:"Primary"},{variant:"secondary",children:"Secondary"},{variant:"danger",children:"Danger"},{variant:"ghost",children:"Ghost"}]},{label:"Sizes",items:[{variant:"primary",size:"sm",children:"Small"},{variant:"primary",size:"md",children:"Medium"},{variant:"primary",size:"lg",children:"Large"}]},{label:"States",items:[{variant:"primary",disabled:!0,children:"Disabled"}]}]},{name:"input",showcases:[{label:"Variants",items:[{label:"Username",placeholder:"Enter username",id:"demo-input-1"},{label:"Email",type:"email",placeholder:"you@example.com",required:!0,id:"demo-input-2"},{label:"Password",type:"password",error:"This field is required",id:"demo-input-3"}]}]},{name:"badge",showcases:[{label:"Variants",items:[{variant:"default",children:"Default"},{variant:"primary",children:"Primary"},{variant:"success",children:"Success"},{variant:"warning",children:"Warning"},{variant:"danger",children:"Danger"}]},{label:"Dot",items:[{variant:"primary",dot:!0}]}]},{name:"avatar",showcases:[{label:"Sizes (fallback)",items:[{size:"xs",alt:"Alice",fallback:"A"},{size:"sm",alt:"Bob",fallback:"B"},{size:"md",alt:"Carla",fallback:"C"},{size:"lg",alt:"Dan",fallback:"D"},{size:"xl",alt:"Eve",fallback:"E"}]}]},{name:"spinner",showcases:[{label:"Sizes",items:[{size:"sm"},{size:"md"},{size:"lg"}]}]},{name:"link",showcases:[{label:"Variants",items:[{variant:"default",children:"Default Link",href:"#"},{variant:"subtle",children:"Subtle Link",href:"#"},{variant:"inverse",children:"Inverse Link",href:"#"}]},{label:"External",items:[{children:"External Link",href:"https://example.com",external:!0}]}]},{name:"chip",showcases:[{label:"Variants",items:[{variant:"filled",children:"Filled"},{variant:"outlined",children:"Outlined"},{variant:"primary",children:"Primary"},{variant:"success",children:"Success"},{variant:"danger",children:"Danger"}]},{label:"Removable",items:[{variant:"primary",children:"Removable",removable:!0}]}]},{name:"divider",showcases:[{label:"Variants",items:[{variant:"default"},{variant:"subtle"},{variant:"strong"}]},{label:"With Label",items:[{variant:"default",label:"OR"}]}]},{name:"skeleton",showcases:[{label:"Variants",items:[{variant:"text",lines:3},{variant:"circle",width:"48px"},{variant:"rect",width:"200px"}]}]},{name:"progress",showcases:[{label:"Variants",items:[{variant:"default",value:25,label:"Uploading",showValue:!0},{variant:"success",value:50,label:"Building",showValue:!0},{variant:"warning",value:75,label:"Compiling",showValue:!0},{variant:"danger",value:100,label:"Complete",showValue:!0}]},{label:"Sizes",items:[{size:"sm",value:40,label:"Small"},{size:"md",value:60,label:"Medium"},{size:"lg",value:80,label:"Large"}]}]},{name:"tooltip",showcases:[{label:"Positions",items:[{position:"top",content:"Top tooltip",id:"demo-tip-top"},{position:"right",content:"Right tooltip",id:"demo-tip-right"},{position:"bottom",content:"Bottom tooltip",id:"demo-tip-bottom"},{position:"left",content:"Left tooltip",id:"demo-tip-left"}]}]},{name:"checkbox",showcases:[{label:"States",items:[{label:"Unchecked",id:"demo-cb-1"},{label:"Checked",checked:!0,id:"demo-cb-2"},{label:"Disabled",disabled:!0,id:"demo-cb-3"}]}]},{name:"radio",showcases:[{label:"Group",items:[{name:"Favourite Color",options:[{label:"Red",value:"red"},{label:"Green",value:"green"},{label:"Blue",value:"blue"}],selectedValue:"green",id:"demo-radio"}]}]},{name:"rating",showcases:[{label:"Readonly",items:[{value:3,readonly:!0,size:"md",id:"demo-rating-ro"}]},{label:"Interactive",items:[{value:4,readonly:!1,size:"lg",id:"demo-rating-int"}]}]},{name:"toggle",showcases:[{label:"States",items:[{label:"Off",checked:!1,id:"demo-toggle-off"},{label:"On",checked:!0,id:"demo-toggle-on"},{label:"Disabled",disabled:!0,id:"demo-toggle-dis"}]}]},{name:"select",showcases:[{label:"Variants",items:[{label:"Country",options:[{label:"United States",value:"us"},{label:"United Kingdom",value:"uk"},{label:"Canada",value:"ca"}],id:"demo-select-1"},{label:"Disabled Select",disabled:!0,options:[{label:"N/A",value:""}],id:"demo-select-2"}]}]},{name:"textarea",showcases:[{label:"Variants",items:[{label:"Comments",placeholder:"Write your thoughts...",id:"demo-ta-1"},{label:"Bio",placeholder:"Tell us about yourself",maxlength:200,id:"demo-ta-2"},{label:"Feedback",error:"Please provide feedback",id:"demo-ta-3"}]}]},{name:"alert",showcases:[{label:"Variants",items:[{variant:"info",message:"This is an informational alert."},{variant:"success",title:"Success!",message:"Operation completed."},{variant:"warning",message:"Please review before proceeding."},{variant:"danger",message:"Something went wrong.",dismissible:!0}]}]},{name:"tabs",showcases:[{label:"Default",items:[{tabs:[{label:"Overview",content:"Overview panel content goes here."},{label:"Features",content:"Features panel content goes here."},{label:"Pricing",content:"Pricing panel content goes here."}],activeIndex:0}]}]},{name:"accordion",showcases:[{label:"Default",items:[{items:[{title:"What is Aioli?",content:"Aioli is an AI-native design system platform."},{title:"How does it work?",content:"It uses a rules engine with agent orchestration."},{title:"Is it accessible?",content:"Yes, WCAG 2.1 AA compliance is enforced."}]}]}]},{name:"dropdown",showcases:[{label:"Default",items:[{trigger:"Actions",items:[{label:"Edit",icon:"✎"},{label:"Duplicate"},{label:"Delete",disabled:!0}],id:"demo-dropdown"}]}]},{name:"toast",showcases:[{label:"Variants",items:[{variant:"info",message:"New update available."},{variant:"success",message:"Changes saved."},{variant:"warning",message:"Storage almost full."},{variant:"error",message:"Upload failed."}]}]},{name:"breadcrumb",showcases:[{label:"Default",items:[{items:[{label:"Home",href:"/"},{label:"Products",href:"/products"},{label:"Current Item"}]}]}]},{name:"pagination",showcases:[{label:"Default",items:[{totalPages:5,currentPage:3,id:"demo-pagination"}]}]},{name:"stepper",showcases:[{label:"Default",items:[{steps:[{label:"Account",description:"Create your account"},{label:"Profile",description:"Set up your profile"},{label:"Review",description:"Review details"},{label:"Complete",description:"All done"}],currentStep:2}]}]},{name:"popover",showcases:[{label:"Default",items:[{title:"Popover Title",content:"<p>This is rich popover content with <strong>bold text</strong>.</p>",position:"bottom",id:"demo-popover"}]}]},{name:"form-group",showcases:[{label:"Default",items:[{title:"Contact Us",fields:[{label:"Name",type:"text",name:"name",required:!0,placeholder:"Your name"},{label:"Email",type:"email",name:"email",required:!0,placeholder:"you@example.com"},{label:"Message",type:"text",name:"message",placeholder:"How can we help?"}],id:"demo-form"}]}]},{name:"card",showcases:[{label:"Variants",items:[{variant:"default",title:"Default Card",content:"Simple card content with default styling."},{variant:"elevated",title:"Elevated Card",content:"This card has an elevated shadow effect."},{variant:"outlined",title:"Outlined Card",content:"This card has a visible border outline."}]}]},{name:"modal",showcases:[{label:"Default",items:[{title:"Confirm Action",content:"<p>Are you sure you want to proceed? This action cannot be undone.</p>",actions:'<button type="button" class="btn btn--secondary btn--md"><span class="btn__text">Cancel</span></button> <button type="button" class="btn btn--primary btn--md"><span class="btn__text">Confirm</span></button>',id:"demo-modal"}]}]},{name:"table",showcases:[{label:"Default",items:[{caption:"Team Members",striped:!0,columns:[{label:"Name",key:"name"},{label:"Role",key:"role"},{label:"Status",key:"status"}],rows:[{name:"Alice Johnson",role:"Designer",status:"Active"},{name:"Bob Smith",role:"Developer",status:"Active"},{name:"Carla Lee",role:"PM",status:"On Leave"}]}]}]},{name:"navigation",showcases:[{label:"Default",items:[{brand:"Aioli",items:[{label:"Home",href:"/"},{label:"Components",href:"/components"},{label:"Tokens",href:"/tokens"},{label:"Docs",href:"/docs"}],activeIndex:1,id:"demo-nav"}]}]}];function j(){const[e,t]=u.useState(!1),[o,n]=u.useState("all"),[a,l]=u.useState({}),r=u.useCallback(()=>{t(s=>{const p=!s;return p?document.documentElement.dataset.theme="dark":delete document.documentElement.dataset.theme,p})},[]),d=u.useCallback(s=>{l(p=>({...p,[s]:!p[s]}))},[]),i=u.useMemo(()=>o==="all"?_:_.filter(s=>{const p=b[s.name];return p&&p.category===o}),[o]),m=u.useMemo(()=>{const s=Object.keys(b).length,p=i.length;return o==="all"?`${s} components`:`${p} of ${s} components`},[o,i]);return c.jsxs("div",{className:"demo-page",children:[c.jsxs("header",{className:"demo-header",children:[c.jsxs("h1",{className:"demo-header__title",children:[c.jsx("span",{role:"img","aria-label":"garlic",children:"🧄"})," ","Aioli Component Gallery"]}),c.jsxs("div",{className:"demo-header__controls",children:[c.jsx("span",{className:"demo-header__count",children:m}),c.jsx("button",{type:"button",className:"demo-header__theme-toggle",onClick:r,"aria-label":e?"Switch to light mode":"Switch to dark mode",children:e?"☀️":"🌙"})]})]}),c.jsx("nav",{className:"demo-filters","aria-label":"Filter by category",children:A.map(s=>c.jsx("button",{type:"button",className:`demo-filter-btn${o===s.key?" demo-filter-btn--active":""}`,onClick:()=>n(s.key),"aria-pressed":o===s.key,children:s.label},s.key))}),c.jsx("div",{className:"demo-grid",children:i.map(s=>{const p=b[s.name];if(!p)return null;const g=[];return c.jsxs("section",{className:"demo-section",children:[c.jsxs("div",{className:"demo-section__header",children:[c.jsx("h2",{className:"demo-section__name",children:D(s.name)}),c.jsx("span",{className:`demo-section__badge demo-section__badge--${p.category}`,children:p.category})]}),c.jsx("p",{className:"demo-section__description",children:p.description}),s.showcases.map((h,f)=>c.jsxs("div",{className:"demo-section__showcase",children:[c.jsx("span",{className:"demo-section__showcase-label",children:h.label}),c.jsx("div",{className:`demo-section__showcase-row${s.name==="modal"?" demo-modal-container":""}`,children:h.items.map((y,k)=>{const $=S(s.name,y);return g.push($.html),c.jsx("div",{className:"demo-section__showcase-item",dangerouslySetInnerHTML:{__html:$.html}},k)})})]},f)),c.jsx("button",{type:"button",className:"demo-section__code-toggle",onClick:()=>d(s.name),"aria-expanded":!!a[s.name],children:a[s.name]?"Hide Code":"Show Code"}),a[s.name]&&c.jsx("pre",{className:"demo-section__code",children:c.jsx("code",{children:C(g.join(`

`))})})]},s.name)})})]})}w.createRoot(document.getElementById("root")).render(c.jsx(x.StrictMode,{children:c.jsx(j,{})}));
