/**
 * aioli export - Export tokens in different formats
 */

import { resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

export function registerExportCommand(program) {
  program
    .command('export')
    .description('Export tokens in different formats')
    .option('--format <format>', 'Output format: css, json, scss', 'css')
    .option('--tokens-dir <path>', 'Path to tokens directory', './tokens')
    .option('-o, --output <path>', 'Output file path (defaults to stdout)')
    .action(async (options) => {
      const tokensDir = resolve(process.cwd(), options.tokensDir);

      if (!existsSync(tokensDir)) {
        console.error(`${c.red}Error:${c.reset} Tokens directory not found: ${tokensDir}`);
        process.exit(1);
      }

      // Suppress agent console output when writing to stdout
      const toStdout = !options.output;
      const originalLog = console.log;
      const originalWarn = console.warn;

      try {
        if (toStdout) {
          console.log = () => {};
          console.warn = () => {};
        }

        const { createDesignTokenAgent } = await import('../../agents/design-token-agent.js');
        const agent = createDesignTokenAgent(tokensDir);

        let output;

        switch (options.format) {
          case 'css':
            output = agent.toCSS();
            break;

          case 'json':
            output = JSON.stringify(agent.toFlatJSON(), null, 2);
            break;

          case 'scss': {
            const flatTokens = agent.toFlatJSON();
            const lines = [
              '// Aioli Design Tokens - Generated SCSS Variables',
              `// Generated: ${new Date().toISOString()}`,
              '',
            ];
            for (const [path, entry] of Object.entries(flatTokens)) {
              const varName = path.replace(/\./g, '-');
              const val = typeof entry === 'object' ? entry.value : entry;
              lines.push(`$${varName}: ${val};`);
            }
            output = lines.join('\n') + '\n';
            break;
          }

          default:
            console.error(`${c.red}Error:${c.reset} Unknown format "${options.format}". Use: css, json, scss`);
            process.exit(1);
        }

        // Restore console before writing output
        console.log = originalLog;
        console.warn = originalWarn;

        if (options.output) {
          const outputPath = resolve(process.cwd(), options.output);
          mkdirSync(dirname(outputPath), { recursive: true });
          writeFileSync(outputPath, output, 'utf8');
          console.log(`${c.green}Exported${c.reset} ${options.format} -> ${outputPath}`);
        } else {
          process.stdout.write(output);
        }
      } catch (err) {
        // Always restore console on error
        console.log = originalLog;
        console.warn = originalWarn;
        console.error(`${c.red}Export failed:${c.reset} ${err.message}`);
        if (process.env.DEBUG) {
          console.error(err.stack);
        }
        process.exit(1);
      }
    });
}
