/**
 * 🧩 AI-Powered Component Generator
 * 
 * Uses Claude API to generate components from natural language,
 * applying design tokens and ensuring accessibility.
 */

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert frontend developer for the Aioli Design System. Generate accessible, semantic HTML components that pass WCAG AA validation.

## Available CSS Variables (Design Tokens)

### Colors
--color-primary: #3b82f6
--color-secondary: #64748b  
--color-success: #22c55e
--color-danger: #ef4444
--color-warning: #f59e0b
--color-background: #ffffff
--color-surface: #f8fafc
--color-text: #0f172a
--color-text-muted: #64748b
--color-border: #e2e8f0

### Spacing
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px

### Typography
--font-family: 'Inter', sans-serif
--font-size-sm: 0.875rem
--font-size-base: 1rem
--font-size-lg: 1.125rem
--font-size-xl: 1.25rem
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-bold: 600

### Border Radius
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-full: 9999px

### Shadows
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)

## CRITICAL ACCESSIBILITY RULES

1. **Images**: ALWAYS include alt="" attribute (use descriptive text or empty for decorative)
2. **Buttons**: Use <button> with descriptive text or aria-label
3. **Links**: Use <a href="#"> with meaningful text
4. **Iframes/Embeds**: ALWAYS include title="Description" attribute
5. **Forms**: Every input needs a <label> with matching for/id
6. **Headings**: Use proper hierarchy (h1 > h2 > h3)
7. **Interactive elements**: Must be keyboard accessible
8. **Color contrast**: Text must have 4.5:1 ratio against background

## IFRAME REQUIREMENTS (Maps, Videos, Embeds)
When embedding content like Google Maps, YouTube, etc:
- ALWAYS add title="..." attribute describing the content
- Example: <iframe src="..." title="Google Map showing office location"></iframe>
- Include width and height attributes
- Add loading="lazy" for performance

## Output Rules
- Use semantic HTML elements (article, section, header, nav, button)
- Use CSS variables for ALL styling via inline style attribute
- Return ONLY valid HTML - no markdown, no code blocks, no explanations
- Every image needs alt, every iframe needs title, every input needs label`;



// ============================================================================
// AI COMPONENT GENERATOR
// ============================================================================

export class AIComponentGenerator {
  constructor(options = {}) {
    this.apiKey = options.apiKey || null;
    this.tokenAgent = options.tokenAgent || null;
    this.a11yAgent = options.a11yAgent || null;
    this.motionAgent = options.motionAgent || null;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Generate component from natural language - with validation loop
   */
  async generate(description, options = {}) {
    const maxAttempts = options.maxAttempts || 3;
    
    console.log(`\n🧩 Generating component: "${description}"`);
    console.log(`   API Key: ${this.apiKey ? 'Set (' + this.apiKey.slice(0, 10) + '...)' : 'NOT SET'}`);
    console.log(`   A11y Agent: ${this.a11yAgent ? 'Connected' : 'NOT CONNECTED'}`);
    
    // If no API key, use templates (already validated)
    if (!this.apiKey) {
      console.log('   ⚠️ No API key - using template fallback');
      return this.generateFromTemplate(description);
    }

    let lastResult = null;
    let lastIssues = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\n   🔄 Attempt ${attempt}/${maxAttempts}...`);
      
      try {
        // Build prompt - include previous issues if this is a retry
        const tokenContext = this.buildTokenContext();
        const issueContext = lastIssues.length > 0 
          ? `\n\nPREVIOUS ATTEMPT HAD THESE ACCESSIBILITY ISSUES - FIX THEM:\n${lastIssues.map(i => `- ${i.message}`).join('\n')}`
          : '';
        
        console.log(`   📤 Calling Claude API...`);
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: SYSTEM_PROMPT + tokenContext,
            messages: [{
              role: 'user',
              content: `Generate an accessible HTML component for: "${description}"

Use CSS variables for all styling. Ensure WCAG AA compliance.
Return ONLY the HTML, no explanations.${issueContext}`
            }],
          }),
        });

        console.log(`   📥 Response status: ${response.status}`);

        if (!response.ok) {
          const error = await response.json();
          console.log(`   ❌ API Error:`, error);
          throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        let html = data.content[0]?.text?.trim() || '';
        
        // Clean up any markdown if present
        html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();
        
        console.log(`   ✅ Generated ${html.length} chars of HTML`);

        // Validate with a11y agent
        let validation = { issues: [], passed: true };
        if (this.a11yAgent && html) {
          try {
            console.log(`   🔍 Validating with A11y Agent...`);
            validation = this.a11yAgent.validateHTML(html);
            const errors = (validation.issues || []).filter(i => i.severity === 'error');
            
            console.log(`   📊 Validation: ${errors.length} errors, ${(validation.issues || []).length - errors.length} warnings`);
            
            if (errors.length === 0) {
              // Passed! Return the result
              console.log(`   ✅ PASSED validation on attempt ${attempt}!`);
              return {
                type: 'ai-generated',
                description,
                html,
                validation,
                source: 'claude-api',
                model: 'claude-sonnet-4-20250514',
                attempts: attempt,
                passed: true,
              };
            }
            
            // Has errors - save for retry
            lastIssues = errors;
            lastResult = html;
            console.log(`   ⚠️ ${errors.length} a11y errors found:`);
            errors.forEach(e => console.log(`      - ${e.message}`));
            
          } catch (e) {
            console.warn(`   ⚠️ Validation error:`, e.message);
            // If validation itself fails, return the result anyway
            return {
              type: 'ai-generated',
              description,
              html,
              source: 'claude-api',
              validationError: e.message,
            };
          }
        } else {
          // No a11y agent, return as-is
          console.log(`   ⚠️ No A11y agent, returning without validation`);
          return {
            type: 'ai-generated',
            description,
            html,
            source: 'claude-api',
          };
        }

      } catch (error) {
        console.error(`   ❌ Attempt ${attempt} failed:`, error.message);
        if (attempt === maxAttempts) {
          // All attempts failed, return template fallback
          console.log(`   📋 Falling back to template`);
          const fallback = this.generateFromTemplate(description);
          return {
            ...fallback,
            aiError: error.message,
            note: 'AI generation failed after ' + maxAttempts + ' attempts, using template fallback',
          };
        }
      }
    }

    // Max attempts reached with validation issues
    console.log(`   ⚠️ Max attempts reached, returning with ${lastIssues.length} issues`);
    return {
      type: 'ai-generated',
      description,
      html: lastResult,
      source: 'claude-api',
      validation: { issues: lastIssues, passed: false },
      attempts: maxAttempts,
      passed: false,
      note: `Could not generate fully compliant component after ${maxAttempts} attempts. ${lastIssues.length} issues remain.`,
    };
  }

  /**
   * Build context from current token values
   */
  buildTokenContext() {
    if (!this.tokenAgent) return '';

    try {
      const colors = this.tokenAgent.getTokensByPrefix('semantic.color');
      const spacing = this.tokenAgent.getTokensByPrefix('primitive.spacing');
      
      if (!colors.length && !spacing.length) return '';

      let context = '\n\n## Current Token Values (use these):\n';
      
      colors.slice(0, 10).forEach(t => {
        const name = t.path.replace(/\./g, '-');
        context += `--${name}: ${t.resolvedValue || t.value}\n`;
      });

      return context;
    } catch (e) {
      return '';
    }
  }

  /**
   * Template-based fallback
   */
  generateFromTemplate(description) {
    const desc = description.toLowerCase();
    
    // Detect type
    let type = 'card';
    if (desc.includes('button')) type = 'button';
    else if (desc.includes('alert')) type = 'alert';
    else if (desc.includes('modal') || desc.includes('dialog')) type = 'modal';
    else if (desc.includes('input') || desc.includes('field')) type = 'input';
    else if (desc.includes('badge')) type = 'badge';
    else if (desc.includes('nav')) type = 'nav';

    // Detect variant
    let variant = 'primary';
    if (desc.includes('secondary')) variant = 'secondary';
    else if (desc.includes('danger') || desc.includes('error')) variant = 'danger';
    else if (desc.includes('success')) variant = 'success';
    else if (desc.includes('warning')) variant = 'warning';

    // Detect size
    let size = 'md';
    if (desc.includes('small') || desc.includes('sm')) size = 'sm';
    else if (desc.includes('large') || desc.includes('lg')) size = 'lg';

    const templates = {
      button: `<button 
  type="button"
  style="
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-${size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}) var(--spacing-${size === 'sm' ? 'sm' : size === 'lg' ? 'xl' : 'lg'});
    background: var(--color-${variant});
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-family: var(--font-family);
    font-size: var(--font-size-${size === 'sm' ? 'sm' : 'base'});
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: opacity 150ms ease;
  "
>
  ${desc.includes('icon') ? '<span aria-hidden="true">★</span>' : ''}
  ${variant.charAt(0).toUpperCase() + variant.slice(1)} Button
</button>`,

      card: `<article
  style="
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
  "
>
  ${desc.includes('image') || desc.includes('map') ? `<div style="height: 200px; background: var(--color-border); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);">
    [${desc.includes('map') ? 'Map' : 'Image'} Placeholder]
  </div>` : ''}
  <div style="padding: var(--spacing-lg);">
    <h3 style="margin: 0 0 var(--spacing-sm); font-family: var(--font-family); font-weight: var(--font-weight-bold); color: var(--color-text);">
      Card Title
    </h3>
    <p style="margin: 0; font-family: var(--font-family); color: var(--color-text-muted); line-height: 1.5;">
      Card content based on: "${description}"
    </p>
  </div>
  ${desc.includes('action') || desc.includes('button') ? `<div style="padding: var(--spacing-md) var(--spacing-lg); border-top: 1px solid var(--color-border); display: flex; gap: var(--spacing-sm);">
    <button type="button" style="padding: var(--spacing-sm) var(--spacing-md); background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">Action</button>
  </div>` : ''}
</article>`,

      alert: `<div
  role="alert"
  style="
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-surface);
    border: 1px solid var(--color-${variant});
    border-left-width: 4px;
    border-radius: var(--radius-md);
  "
>
  <span aria-hidden="true" style="font-size: 1.25rem;">
    ${variant === 'success' ? '✓' : variant === 'danger' ? '✕' : variant === 'warning' ? '⚠' : 'ℹ'}
  </span>
  <div style="flex: 1;">
    <strong style="display: block; font-family: var(--font-family); font-weight: var(--font-weight-bold); color: var(--color-text);">
      ${variant.charAt(0).toUpperCase() + variant.slice(1)} Alert
    </strong>
    <p style="margin: var(--spacing-xs) 0 0; font-family: var(--font-family); color: var(--color-text-muted);">
      Alert message content goes here.
    </p>
  </div>
  ${desc.includes('dismiss') || desc.includes('close') ? `<button type="button" aria-label="Dismiss" style="background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--color-text-muted);">×</button>` : ''}
</div>`,

      input: `<div style="display: flex; flex-direction: column; gap: var(--spacing-xs);">
  <label 
    for="input-field"
    style="font-family: var(--font-family); font-weight: var(--font-weight-medium); color: var(--color-text);"
  >
    Label ${desc.includes('required') ? '<span style="color: var(--color-danger);">*</span>' : ''}
  </label>
  <input
    type="${desc.includes('email') ? 'email' : desc.includes('password') ? 'password' : 'text'}"
    id="input-field"
    placeholder="Enter text..."
    ${desc.includes('required') ? 'required' : ''}
    style="
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-family);
      font-size: var(--font-size-base);
    "
  />
</div>`,

      badge: `<span
  style="
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-${variant});
    color: white;
    font-family: var(--font-family);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-full);
  "
>
  ${variant.charAt(0).toUpperCase() + variant.slice(1)}
</span>`,

      modal: `<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  style="
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.5);
    padding: var(--spacing-lg);
  "
>
  <div style="
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow: auto;
  ">
    <header style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg); border-bottom: 1px solid var(--color-border);">
      <h2 id="modal-title" style="margin: 0; font-family: var(--font-family); font-weight: var(--font-weight-bold);">Modal Title</h2>
      <button type="button" aria-label="Close modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-muted);">×</button>
    </header>
    <div style="padding: var(--spacing-lg); font-family: var(--font-family); color: var(--color-text);">
      <p style="margin: 0;">Modal content goes here.</p>
    </div>
    <footer style="display: flex; justify-content: flex-end; gap: var(--spacing-sm); padding: var(--spacing-lg); border-top: 1px solid var(--color-border);">
      <button type="button" style="padding: var(--spacing-sm) var(--spacing-lg); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer;">Cancel</button>
      <button type="button" style="padding: var(--spacing-sm) var(--spacing-lg); background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">Confirm</button>
    </footer>
  </div>
</div>`,

      nav: `<nav aria-label="Main navigation" style="
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  ">
  <a href="#" style="font-family: var(--font-family); font-weight: var(--font-weight-bold); font-size: var(--font-size-lg); color: var(--color-text); text-decoration: none;">
    Logo
  </a>
  <ul style="display: flex; gap: var(--spacing-lg); list-style: none; margin: 0; padding: 0;">
    <li><a href="#" style="font-family: var(--font-family); color: var(--color-text); text-decoration: none;">Home</a></li>
    <li><a href="#" style="font-family: var(--font-family); color: var(--color-text-muted); text-decoration: none;">About</a></li>
    <li><a href="#" style="font-family: var(--font-family); color: var(--color-text-muted); text-decoration: none;">Contact</a></li>
  </ul>
</nav>`,
    };

    return {
      type,
      variant,
      size,
      description,
      html: templates[type] || templates.card,
      source: 'template',
      note: 'Set ANTHROPIC_API_KEY for AI-powered generation of complex components',
    };
  }

  /**
   * Fix accessibility issues in a generated component
   * @param {string} html - Current HTML
   * @param {Array} issues - A11y issues to fix
   * @returns {Object} Fixed component
   */
  async fixComponent(html, issues) {
    console.log(`\n🔧 Fixing component with ${issues.length} issues...`);
    
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key required for AI-powered fixes',
        html,
      };
    }

    if (!issues || issues.length === 0) {
      return {
        success: true,
        html,
        note: 'No issues to fix',
      };
    }

    const issueList = issues.map(i => `- ${i.message}${i.context?.suggestion ? ` (Suggestion: ${i.context.suggestion})` : ''}`).join('\n');

    try {
      console.log(`   📤 Sending to Claude for fixes...`);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `You are an accessibility expert. Fix the HTML to resolve the listed issues while preserving the original design intent. Return ONLY the fixed HTML, no explanations.`,
          messages: [{
            role: 'user',
            content: `Fix these accessibility issues in the HTML:

ISSUES TO FIX:
${issueList}

CURRENT HTML:
${html}

Return ONLY the fixed HTML.`
          }],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      let fixedHtml = data.content[0]?.text?.trim() || '';
      
      // Clean up markdown if present
      fixedHtml = fixedHtml.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();

      console.log(`   ✅ Got fixed HTML (${fixedHtml.length} chars)`);

      // Re-validate
      let validation = { issues: [], passed: true };
      if (this.a11yAgent) {
        console.log(`   🔍 Re-validating...`);
        validation = this.a11yAgent.validateHTML(fixedHtml);
        const errors = (validation.issues || []).filter(i => i.severity === 'error');
        console.log(`   📊 After fix: ${errors.length} errors, ${(validation.issues || []).length - errors.length} warnings`);
        validation.passed = errors.length === 0;
      }

      return {
        success: true,
        html: fixedHtml,
        validation,
        issuesFixed: issues.length,
        remainingIssues: validation.issues?.filter(i => i.severity === 'error').length || 0,
      };

    } catch (error) {
      console.error(`   ❌ Fix failed:`, error.message);
      return {
        success: false,
        error: error.message,
        html,
      };
    }
  }

  /**
   * List capabilities
   */
  getCapabilities() {
    return {
      aiEnabled: !!this.apiKey,
      templateTypes: ['button', 'card', 'alert', 'input', 'badge', 'modal', 'nav'],
      features: this.apiKey 
        ? ['Natural language understanding', 'Custom component generation', 'Design token application', 'Accessibility validation']
        : ['Template-based generation', 'Basic component types', 'Design token application'],
    };
  }
}

/**
 * Factory function
 */
export function createAIComponentGenerator(options = {}) {
  return new AIComponentGenerator(options);
}

export default AIComponentGenerator;
