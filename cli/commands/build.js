/**
 * aioli build - Build tokens into CSS and JSON output
 */

import { resolve } from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

export function registerBuildCommand(program) {
  program
    .command('build')
    .description('Build design tokens into CSS and JSON output')
    .option('-c, --config <path>', 'Path to Style Dictionary config', 'config.js')
    .action(async (options) => {
      const configPath = resolve(process.cwd(), options.config);

      if (!existsSync(configPath)) {
        console.error(`${c.red}Error:${c.reset} Config file not found: ${configPath}`);
        console.error(`${c.dim}Run "aioli init" to create a project, or specify --config path${c.reset}`);
        process.exit(1);
      }

      console.log(`\n${c.cyan}${c.bold}Aioli${c.reset} ${c.dim}Building tokens...${c.reset}\n`);

      try {
        const StyleDictionary = (await import('style-dictionary')).default;
        const configModule = await import(pathToFileURL(configPath).href);
        const config = configModule.default;

        const sd = new StyleDictionary(config);
        await sd.buildAllPlatforms();

        console.log(`${c.green}Build complete!${c.reset}\n`);

        // Report output files
        if (config.platforms) {
          for (const [platform, platformConfig] of Object.entries(config.platforms)) {
            const buildPath = platformConfig.buildPath || '';
            if (platformConfig.files) {
              for (const file of platformConfig.files) {
                console.log(`  ${c.cyan}${platform}${c.reset} -> ${buildPath}${file.destination}`);
              }
            }
          }
        }

        console.log('');
      } catch (err) {
        console.error(`${c.red}Build failed:${c.reset} ${err.message}`);
        if (process.env.DEBUG) {
          console.error(err.stack);
        }
        process.exit(1);
      }
    });
}
