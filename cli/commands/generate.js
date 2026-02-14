/**
 * aioli generate - Generate a component from natural language description
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
  yellow: '\x1b[33m',
};

export function registerGenerateCommand(program) {
  program
    .command('generate <description>')
    .description('Generate a component from a natural language description')
    .option('--tokens-dir <path>', 'Path to tokens directory', './tokens')
    .option('--format <format>', 'Output format: html, json', 'html')
    .option('-o, --output <path>', 'Write output to file instead of stdout')
    .option('--api-key <key>', 'Anthropic API key for AI-powered generation')
    .option('--ai', 'Use AI-powered generation (requires ANTHROPIC_API_KEY)')
    .action(async (description, options) => {
      const tokensDir = resolve(process.cwd(), options.tokensDir);

      if (!existsSync(tokensDir)) {
        console.error(`${c.red}Error:${c.reset} Tokens directory not found: ${tokensDir}`);
        process.exit(1);
      }

      try {
        const { createDesignTokenAgent } = await import('../../agents/design-token-agent.js');
        const { createMotionAgent } = await import('../../agents/motion-agent.js');
        const { createComponentGenerator } = await import('../../agents/component-generator-agent.js');

        const tokenAgent = createDesignTokenAgent(tokensDir);
        const motionAgent = createMotionAgent({ tokenAgent });
        const componentAgent = createComponentGenerator({ tokenAgent, motionAgent });

        let result;

        // Check if AI mode requested
        const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
        if (options.ai && apiKey) {
          const { AIComponentGenerator } = await import('../../agents/ai-component-generator.js');
          const aiGenerator = new AIComponentGenerator({
            tokenAgent,
            apiKey,
          });
          result = await aiGenerator.generate(description);
        } else {
          // Template-based generation
          result = componentAgent.generateFromDescription(description);

          if (options.ai && !apiKey) {
            console.error(`${c.yellow}Warning:${c.reset} --ai flag used but no API key found.`);
            console.error(`${c.dim}Set ANTHROPIC_API_KEY env var or use --api-key flag${c.reset}`);
            console.error(`${c.dim}Falling back to template-based generation${c.reset}\n`);
          }
        }

        if (!result || !result.html) {
          console.error(`${c.red}Error:${c.reset} Could not generate component from: "${description}"`);
          console.error(`${c.dim}Try a more specific description, e.g.: "large primary button with icon"${c.reset}`);
          process.exit(1);
        }

        let output;
        if (options.format === 'json') {
          output = JSON.stringify(result, null, 2);
        } else {
          output = result.html;
        }

        if (options.output) {
          const outputPath = resolve(process.cwd(), options.output);
          mkdirSync(dirname(outputPath), { recursive: true });
          writeFileSync(outputPath, output, 'utf8');
          console.log(`${c.green}Generated${c.reset} -> ${outputPath}`);
          if (result.tokens && result.tokens.length > 0) {
            console.log(`${c.dim}Tokens used: ${result.tokens.join(', ')}${c.reset}`);
          }
        } else {
          process.stdout.write(output);
          if (!output.endsWith('\n')) {
            process.stdout.write('\n');
          }
        }
      } catch (err) {
        console.error(`${c.red}Generation failed:${c.reset} ${err.message}`);
        if (process.env.DEBUG) {
          console.error(err.stack);
        }
        process.exit(1);
      }
    });
}
