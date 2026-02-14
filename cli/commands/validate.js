/**
 * aioli validate - Validate DTCG token files
 */

import { resolve } from 'path';
import { existsSync } from 'fs';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

export function registerValidateCommand(program) {
  program
    .command('validate')
    .description('Validate DTCG token files for structural correctness')
    .option('--tokens-dir <path>', 'Path to tokens directory', './tokens')
    .action(async (options) => {
      const tokensDir = resolve(process.cwd(), options.tokensDir);

      if (!existsSync(tokensDir)) {
        console.error(`${c.red}Error:${c.reset} Tokens directory not found: ${tokensDir}`);
        console.error(`${c.dim}Run "aioli init" to create a project${c.reset}`);
        process.exit(1);
      }

      console.log(`\n${c.cyan}${c.bold}Aioli${c.reset} ${c.dim}Validating tokens...${c.reset}\n`);

      try {
        const { createDesignTokenAgent } = await import('../../agents/design-token-agent.js');
        const agent = createDesignTokenAgent(tokensDir);
        const result = agent.validate();

        const errors = result.issues.filter(i => i.severity === 'error');
        const warnings = result.issues.filter(i => i.severity === 'warning');

        if (errors.length > 0) {
          console.log(`${c.red}${c.bold}Errors (${errors.length}):${c.reset}`);
          for (const issue of errors) {
            console.log(`  ${c.red}x${c.reset} ${issue.path}: ${issue.error}`);
          }
          console.log('');
        }

        if (warnings.length > 0) {
          console.log(`${c.yellow}${c.bold}Warnings (${warnings.length}):${c.reset}`);
          for (const issue of warnings) {
            console.log(`  ${c.yellow}!${c.reset} ${issue.path}: ${issue.error}`);
          }
          console.log('');
        }

        if (result.valid) {
          // Count tokens loaded
          const allPaths = agent.getAllTokenPaths();
          const tokenCount = allPaths ? allPaths.length : 0;
          console.log(`${c.green}All tokens valid!${c.reset} (${tokenCount} tokens found)\n`);
        } else {
          console.log(`${c.red}Validation failed.${c.reset} Fix errors above and re-run.\n`);
          process.exit(1);
        }
      } catch (err) {
        console.error(`${c.red}Validation error:${c.reset} ${err.message}`);
        if (process.env.DEBUG) {
          console.error(err.stack);
        }
        process.exit(1);
      }
    });
}
