/**
 * aioli init - Initialize a new Aioli project
 *
 * Supports two modes:
 *   1. Template mode: aioli init --template <minimal|starter|full>
 *   2. Interactive mode: aioli init (walks through prompts)
 */

import { resolve, basename, join } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import prompts from 'prompts';
import {
  TEMPLATES,
  ALL_COMPONENTS,
  COMPONENT_CHOICES,
  scaffoldTokens,
  generateConfig,
  generateEnvExample,
  generatePackageJson,
} from '../templates/manifest.js';

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

export function registerInitCommand(program) {
  program
    .command('init')
    .description('Initialize a new Aioli project')
    .option('-t, --template <template>', 'Use a template: minimal, starter, full')
    .option('-d, --dir <directory>', 'Target directory', '.')
    .option('--force', 'Overwrite existing files without asking')
    .action(async (options) => {
      console.log(`\n${c.cyan}${c.bold}Aioli${c.reset} ${c.dim}Project Initialization${c.reset}\n`);

      const targetDir = resolve(process.cwd(), options.dir);

      // Check for existing files
      if (!options.force && existsSync(targetDir)) {
        try {
          const files = readdirSync(targetDir);
          const hasTokens = files.includes('tokens');
          const hasConfig = files.includes('config.js');

          if (hasTokens || hasConfig) {
            const overwrite = await prompts({
              type: 'confirm',
              name: 'proceed',
              message: `Directory already contains Aioli files (${[hasTokens && 'tokens/', hasConfig && 'config.js'].filter(Boolean).join(', ')}). Overwrite?`,
              initial: false,
            });

            if (!overwrite.proceed) {
              console.log(`${c.dim}Cancelled. Use --force to overwrite.${c.reset}\n`);
              return;
            }
          }
        } catch {
          // Directory doesn't exist yet or can't be read, proceed
        }
      }

      // Template mode
      if (options.template) {
        const templateName = options.template.toLowerCase();
        if (!TEMPLATES[templateName]) {
          console.error(`${c.red}Error:${c.reset} Unknown template "${templateName}"`);
          console.error(`${c.dim}Available templates: ${Object.keys(TEMPLATES).join(', ')}${c.reset}`);
          process.exit(1);
        }

        const projectName = basename(targetDir) || 'my-design-system';
        await scaffold(targetDir, TEMPLATES[templateName], templateName, projectName);
        return;
      }

      // Interactive mode
      const answers = await runInteractivePrompts(targetDir);
      if (!answers) {
        console.log(`\n${c.dim}Cancelled.${c.reset}\n`);
        return;
      }

      await scaffold(targetDir, answers.template, answers.templateName, answers.projectName);
    });
}

/**
 * Run interactive prompts to build a custom template
 */
async function runInteractivePrompts(targetDir) {
  const onCancel = () => {
    return false;
  };

  const response = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: basename(targetDir),
    },
    {
      type: 'select',
      name: 'preset',
      message: 'Start from a preset or customize?',
      choices: [
        { title: 'Starter (recommended)', description: 'Primitives + semantic + common components', value: 'starter' },
        { title: 'Minimal', description: 'Just primitive and semantic tokens', value: 'minimal' },
        { title: 'Full', description: 'All component token files', value: 'full' },
        { title: 'Custom', description: 'Choose which components to include', value: 'custom' },
      ],
    },
  ], { onCancel });

  if (!response.projectName) return null;

  let template;
  let templateName;

  if (response.preset === 'custom') {
    // Custom component selection
    const customResponse = await prompts([
      {
        type: 'toggle',
        name: 'includeDarkMode',
        message: 'Include dark mode tokens?',
        initial: true,
        active: 'yes',
        inactive: 'no',
      },
      {
        type: 'multiselect',
        name: 'components',
        message: 'Select component tokens to include:',
        choices: COMPONENT_CHOICES.map(choice => ({
          title: choice.title,
          value: choice.value,
          selected: ['button.json', 'input.json', 'card.json'].includes(choice.value),
        })),
        hint: '- Space to select, Enter to confirm',
      },
    ], { onCancel });

    if (!customResponse.components) return null;

    template = {
      primitives: TEMPLATES.full.primitives,
      semantic: customResponse.includeDarkMode
        ? TEMPLATES.full.semantic
        : TEMPLATES.full.semantic.filter(f => f !== 'dark.json'),
      components: customResponse.components,
    };
    templateName = 'custom';
  } else {
    template = TEMPLATES[response.preset];
    templateName = response.preset;
  }

  // Confirm
  const componentCount = template.components.length;
  const confirm = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: `Create project "${response.projectName}" with ${templateName} template (${componentCount} component${componentCount !== 1 ? 's' : ''})?`,
    initial: true,
  }, { onCancel });

  if (!confirm.proceed) return null;

  return {
    projectName: response.projectName,
    template,
    templateName,
  };
}

/**
 * Scaffold the project
 */
async function scaffold(targetDir, template, templateName, projectName) {
  try {
    // Create target directory
    mkdirSync(targetDir, { recursive: true });

    console.log(`${c.dim}Template:${c.reset} ${templateName}`);
    console.log(`${c.dim}Directory:${c.reset} ${targetDir}\n`);

    // 1. Copy token files
    console.log(`  ${c.cyan}tokens/${c.reset} Copying token files...`);
    const copied = scaffoldTokens(targetDir, template);

    const primCount = template.primitives.length;
    const semCount = template.semantic.length;
    const compCount = template.components.length;
    console.log(`    ${c.green}+${c.reset} ${primCount} primitive, ${semCount} semantic, ${compCount} component token files`);

    // 2. Generate config.js
    console.log(`  ${c.cyan}config.js${c.reset} Style Dictionary configuration`);
    generateConfig(targetDir);

    // 3. Generate .env.example
    console.log(`  ${c.cyan}.env.example${c.reset} Environment variables template`);
    generateEnvExample(targetDir);

    // 4. Generate package.json
    console.log(`  ${c.cyan}package.json${c.reset} Project configuration`);
    generatePackageJson(targetDir, projectName || basename(targetDir));

    // 5. Create dist directory
    mkdirSync(join(targetDir, 'dist', 'css'), { recursive: true });

    // Verify files were created
    const verified = existsSync(join(targetDir, 'tokens')) &&
                     existsSync(join(targetDir, 'config.js'));

    if (!verified) {
      console.error(`\n${c.red}Warning:${c.reset} Some files may not have been created. Check the directory.`);
    }

    console.log(`\n${c.green}${c.bold}Project initialized!${c.reset}\n`);
    console.log(`${c.bold}Next steps:${c.reset}`);
    if (targetDir !== resolve(process.cwd())) {
      console.log(`  cd ${targetDir}`);
    }
    console.log(`  npm install        ${c.dim}# Install Aioli as a dependency${c.reset}`);
    console.log(`  aioli build        ${c.dim}# Build tokens to CSS/JSON${c.reset}`);
    console.log(`  aioli validate     ${c.dim}# Validate token structure${c.reset}`);
    console.log(`  aioli audit        ${c.dim}# Run accessibility audit${c.reset}`);
    console.log(`  aioli generate     ${c.dim}# Generate a component${c.reset}`);
    console.log('');
  } catch (err) {
    console.error(`\n${c.red}Initialization failed:${c.reset} ${err.message}`);
    if (err.code === 'EACCES') {
      console.error(`${c.dim}Permission denied. Check directory permissions.${c.reset}`);
    } else if (err.code === 'ENOSPC') {
      console.error(`${c.dim}No space left on disk.${c.reset}`);
    }
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
