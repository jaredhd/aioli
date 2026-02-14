/**
 * aioli audit - Run accessibility audit on design tokens
 */

import { resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  magenta: '\x1b[35m',
};

export function registerAuditCommand(program) {
  program
    .command('audit')
    .description('Run accessibility audit on design tokens')
    .option('--tokens-dir <path>', 'Path to tokens directory', './tokens')
    .option('--level <level>', 'WCAG level: AA or AAA', 'AA')
    .option('--report <path>', 'Save JSON report to file')
    .action(async (options) => {
      const tokensDir = resolve(process.cwd(), options.tokensDir);

      if (!existsSync(tokensDir)) {
        console.error(`${c.red}Error:${c.reset} Tokens directory not found: ${tokensDir}`);
        process.exit(1);
      }

      console.log(`\n${c.cyan}${c.bold}Aioli${c.reset} ${c.dim}Running accessibility audit (WCAG ${options.level})...${c.reset}\n`);

      try {
        const { createDesignTokenAgent } = await import('../../agents/design-token-agent.js');
        const { createAccessibilityValidator, getContrastRatio } = await import('../../agents/accessibility-validator-agent.js');

        const tokenAgent = createDesignTokenAgent(tokensDir);
        const a11yAgent = createAccessibilityValidator({ tokenAgent, targetLevel: options.level });

        // Run token contrast validation
        const contrastResult = a11yAgent.validateTokenContrast();

        // Run structural validation
        const tokenValidation = tokenAgent.validate();

        // Collect results
        const report = {
          timestamp: new Date().toISOString(),
          level: options.level,
          tokensDir,
          contrast: contrastResult,
          tokenValidation: {
            valid: tokenValidation.valid,
            issueCount: tokenValidation.issues.length,
          },
        };

        // Print contrast results
        console.log(`${c.bold}Contrast Checks:${c.reset}`);

        let passCount = 0;
        let failCount = 0;
        let warnCount = 0;

        if (contrastResult.pairs) {
          for (const pair of contrastResult.pairs) {
            if (pair.pass) {
              passCount++;
              console.log(`  ${c.green}PASS${c.reset} ${pair.name || pair.description || 'Pair'} (${pair.ratio}:1)`);
            } else {
              failCount++;
              console.log(`  ${c.red}FAIL${c.reset} ${pair.name || pair.description || 'Pair'} (${pair.ratio}:1, needs ${pair.required}:1)`);
            }
          }
        } else if (contrastResult.results) {
          for (const result of contrastResult.results) {
            if (result.meetsAA || result.pass) {
              passCount++;
              console.log(`  ${c.green}PASS${c.reset} ${result.name || result.path || 'Check'}`);
            } else {
              failCount++;
              console.log(`  ${c.red}FAIL${c.reset} ${result.name || result.path || 'Check'}`);
            }
          }
        }

        // Token validation summary
        if (tokenValidation.issues.length > 0) {
          const tokenErrors = tokenValidation.issues.filter(i => i.severity === 'error');
          const tokenWarnings = tokenValidation.issues.filter(i => i.severity === 'warning');

          if (tokenErrors.length > 0) {
            console.log(`\n${c.red}${c.bold}Token Errors (${tokenErrors.length}):${c.reset}`);
            for (const issue of tokenErrors) {
              console.log(`  ${c.red}x${c.reset} ${issue.path}: ${issue.error}`);
            }
          }
          if (tokenWarnings.length > 0) {
            warnCount += tokenWarnings.length;
            console.log(`\n${c.yellow}${c.bold}Token Warnings (${tokenWarnings.length}):${c.reset}`);
            for (const issue of tokenWarnings) {
              console.log(`  ${c.yellow}!${c.reset} ${issue.path}: ${issue.error}`);
            }
          }
        }

        // Summary
        console.log(`\n${c.bold}Summary:${c.reset}`);
        console.log(`  ${c.green}Pass:${c.reset} ${passCount}`);
        if (failCount > 0) {
          console.log(`  ${c.red}Fail:${c.reset} ${failCount}`);
        }
        if (warnCount > 0) {
          console.log(`  ${c.yellow}Warn:${c.reset} ${warnCount}`);
        }
        console.log(`  ${c.dim}Level: WCAG ${options.level}${c.reset}`);
        console.log('');

        // Save report
        if (options.report) {
          const reportPath = resolve(process.cwd(), options.report);
          mkdirSync(dirname(reportPath), { recursive: true });
          writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
          console.log(`${c.cyan}Report saved:${c.reset} ${reportPath}\n`);
        }

        if (failCount > 0) {
          process.exit(1);
        }
      } catch (err) {
        console.error(`${c.red}Audit failed:${c.reset} ${err.message}`);
        if (process.env.DEBUG) {
          console.error(err.stack);
        }
        process.exit(1);
      }
    });
}
