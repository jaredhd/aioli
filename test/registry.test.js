/**
 * Community Registry Tests
 *
 * Tests: validator, registry core, agent integration, SDK integration.
 * Uses temp directories for isolated filesystem operations.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(__dirname, '..', 'tokens');

// ============================================================================
// TEST HELPERS
// ============================================================================

let tmpCount = 0;

function createTmpDir() {
  const dir = resolve(tmpdir(), `aioli-registry-test-${Date.now()}-${tmpCount++}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanTmpDir(dir) {
  if (dir && existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Create a valid test component package directory.
 */
function createValidPackage(parentDir, name = 'test-widget', overrides = {}) {
  const pkgDir = resolve(parentDir, name);
  mkdirSync(pkgDir, { recursive: true });

  const manifest = {
    name,
    version: '1.0.0',
    description: `A test ${name} component`,
    category: 'molecule',
    author: 'Test Author',
    keywords: [name, 'test', 'widget'],
    nlPatterns: [name.replace(/-/g, ' ')],
    hasTokens: true,
    aioliVersion: '>=0.2.0',
    ...overrides.manifest,
  };
  writeFileSync(resolve(pkgDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const templateContent = overrides.template || `
export default {
  category: '${manifest.category}',
  description: '${manifest.description}',
  variants: ['default'],
  template: ({ variant = 'default', children = 'Content' }) => ({
    html: \`<div class="${name} ${name}--\${variant}">
  <div class="${name}__content">\${children}</div>
</div>\`,
    tokens: [
      'component.${name}.background',
      'component.${name}.padding',
    ],
    a11y: {
      role: 'region',
      focusable: false,
    },
  }),
};
`;
  writeFileSync(resolve(pkgDir, 'template.js'), templateContent);

  const css = overrides.css || `
.${name} {
  display: block;
  padding: var(--component-${name}-padding, 1rem);
  background: var(--component-${name}-background, var(--semantic-surface-primary));
}
.${name}__content {
  color: var(--semantic-text-primary);
}
`;
  writeFileSync(resolve(pkgDir, 'styles.css'), css);

  const tokens = overrides.tokens || {
    component: {
      [name]: {
        background: {
          $value: '{semantic.color.surface.primary}',
          $type: 'color',
          $description: `${name} background color`,
        },
        padding: {
          $value: '{spacing.4}',
          $type: 'dimension',
          $description: `${name} padding`,
        },
      },
    },
  };
  writeFileSync(resolve(pkgDir, 'tokens.json'), JSON.stringify(tokens, null, 2));

  return pkgDir;
}

// ============================================================================
// VALIDATOR TESTS
// ============================================================================

describe('Registry Validator', () => {
  let validateManifest, validateTemplate, validateCSS, validateTokens, validatePackageDirectory;

  beforeAll(async () => {
    const mod = await import('../registry/validator.js');
    validateManifest = mod.validateManifest;
    validateTemplate = mod.validateTemplate;
    validateCSS = mod.validateCSS;
    validateTokens = mod.validateTokens;
    validatePackageDirectory = mod.validatePackageDirectory;
  });

  // --------------------------------------------------------------------------
  // Manifest validation
  // --------------------------------------------------------------------------

  describe('validateManifest', () => {
    it('accepts a valid manifest', () => {
      const result = validateManifest({
        name: 'my-widget',
        version: '1.0.0',
        description: 'A custom widget',
        category: 'molecule',
        keywords: ['widget'],
        nlPatterns: ['my widget'],
        author: 'Test',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing name', () => {
      const result = validateManifest({ version: '1.0.0', description: 'Test', category: 'atom' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('rejects non-kebab-case name', () => {
      const result = validateManifest({ name: 'MyWidget', version: '1.0.0', description: 'Test', category: 'atom' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('kebab-case'))).toBe(true);
    });

    it('rejects name conflicting with built-in component', () => {
      const result = validateManifest({ name: 'button', version: '1.0.0', description: 'A button', category: 'atom' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('built-in'))).toBe(true);
    });

    it('rejects invalid version', () => {
      const result = validateManifest({ name: 'test-comp', version: 'abc', description: 'Test', category: 'atom' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('semver'))).toBe(true);
    });

    it('rejects invalid category', () => {
      const result = validateManifest({ name: 'test-comp', version: '1.0.0', description: 'Test', category: 'page' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('category'))).toBe(true);
    });

    it('warns on missing keywords', () => {
      const result = validateManifest({ name: 'test-comp', version: '1.0.0', description: 'Test', category: 'atom' });
      expect(result.warnings.some(w => w.includes('keywords'))).toBe(true);
    });

    it('warns on missing nlPatterns', () => {
      const result = validateManifest({ name: 'test-comp', version: '1.0.0', description: 'Test', category: 'atom', keywords: ['test'] });
      expect(result.warnings.some(w => w.includes('nlPatterns'))).toBe(true);
    });

    it('warns on missing author', () => {
      const result = validateManifest({ name: 'test-comp', version: '1.0.0', description: 'Test', category: 'atom', keywords: ['test'], nlPatterns: ['test'] });
      expect(result.warnings.some(w => w.includes('author'))).toBe(true);
    });

    it('rejects null manifest', () => {
      const result = validateManifest(null);
      expect(result.valid).toBe(false);
    });

    it('rejects name too short', () => {
      const result = validateManifest({ name: 'a', version: '1.0.0', description: 'Test', category: 'atom' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('2-50'))).toBe(true);
    });

    it('rejects description too short', () => {
      const result = validateManifest({ name: 'test-comp', version: '1.0.0', description: 'Hi', category: 'atom' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('5 characters'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Template validation
  // --------------------------------------------------------------------------

  describe('validateTemplate', () => {
    it('accepts a valid template module', () => {
      const result = validateTemplate({
        category: 'molecule',
        description: 'A test component',
        template: () => ({
          html: '<div class="test">Content</div>',
          tokens: ['component.test.background'],
          a11y: { role: 'region' },
        }),
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects null template module', () => {
      const result = validateTemplate(null);
      expect(result.valid).toBe(false);
    });

    it('rejects missing template function', () => {
      const result = validateTemplate({ category: 'atom', description: 'Test' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('template function'))).toBe(true);
    });

    it('rejects template that returns no html', () => {
      const result = validateTemplate({
        category: 'atom',
        description: 'Test',
        template: () => ({ tokens: [], a11y: {} }),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('html'))).toBe(true);
    });

    it('rejects template with script tags', () => {
      const result = validateTemplate({
        category: 'atom',
        description: 'Test',
        template: () => ({
          html: '<div><script>alert("xss")</script></div>',
          tokens: [],
          a11y: {},
        }),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('script'))).toBe(true);
    });

    it('rejects template that throws', () => {
      const result = validateTemplate({
        category: 'atom',
        description: 'Test',
        template: () => { throw new Error('broken'); },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('threw'))).toBe(true);
    });

    it('rejects template with no HTML elements', () => {
      const result = validateTemplate({
        category: 'atom',
        description: 'Test',
        template: () => ({ html: 'just plain text', tokens: [], a11y: {} }),
      });
      expect(result.valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // CSS validation
  // --------------------------------------------------------------------------

  describe('validateCSS', () => {
    it('accepts valid CSS', () => {
      const result = validateCSS('.my-comp { display: block; }');
      expect(result.valid).toBe(true);
    });

    it('rejects empty CSS', () => {
      const result = validateCSS('');
      expect(result.valid).toBe(false);
    });

    it('rejects null CSS', () => {
      const result = validateCSS(null);
      expect(result.valid).toBe(false);
    });

    it('rejects CSS without class selectors', () => {
      const result = validateCSS('div { color: red; }');
      expect(result.valid).toBe(false);
    });

    it('warns on !important', () => {
      const result = validateCSS('.my-comp { color: red !important; }');
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('!important'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Token validation
  // --------------------------------------------------------------------------

  describe('validateTokens', () => {
    it('accepts valid DTCG tokens', () => {
      const result = validateTokens({
        component: {
          'my-widget': {
            background: {
              $value: '#ffffff',
              $type: 'color',
              $description: 'Background color',
            },
          },
        },
      }, 'my-widget');
      expect(result.valid).toBe(true);
    });

    it('rejects null tokens', () => {
      const result = validateTokens(null, 'test');
      expect(result.valid).toBe(false);
    });

    it('warns on missing $type', () => {
      const result = validateTokens({
        component: {
          test: {
            size: { $value: '16px' },
          },
        },
      }, 'test');
      expect(result.warnings.some(w => w.includes('$type'))).toBe(true);
    });

    it('warns on unknown $type', () => {
      const result = validateTokens({
        component: {
          test: {
            size: { $value: '16px', $type: 'unknownType' },
          },
        },
      }, 'test');
      expect(result.warnings.some(w => w.includes('unknown $type'))).toBe(true);
    });

    it('warns on non-component namespace', () => {
      const result = validateTokens({
        global: { bg: { $value: '#fff', $type: 'color' } },
      }, 'test');
      expect(result.warnings.some(w => w.includes('outside the component namespace'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Full package directory validation
  // --------------------------------------------------------------------------

  describe('validatePackageDirectory', () => {
    let tmpDir;

    beforeEach(() => {
      tmpDir = createTmpDir();
    });

    afterEach(() => {
      cleanTmpDir(tmpDir);
    });

    it('validates a complete valid package', async () => {
      const pkgDir = createValidPackage(tmpDir, 'valid-widget');
      const result = await validatePackageDirectory(pkgDir);
      expect(result.valid).toBe(true);
      expect(result.manifest).toBeDefined();
      expect(result.manifest.name).toBe('valid-widget');
    });

    it('fails on missing manifest.json', async () => {
      const pkgDir = resolve(tmpDir, 'no-manifest');
      mkdirSync(pkgDir);
      writeFileSync(resolve(pkgDir, 'template.js'), 'export default {}');
      const result = await validatePackageDirectory(pkgDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('manifest.json'))).toBe(true);
    });

    it('fails on missing template.js', async () => {
      const pkgDir = resolve(tmpDir, 'no-template');
      mkdirSync(pkgDir);
      writeFileSync(resolve(pkgDir, 'manifest.json'), JSON.stringify({
        name: 'no-template',
        version: '1.0.0',
        description: 'A test component',
        category: 'molecule',
      }));
      writeFileSync(resolve(pkgDir, 'styles.css'), '.no-template { display: block; }');
      const result = await validatePackageDirectory(pkgDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('template.js'))).toBe(true);
    });

    it('fails on missing styles.css', async () => {
      const pkgDir = createValidPackage(tmpDir, 'no-styles');
      rmSync(resolve(pkgDir, 'styles.css'));
      const result = await validatePackageDirectory(pkgDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('styles.css'))).toBe(true);
    });

    it('fails when hasTokens: true but tokens.json missing', async () => {
      const pkgDir = createValidPackage(tmpDir, 'no-tokens');
      rmSync(resolve(pkgDir, 'tokens.json'));
      const result = await validatePackageDirectory(pkgDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('tokens.json'))).toBe(true);
    });
  });
});

// ============================================================================
// REGISTRY CORE TESTS
// ============================================================================

describe('Registry Core', () => {
  let loadRegistry, saveRegistry, installPackage, removePackage;
  let listPackages, searchPackages, getPackageInfo, regenerateCSSRollup;
  let REGISTRY_DIR, PACKAGES_DIR;

  let projectRoot;

  beforeAll(async () => {
    const mod = await import('../registry/index.js');
    loadRegistry = mod.loadRegistry;
    saveRegistry = mod.saveRegistry;
    installPackage = mod.installPackage;
    removePackage = mod.removePackage;
    listPackages = mod.listPackages;
    searchPackages = mod.searchPackages;
    getPackageInfo = mod.getPackageInfo;
    regenerateCSSRollup = mod.regenerateCSSRollup;
    REGISTRY_DIR = mod.REGISTRY_DIR;
    PACKAGES_DIR = mod.PACKAGES_DIR;
  });

  beforeEach(() => {
    projectRoot = createTmpDir();
  });

  afterEach(() => {
    cleanTmpDir(projectRoot);
  });

  // --------------------------------------------------------------------------
  // Registry manifest CRUD
  // --------------------------------------------------------------------------

  describe('loadRegistry / saveRegistry', () => {
    it('returns empty registry when no file exists', () => {
      const reg = loadRegistry(projectRoot);
      expect(reg.version).toBe(1);
      expect(reg.packages).toEqual({});
    });

    it('saves and loads a registry', () => {
      const registry = { version: 1, packages: { 'my-comp': { version: '1.0.0' } } };
      saveRegistry(projectRoot, registry);
      const loaded = loadRegistry(projectRoot);
      expect(loaded.packages['my-comp'].version).toBe('1.0.0');
    });

    it('creates .aioli directory if missing', () => {
      saveRegistry(projectRoot, { version: 1, packages: {} });
      expect(existsSync(resolve(projectRoot, REGISTRY_DIR))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Install / remove lifecycle
  // --------------------------------------------------------------------------

  describe('installPackage', () => {
    let sourceDir;

    beforeEach(() => {
      sourceDir = createTmpDir();
    });

    afterEach(() => {
      cleanTmpDir(sourceDir);
    });

    it('installs a valid package', async () => {
      const pkgDir = createValidPackage(sourceDir, 'fancy-card');
      const result = await installPackage(projectRoot, pkgDir);
      expect(result.success).toBe(true);
      expect(result.name).toBe('fancy-card');

      // Check files were copied
      const installedDir = resolve(projectRoot, PACKAGES_DIR, 'fancy-card');
      expect(existsSync(resolve(installedDir, 'manifest.json'))).toBe(true);
      expect(existsSync(resolve(installedDir, 'template.js'))).toBe(true);
      expect(existsSync(resolve(installedDir, 'styles.css'))).toBe(true);

      // Check registry was updated
      const reg = loadRegistry(projectRoot);
      expect(reg.packages['fancy-card']).toBeDefined();
      expect(reg.packages['fancy-card'].version).toBe('1.0.0');

      // Check CSS roll-up was created
      const cssRollup = resolve(projectRoot, REGISTRY_DIR, 'community-components.css');
      expect(existsSync(cssRollup)).toBe(true);
      const cssContent = readFileSync(cssRollup, 'utf-8');
      expect(cssContent).toContain('fancy-card');
    });

    it('refuses duplicate install without --force', async () => {
      const pkgDir = createValidPackage(sourceDir, 'dupe-test');
      await installPackage(projectRoot, pkgDir);
      const result = await installPackage(projectRoot, pkgDir);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('already installed'))).toBe(true);
    });

    it('allows overwrite with force option', async () => {
      const pkgDir = createValidPackage(sourceDir, 'force-test');
      await installPackage(projectRoot, pkgDir);
      const result = await installPackage(projectRoot, pkgDir, { force: true });
      expect(result.success).toBe(true);
    });

    it('returns validation errors for invalid package', async () => {
      const badDir = resolve(sourceDir, 'bad-package');
      mkdirSync(badDir);
      writeFileSync(resolve(badDir, 'manifest.json'), '{"name": "x"}');
      const result = await installPackage(projectRoot, badDir);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('removePackage', () => {
    let sourceDir;

    beforeEach(() => {
      sourceDir = createTmpDir();
    });

    afterEach(() => {
      cleanTmpDir(sourceDir);
    });

    it('removes an installed package', async () => {
      const pkgDir = createValidPackage(sourceDir, 'remove-me');
      await installPackage(projectRoot, pkgDir);

      const result = removePackage(projectRoot, 'remove-me');
      expect(result.success).toBe(true);

      // Files should be gone
      expect(existsSync(resolve(projectRoot, PACKAGES_DIR, 'remove-me'))).toBe(false);

      // Registry should be updated
      const reg = loadRegistry(projectRoot);
      expect(reg.packages['remove-me']).toBeUndefined();

      // CSS roll-up should be updated
      const cssContent = readFileSync(resolve(projectRoot, REGISTRY_DIR, 'community-components.css'), 'utf-8');
      expect(cssContent).not.toContain('remove-me');
    });

    it('returns error for non-existent package', () => {
      const result = removePackage(projectRoot, 'nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not installed');
    });
  });

  // --------------------------------------------------------------------------
  // Query operations
  // --------------------------------------------------------------------------

  describe('listPackages', () => {
    let sourceDir;

    beforeEach(() => {
      sourceDir = createTmpDir();
    });

    afterEach(() => {
      cleanTmpDir(sourceDir);
    });

    it('returns empty array when nothing installed', () => {
      const list = listPackages(projectRoot);
      expect(list).toEqual([]);
    });

    it('returns all installed packages', async () => {
      createValidPackage(sourceDir, 'pkg-a');
      createValidPackage(sourceDir, 'pkg-b');
      await installPackage(projectRoot, resolve(sourceDir, 'pkg-a'));
      await installPackage(projectRoot, resolve(sourceDir, 'pkg-b'));

      const list = listPackages(projectRoot);
      expect(list.length).toBe(2);
      expect(list.map(p => p.name).sort()).toEqual(['pkg-a', 'pkg-b']);
    });
  });

  describe('searchPackages', () => {
    let sourceDir;

    beforeEach(() => {
      sourceDir = createTmpDir();
    });

    afterEach(() => {
      cleanTmpDir(sourceDir);
    });

    it('finds by name', async () => {
      createValidPackage(sourceDir, 'search-target');
      await installPackage(projectRoot, resolve(sourceDir, 'search-target'));

      const results = searchPackages(projectRoot, 'search');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('search-target');
    });

    it('finds by description', async () => {
      createValidPackage(sourceDir, 'alpha-thing', {
        manifest: { description: 'A unique searchable description here' },
      });
      await installPackage(projectRoot, resolve(sourceDir, 'alpha-thing'));

      const results = searchPackages(projectRoot, 'unique searchable');
      expect(results.length).toBe(1);
    });

    it('finds by keyword', async () => {
      createValidPackage(sourceDir, 'keyword-test', {
        manifest: { keywords: ['special-tag', 'test'] },
      });
      await installPackage(projectRoot, resolve(sourceDir, 'keyword-test'));

      const results = searchPackages(projectRoot, 'special-tag');
      expect(results.length).toBe(1);
    });

    it('returns empty for no matches', async () => {
      createValidPackage(sourceDir, 'xyz-comp');
      await installPackage(projectRoot, resolve(sourceDir, 'xyz-comp'));

      const results = searchPackages(projectRoot, 'nonexistent-query');
      expect(results.length).toBe(0);
    });
  });

  describe('getPackageInfo', () => {
    let sourceDir;

    beforeEach(() => {
      sourceDir = createTmpDir();
    });

    afterEach(() => {
      cleanTmpDir(sourceDir);
    });

    it('returns full info for installed package', async () => {
      createValidPackage(sourceDir, 'info-test');
      await installPackage(projectRoot, resolve(sourceDir, 'info-test'));

      const info = getPackageInfo(projectRoot, 'info-test');
      expect(info).not.toBeNull();
      expect(info.manifest.name).toBe('info-test');
      expect(info.manifest.version).toBe('1.0.0');
      expect(info.files).toContain('manifest.json');
      expect(info.files).toContain('template.js');
      expect(info.files).toContain('styles.css');
      expect(info.path).toBeTruthy();
    });

    it('returns null for non-existent package', () => {
      const info = getPackageInfo(projectRoot, 'nonexistent');
      expect(info).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // CSS roll-up
  // --------------------------------------------------------------------------

  describe('regenerateCSSRollup', () => {
    let sourceDir;

    beforeEach(() => {
      sourceDir = createTmpDir();
    });

    afterEach(() => {
      cleanTmpDir(sourceDir);
    });

    it('creates a CSS roll-up with imports', async () => {
      createValidPackage(sourceDir, 'rollup-a');
      createValidPackage(sourceDir, 'rollup-b');
      await installPackage(projectRoot, resolve(sourceDir, 'rollup-a'));
      await installPackage(projectRoot, resolve(sourceDir, 'rollup-b'));

      const cssPath = resolve(projectRoot, REGISTRY_DIR, 'community-components.css');
      const content = readFileSync(cssPath, 'utf-8');
      expect(content).toContain("@import './packages/rollup-a/styles.css'");
      expect(content).toContain("@import './packages/rollup-b/styles.css'");
      expect(content).toContain('Auto-generated');
    });
  });
});

// ============================================================================
// AGENT INTEGRATION TESTS
// ============================================================================

describe('Agent Integration', () => {
  let createAgentSystem;

  beforeAll(async () => {
    const mod = await import('../agents/index.js');
    createAgentSystem = mod.createAgentSystem;
  });

  describe('Component Generator — community registration', () => {
    it('registers and generates a community component', () => {
      const agents = createAgentSystem(tokensPath);
      const templateDef = {
        category: 'molecule',
        description: 'A timeline component',
        variants: ['default'],
        template: ({ variant = 'default' }) => ({
          html: `<div class="timeline timeline--${variant}"><div class="timeline__item">Event</div></div>`,
          tokens: ['component.timeline.color'],
          a11y: { role: 'list', focusable: false },
        }),
      };

      agents.component.registerCommunityComponent('timeline', templateDef, ['timeline', 'time line']);

      // Direct generation
      const result = agents.component.handleRequest({
        action: 'generate',
        componentType: 'timeline',
      });
      expect(result.success).toBe(true);
      expect(result.data.html).toContain('timeline');
      expect(result.data.source).toBe('community');
    });

    it('NL parsing finds community component', () => {
      const agents = createAgentSystem(tokensPath);
      agents.component.registerCommunityComponent('fancy-slider', {
        category: 'molecule',
        description: 'A fancy slider',
        variants: ['default'],
        template: () => ({
          html: '<div class="fancy-slider"><input type="range" /></div>',
          tokens: ['component.fancy-slider.track'],
          a11y: { role: 'slider', focusable: true },
        }),
      }, ['fancy slider', 'range slider']);

      const result = agents.component.handleRequest({
        action: 'generateFromDescription',
        description: 'a fancy slider component',
      });
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('fancy-slider');
    });

    it('listComponents includes community components with source field', () => {
      const agents = createAgentSystem(tokensPath);
      agents.component.registerCommunityComponent('custom-badge', {
        category: 'atom',
        description: 'Custom badge',
        template: () => ({
          html: '<span class="custom-badge">New</span>',
          tokens: [],
          a11y: { role: 'status' },
        }),
      });

      const result = agents.component.handleRequest({ action: 'listComponents' });
      expect(result.success).toBe(true);

      const customBadge = result.data.find(c => c.name === 'custom-badge');
      expect(customBadge).toBeDefined();
      expect(customBadge.source).toBe('community');

      const button = result.data.find(c => c.name === 'button');
      expect(button).toBeDefined();
      expect(button.source).toBe('built-in');

      // Should have 43 built-in + 1 community = 44
      expect(result.data.length).toBe(44);
    });

    it('prevents overriding built-in components', () => {
      const agents = createAgentSystem(tokensPath);
      expect(() => {
        agents.component.registerCommunityComponent('button', {
          category: 'atom',
          description: 'Rogue button',
          template: () => ({ html: '<button>Hack</button>', tokens: [], a11y: {} }),
        });
      }).toThrow('built-in');
    });

    it('unregisters a community component', () => {
      const agents = createAgentSystem(tokensPath);
      agents.component.registerCommunityComponent('temp-comp', {
        category: 'atom',
        description: 'Temporary',
        template: () => ({ html: '<div class="temp-comp">Temp</div>', tokens: [], a11y: {} }),
      });

      // Should be registered
      let list = agents.component.handleRequest({ action: 'listComponents' });
      expect(list.data.length).toBe(44);

      // Unregister
      agents.component.unregisterCommunityComponent('temp-comp');
      list = agents.component.handleRequest({ action: 'listComponents' });
      expect(list.data.length).toBe(43);
    });

    it('listCommunityComponents action works', () => {
      const agents = createAgentSystem(tokensPath);
      agents.component.registerCommunityComponent('comm-one', {
        category: 'atom', description: 'One',
        template: () => ({ html: '<div class="comm-one">1</div>', tokens: [], a11y: {} }),
      });
      agents.component.registerCommunityComponent('comm-two', {
        category: 'molecule', description: 'Two',
        template: () => ({ html: '<div class="comm-two">2</div>', tokens: [], a11y: {} }),
      });

      const result = agents.component.handleRequest({ action: 'listCommunityComponents' });
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data.every(c => c.source === 'community')).toBe(true);
    });
  });

  describe('loadCommunityComponents (from filesystem)', () => {
    let sourceDir, projectRoot;

    beforeEach(() => {
      sourceDir = createTmpDir();
      projectRoot = createTmpDir();
    });

    afterEach(() => {
      cleanTmpDir(sourceDir);
      cleanTmpDir(projectRoot);
    });

    it('loads installed community templates into agent', async () => {
      const { installPackage } = await import('../registry/index.js');

      // Create and install a package
      createValidPackage(sourceDir, 'auto-loaded');
      await installPackage(projectRoot, resolve(sourceDir, 'auto-loaded'));

      // Create agent system and load community
      const agents = createAgentSystem(tokensPath);
      const count = await agents.loadCommunityComponents(projectRoot);
      expect(count).toBe(1);

      // The community component should now be available
      const list = agents.component.handleRequest({ action: 'listComponents' });
      const autoLoaded = list.data.find(c => c.name === 'auto-loaded');
      expect(autoLoaded).toBeDefined();
      expect(autoLoaded.source).toBe('community');
    });

    it('returns 0 when no packages installed', async () => {
      const agents = createAgentSystem(tokensPath);
      const count = await agents.loadCommunityComponents(projectRoot);
      expect(count).toBe(0);
    });
  });

  describe('Framework adapter integration', () => {
    it('community component works with React adapter', () => {
      const agents = createAgentSystem(tokensPath);
      agents.component.registerCommunityComponent('react-test-widget', {
        category: 'molecule',
        description: 'A widget for React testing',
        variants: ['default', 'outlined'],
        template: ({ variant = 'default', children = 'Content' }) => ({
          html: `<div class="react-test-widget react-test-widget--${variant}"><p class="react-test-widget__text">${children}</p></div>`,
          tokens: ['component.react-test-widget.bg'],
          a11y: { role: 'region', focusable: false },
        }),
      });

      const result = agents.component.handleRequest({
        action: 'generate',
        componentType: 'react-test-widget',
        format: 'react',
      });
      expect(result.success).toBe(true);
      expect(result.data.code).toContain('className');
      expect(result.data.framework).toBe('react');
    });

    it('community component works with Vue adapter', () => {
      const agents = createAgentSystem(tokensPath);
      agents.component.registerCommunityComponent('vue-test-widget', {
        category: 'molecule',
        description: 'A widget for Vue testing',
        template: ({ children = 'Content' }) => ({
          html: `<div class="vue-test-widget"><span>${children}</span></div>`,
          tokens: [],
          a11y: { role: 'region' },
        }),
      });

      const result = agents.component.handleRequest({
        action: 'generate',
        componentType: 'vue-test-widget',
        format: 'vue',
      });
      expect(result.success).toBe(true);
      expect(result.data.code).toContain('<template>');
      expect(result.data.framework).toBe('vue');
    });

    it('community component works with Svelte adapter', () => {
      const agents = createAgentSystem(tokensPath);
      agents.component.registerCommunityComponent('svelte-test-widget', {
        category: 'atom',
        description: 'A widget for Svelte testing',
        template: () => ({
          html: '<button class="svelte-test-widget" type="button">Click</button>',
          tokens: [],
          a11y: { role: 'button', focusable: true },
        }),
      });

      const result = agents.component.handleRequest({
        action: 'generate',
        componentType: 'svelte-test-widget',
        format: 'svelte',
      });
      expect(result.success).toBe(true);
      expect(result.data.code).toContain('svelte-test-widget');
      expect(result.data.framework).toBe('svelte');
    });
  });
});

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

describe('Backward Compatibility', () => {
  let createAgentSystem;

  beforeAll(async () => {
    const mod = await import('../agents/index.js');
    createAgentSystem = mod.createAgentSystem;
  });

  it('43 built-in components still work without community loading', () => {
    const agents = createAgentSystem(tokensPath);
    const result = agents.component.handleRequest({ action: 'listComponents' });
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(43);
    expect(result.data.every(c => c.source === 'built-in')).toBe(true);
  });

  it('existing generation still works', () => {
    const agents = createAgentSystem(tokensPath);
    const result = agents.component.handleRequest({
      action: 'generateFromDescription',
      description: 'primary button',
    });
    expect(result.success).toBe(true);
    expect(result.data.type).toBe('button');
    expect(result.data.html).toContain('btn');
  });

  it('style modifiers still work', () => {
    const agents = createAgentSystem(tokensPath);
    const result = agents.component.handleRequest({
      action: 'generateFromDescription',
      description: 'glassmorphic card with title',
    });
    expect(result.success).toBe(true);
    expect(result.data.html).toBeTruthy();
  });

  it('page compositions still work', () => {
    const agents = createAgentSystem(tokensPath);
    const result = agents.component.handleRequest({
      action: 'generatePageComposition',
      description: 'marketing landing page',
    });
    expect(result.success).toBe(true);
    expect(result.data.sectionCount).toBeGreaterThan(0);
  });

  it('COMPONENT_TEMPLATES static export is unchanged', async () => {
    const { COMPONENT_TEMPLATES } = await import('../agents/component-generator-agent.js');
    expect(Object.keys(COMPONENT_TEMPLATES).length).toBe(43);
    expect(COMPONENT_TEMPLATES.button).toBeDefined();
    expect(COMPONENT_TEMPLATES.card).toBeDefined();
  });
});
