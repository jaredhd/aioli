/**
 * Aioli Community Registry — Core Module
 *
 * Manages community component packages: install, remove, list, search.
 * Pure filesystem operations, no external dependencies.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';
import { pathToFileURL } from 'url';
import { validatePackageDirectory } from './validator.js';

// ============================================================================
// CONSTANTS
// ============================================================================

export const REGISTRY_DIR = '.aioli';
export const PACKAGES_DIR = '.aioli/packages';
const REGISTRY_FILE = 'registry.json';
const CSS_ROLLUP_FILE = 'community-components.css';

// ============================================================================
// REGISTRY MANIFEST OPERATIONS
// ============================================================================

/**
 * Load the registry manifest from disk.
 * Returns an empty registry if the file doesn't exist.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {{ version: number, packages: Object }}
 */
export function loadRegistry(projectRoot) {
  const filePath = resolve(projectRoot, REGISTRY_DIR, REGISTRY_FILE);
  if (!existsSync(filePath)) {
    return { version: 1, packages: {} };
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return { version: 1, packages: {} };
  }
}

/**
 * Save the registry manifest to disk.
 * Creates the .aioli directory if it doesn't exist.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {Object} registry - Registry object to save
 */
export function saveRegistry(projectRoot, registry) {
  const dirPath = resolve(projectRoot, REGISTRY_DIR);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  const filePath = resolve(dirPath, REGISTRY_FILE);
  writeFileSync(filePath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
}

// ============================================================================
// PACKAGE INSTALL / REMOVE
// ============================================================================

/**
 * Install a community component package from a source directory.
 * Validates, copies files, updates registry manifest, and regenerates CSS.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {string} sourcePath - Absolute path to the package source directory
 * @param {Object} options - Install options
 * @param {boolean} options.force - Overwrite if already installed
 * @returns {Promise<{ success: boolean, name?: string, errors?: string[], warnings?: string[] }>}
 */
export async function installPackage(projectRoot, sourcePath, options = {}) {
  // Validate the package
  const validation = await validatePackageDirectory(sourcePath);

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const manifest = validation.manifest;
  const name = manifest.name;

  // Check if already installed
  const registry = loadRegistry(projectRoot);
  if (registry.packages[name] && !options.force) {
    return {
      success: false,
      errors: [`Package "${name}" is already installed. Use --force to overwrite.`],
      warnings: validation.warnings,
    };
  }

  // Create packages directory
  const packagesDir = resolve(projectRoot, PACKAGES_DIR);
  if (!existsSync(packagesDir)) {
    mkdirSync(packagesDir, { recursive: true });
  }

  // Copy package files to registry
  const destDir = resolve(packagesDir, name);
  if (existsSync(destDir)) {
    rmSync(destDir, { recursive: true, force: true });
  }
  cpSync(sourcePath, destDir, { recursive: true });

  // Update registry manifest
  registry.packages[name] = {
    version: manifest.version,
    description: manifest.description,
    category: manifest.category,
    author: manifest.author || null,
    installedAt: new Date().toISOString(),
    source: sourcePath,
  };
  saveRegistry(projectRoot, registry);

  // Regenerate CSS roll-up
  regenerateCSSRollup(projectRoot);

  return {
    success: true,
    name,
    warnings: validation.warnings,
  };
}

/**
 * Remove an installed community component package.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {string} packageName - Name of the package to remove
 * @returns {{ success: boolean, error?: string }}
 */
export function removePackage(projectRoot, packageName) {
  const registry = loadRegistry(projectRoot);

  if (!registry.packages[packageName]) {
    return { success: false, error: `Package "${packageName}" is not installed` };
  }

  // Remove package directory
  const packageDir = resolve(projectRoot, PACKAGES_DIR, packageName);
  if (existsSync(packageDir)) {
    rmSync(packageDir, { recursive: true, force: true });
  }

  // Update registry
  delete registry.packages[packageName];
  saveRegistry(projectRoot, registry);

  // Regenerate CSS roll-up
  regenerateCSSRollup(projectRoot);

  return { success: true };
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * List all installed community component packages.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {{ name: string, version: string, description: string, category: string }[]}
 */
export function listPackages(projectRoot) {
  const registry = loadRegistry(projectRoot);
  return Object.entries(registry.packages).map(([name, pkg]) => ({
    name,
    version: pkg.version,
    description: pkg.description,
    category: pkg.category,
    author: pkg.author,
    installedAt: pkg.installedAt,
  }));
}

/**
 * Search installed packages by query string.
 * Matches against name, description, and keywords.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {string} query - Search query (case-insensitive substring)
 * @returns {{ name: string, version: string, description: string, category: string }[]}
 */
export function searchPackages(projectRoot, query) {
  const all = listPackages(projectRoot);
  const q = query.toLowerCase();

  return all.filter(pkg => {
    if (pkg.name.includes(q)) return true;
    if (pkg.description && pkg.description.toLowerCase().includes(q)) return true;

    // Also check manifest keywords
    const manifestPath = resolve(projectRoot, PACKAGES_DIR, pkg.name, 'manifest.json');
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        if (manifest.keywords && manifest.keywords.some(k => k.toLowerCase().includes(q))) {
          return true;
        }
      } catch {
        // Skip if unreadable
      }
    }

    return false;
  });
}

/**
 * Get full details about an installed package.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {string} packageName - Package name
 * @returns {{ manifest: Object, files: string[], path: string } | null}
 */
export function getPackageInfo(projectRoot, packageName) {
  const registry = loadRegistry(projectRoot);
  if (!registry.packages[packageName]) return null;

  const packageDir = resolve(projectRoot, PACKAGES_DIR, packageName);
  if (!existsSync(packageDir)) return null;

  // Read the full manifest
  const manifestPath = resolve(packageDir, 'manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    manifest = registry.packages[packageName];
  }

  // List files in the package
  const files = existsSync(packageDir) ? readdirSync(packageDir) : [];

  return {
    manifest: { ...manifest, ...registry.packages[packageName] },
    files,
    path: packageDir,
  };
}

// ============================================================================
// COMMUNITY TEMPLATE LOADING
// ============================================================================

/**
 * Load all installed community component templates.
 * Dynamically imports each template.js module.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Map<string, { templateDef: Object, manifest: Object }>>}
 */
export async function loadCommunityTemplates(projectRoot) {
  const templates = new Map();
  const registry = loadRegistry(projectRoot);

  for (const [name, pkg] of Object.entries(registry.packages)) {
    const packageDir = resolve(projectRoot, PACKAGES_DIR, name);
    const templatePath = resolve(packageDir, 'template.js');
    const manifestPath = resolve(packageDir, 'manifest.json');

    if (!existsSync(templatePath) || !existsSync(manifestPath)) continue;

    try {
      const templateUrl = pathToFileURL(templatePath).href;
      const mod = await import(templateUrl);
      const templateDef = mod.default;
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      if (templateDef && typeof templateDef.template === 'function') {
        templates.set(name, { templateDef, manifest });
      }
    } catch (err) {
      // Silently skip broken packages during loading
      // (they passed validation at install time, but may have been corrupted)
      console.warn(`Warning: Could not load community component "${name}": ${err.message}`);
    }
  }

  return templates;
}

// ============================================================================
// CSS ROLL-UP
// ============================================================================

/**
 * Regenerate the community-components.css roll-up file.
 * Creates @import rules for each installed package's styles.css.
 *
 * @param {string} projectRoot - Absolute path to project root
 */
export function regenerateCSSRollup(projectRoot) {
  const registry = loadRegistry(projectRoot);
  const names = Object.keys(registry.packages).sort();

  const lines = [
    '/* Auto-generated by Aioli Community Registry — do not edit manually */',
    '',
  ];

  for (const name of names) {
    const cssPath = resolve(projectRoot, PACKAGES_DIR, name, 'styles.css');
    if (existsSync(cssPath)) {
      lines.push(`@import './packages/${name}/styles.css';`);
    }
  }

  lines.push('');

  const rollupPath = resolve(projectRoot, REGISTRY_DIR, CSS_ROLLUP_FILE);
  writeFileSync(rollupPath, lines.join('\n'), 'utf-8');
}
