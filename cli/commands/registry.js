/**
 * aioli registry - Manage community component packages
 *
 * Subcommands:
 *   publish <path>   — Validate and install a component package
 *   install <source> — Install from a local path
 *   remove <name>    — Uninstall a community component
 *   list             — List all installed community components
 *   search <query>   — Search by name/description/keywords
 *   info <name>      — Show full details about a package
 *   init <name>      — Scaffold a new component package directory
 */

import { resolve, basename } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import {
  installPackage,
  removePackage,
  listPackages,
  searchPackages,
  getPackageInfo,
} from '../../registry/index.js';
import { validatePackageDirectory } from '../../registry/validator.js';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
  magenta: '\x1b[35m',
};

export function registerRegistryCommand(program) {
  const registry = program
    .command('registry')
    .description('Manage community component packages');

  // ========================================================================
  // publish
  // ========================================================================
  registry
    .command('publish <path>')
    .description('Validate and publish a component package to the local registry')
    .option('--force', 'Overwrite if already installed')
    .action(async (sourcePath, options) => {
      const absPath = resolve(process.cwd(), sourcePath);

      if (!existsSync(absPath)) {
        console.log(`${c.red}Error: Directory not found: ${absPath}${c.reset}`);
        process.exit(1);
      }

      console.log(`${c.cyan}${c.bold}Aioli${c.reset} ${c.dim}Validating package...${c.reset}\n`);

      const projectRoot = process.cwd();
      const result = await installPackage(projectRoot, absPath, { force: options.force });

      if (result.warnings && result.warnings.length > 0) {
        for (const warn of result.warnings) {
          console.log(`  ${c.yellow}⚠ ${warn}${c.reset}`);
        }
        console.log('');
      }

      if (!result.success) {
        console.log(`${c.red}${c.bold}Validation failed:${c.reset}`);
        for (const err of result.errors) {
          console.log(`  ${c.red}✗ ${err}${c.reset}`);
        }
        process.exit(1);
      }

      console.log(`${c.green}✓ Published "${result.name}" to local registry${c.reset}`);
    });

  // ========================================================================
  // install
  // ========================================================================
  registry
    .command('install <source>')
    .description('Install a community component package from a local path')
    .option('--force', 'Overwrite if already installed')
    .action(async (source, options) => {
      const absPath = resolve(process.cwd(), source);

      if (!existsSync(absPath)) {
        console.log(`${c.red}Error: Source not found: ${absPath}${c.reset}`);
        process.exit(1);
      }

      console.log(`${c.cyan}${c.bold}Aioli${c.reset} ${c.dim}Installing package...${c.reset}\n`);

      const projectRoot = process.cwd();
      const result = await installPackage(projectRoot, absPath, { force: options.force });

      if (result.warnings && result.warnings.length > 0) {
        for (const warn of result.warnings) {
          console.log(`  ${c.yellow}⚠ ${warn}${c.reset}`);
        }
        console.log('');
      }

      if (!result.success) {
        console.log(`${c.red}${c.bold}Installation failed:${c.reset}`);
        for (const err of result.errors) {
          console.log(`  ${c.red}✗ ${err}${c.reset}`);
        }
        process.exit(1);
      }

      console.log(`${c.green}✓ Installed "${result.name}"${c.reset}`);
    });

  // ========================================================================
  // remove
  // ========================================================================
  registry
    .command('remove <name>')
    .description('Remove an installed community component')
    .action(async (name) => {
      const projectRoot = process.cwd();
      const result = removePackage(projectRoot, name);

      if (!result.success) {
        console.log(`${c.red}Error: ${result.error}${c.reset}`);
        process.exit(1);
      }

      console.log(`${c.green}✓ Removed "${name}" from registry${c.reset}`);
    });

  // ========================================================================
  // list
  // ========================================================================
  registry
    .command('list')
    .description('List all installed community components')
    .action(async () => {
      const projectRoot = process.cwd();
      const packages = listPackages(projectRoot);

      if (packages.length === 0) {
        console.log(`${c.dim}No community components installed.${c.reset}`);
        console.log(`${c.dim}Use "aioli registry install <path>" to add one.${c.reset}`);
        return;
      }

      console.log(`${c.cyan}${c.bold}Community Components${c.reset} (${packages.length} installed)\n`);
      console.log(`  ${c.bold}Name                Category    Version   Description${c.reset}`);
      console.log(`  ${'─'.repeat(65)}`);

      for (const pkg of packages) {
        const name = pkg.name.padEnd(20);
        const cat = (pkg.category || '').padEnd(12);
        const ver = (pkg.version || '').padEnd(10);
        console.log(`  ${c.green}${name}${c.reset}${c.dim}${cat}${ver}${c.reset}${pkg.description || ''}`);
      }
      console.log('');
    });

  // ========================================================================
  // search
  // ========================================================================
  registry
    .command('search <query>')
    .description('Search installed packages by name, description, or keywords')
    .action(async (query) => {
      const projectRoot = process.cwd();
      const results = searchPackages(projectRoot, query);

      if (results.length === 0) {
        console.log(`${c.dim}No packages matching "${query}"${c.reset}`);
        return;
      }

      console.log(`${c.cyan}${c.bold}Search results for "${query}"${c.reset} (${results.length} found)\n`);
      for (const pkg of results) {
        console.log(`  ${c.green}${pkg.name}${c.reset} ${c.dim}v${pkg.version} [${pkg.category}]${c.reset}`);
        console.log(`  ${pkg.description || ''}\n`);
      }
    });

  // ========================================================================
  // info
  // ========================================================================
  registry
    .command('info <name>')
    .description('Show details about an installed package')
    .action(async (name) => {
      const projectRoot = process.cwd();
      const info = getPackageInfo(projectRoot, name);

      if (!info) {
        console.log(`${c.red}Package "${name}" not found${c.reset}`);
        process.exit(1);
      }

      console.log(`${c.cyan}${c.bold}${info.manifest.name}${c.reset} v${info.manifest.version}\n`);
      console.log(`  ${c.bold}Description:${c.reset}  ${info.manifest.description || '—'}`);
      console.log(`  ${c.bold}Category:${c.reset}     ${info.manifest.category || '—'}`);
      console.log(`  ${c.bold}Author:${c.reset}       ${info.manifest.author || '—'}`);
      console.log(`  ${c.bold}Keywords:${c.reset}     ${(info.manifest.keywords || []).join(', ') || '—'}`);
      console.log(`  ${c.bold}NL Patterns:${c.reset}  ${(info.manifest.nlPatterns || []).join(', ') || '—'}`);
      console.log(`  ${c.bold}Files:${c.reset}        ${info.files.join(', ')}`);
      console.log(`  ${c.bold}Path:${c.reset}         ${info.path}`);
      if (info.manifest.installedAt) {
        console.log(`  ${c.bold}Installed:${c.reset}    ${new Date(info.manifest.installedAt).toLocaleDateString()}`);
      }
      console.log('');
    });

  // ========================================================================
  // init (scaffold)
  // ========================================================================
  registry
    .command('init <name>')
    .description('Scaffold a new component package directory')
    .option('-c, --category <category>', 'Component category (atom, molecule, organism, template)', 'molecule')
    .action(async (name, options) => {
      const targetDir = resolve(process.cwd(), name);

      if (existsSync(targetDir)) {
        console.log(`${c.red}Error: Directory "${name}" already exists${c.reset}`);
        process.exit(1);
      }

      mkdirSync(targetDir, { recursive: true });

      // manifest.json
      const manifest = {
        name,
        version: '1.0.0',
        description: `A custom ${options.category} component`,
        author: '',
        license: 'MIT',
        category: options.category,
        keywords: [name],
        nlPatterns: [name.replace(/-/g, ' ')],
        hasTokens: true,
        aioliVersion: '>=0.2.0',
      };
      writeFileSync(resolve(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

      // template.js
      const blockName = name;
      const templateContent = `/**
 * ${name} — Aioli Community Component
 *
 * Export a template definition matching the COMPONENT_TEMPLATES shape:
 *   { category, description, variants?, sizes?, template: (props) => { html, tokens, a11y } }
 */

export default {
  category: '${options.category}',
  description: '${manifest.description}',
  variants: ['default'],
  template: ({ variant = 'default', children = 'Content' }) => ({
    html: \`<div class="${blockName} ${blockName}--\${variant}">
  <div class="${blockName}__content">\${children}</div>
</div>\`,
    tokens: [
      'component.${blockName}.background',
      'component.${blockName}.padding',
    ],
    a11y: {
      role: 'region',
      focusable: false,
    },
  }),
};
`;
      writeFileSync(resolve(targetDir, 'template.js'), templateContent);

      // styles.css
      const cssContent = `/* ${name} — Aioli Community Component */

.${blockName} {
  display: block;
  padding: var(--component-${blockName}-padding, 1rem);
  background: var(--component-${blockName}-background, var(--semantic-surface-primary));
  border-radius: var(--primitive-radius-md);
}

.${blockName}--default {
  /* Default variant styles */
}

.${blockName}__content {
  color: var(--semantic-text-primary);
}
`;
      writeFileSync(resolve(targetDir, 'styles.css'), cssContent);

      // tokens.json
      const tokensContent = {
        component: {
          [blockName]: {
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
      writeFileSync(resolve(targetDir, 'tokens.json'), JSON.stringify(tokensContent, null, 2) + '\n');

      console.log(`${c.green}✓ Scaffolded "${name}" component package:${c.reset}\n`);
      console.log(`  ${c.cyan}${name}/${c.reset}`);
      console.log(`  ├── manifest.json`);
      console.log(`  ├── template.js`);
      console.log(`  ├── styles.css`);
      console.log(`  └── tokens.json\n`);
      console.log(`  ${c.dim}Edit the files, then run: aioli registry publish ./${name}${c.reset}`);
    });
}
