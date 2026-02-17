#!/usr/bin/env node

/**
 * Aioli CLI - Design System toolkit
 *
 * Commands:
 *   init       Initialize a new Aioli project
 *   build      Build tokens into CSS and JSON
 *   validate   Validate DTCG token files
 *   generate   Generate a component from natural language
 *   audit      Run accessibility audit
 *   export     Export tokens in different formats
 *   registry   Manage community component packages
 */

import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkg = require(join(__dirname, '..', 'package.json'));

program
  .name('aioli')
  .description('Aioli Design System - AI-native design system engine')
  .version(pkg.version);

// Register commands
import { registerInitCommand } from '../cli/commands/init.js';
import { registerBuildCommand } from '../cli/commands/build.js';
import { registerValidateCommand } from '../cli/commands/validate.js';
import { registerGenerateCommand } from '../cli/commands/generate.js';
import { registerAuditCommand } from '../cli/commands/audit.js';
import { registerExportCommand } from '../cli/commands/export.js';
import { registerRegistryCommand } from '../cli/commands/registry.js';

registerInitCommand(program);
registerBuildCommand(program);
registerValidateCommand(program);
registerGenerateCommand(program);
registerAuditCommand(program);
registerExportCommand(program);
registerRegistryCommand(program);

program.parse();
