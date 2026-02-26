/**
 * aioli theme - Brand theming and theme file management
 *
 * Subcommands:
 *   derive     Derive a brand theme from color(s)
 *   harmonies  Suggest color harmonies from a primary color
 *   audit      Validate theme contrast / accessibility
 *   import     Import a .aioli-theme.json file
 *   export     Export current brand to .aioli-theme.json
 */

import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
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

export function registerThemeCommand(program) {
  const theme = program
    .command('theme')
    .description('Brand theming — derive, audit, import/export theme files');

  // ── derive ──────────────────────────────────────────────────────────
  theme
    .command('derive')
    .description('Derive a complete brand theme from color(s)')
    .requiredOption('--primary <hex>', 'Primary brand color (required)')
    .option('--secondary <hex>', 'Secondary color')
    .option('--accent <hex>', 'Accent color')
    .option('--neutral <hex>', 'Neutral color')
    .option('--success <hex>', 'Success color')
    .option('--danger <hex>', 'Danger color')
    .option('--preset <name>', 'Base preset (default, glass, neumorphic, brutalist, gradient, darkLuxury)')
    .option('--radius <value>', 'Border radius (e.g. "8px")')
    .option('--font <family>', 'Font family')
    .option('--format <fmt>', 'Output format: css or json', 'css')
    .option('-o, --output <path>', 'Write output to file')
    .action(async (options) => {
      try {
        const { deriveBrandTheme, validateTheme } = await import('../../lib/theme-presets.js');
        const { createTheme } = await import('../../lib/theme.js');

        const config = { primary: options.primary };
        if (options.secondary) config.secondary = options.secondary;
        if (options.accent) config.accent = options.accent;
        if (options.neutral) config.neutral = options.neutral;
        if (options.success) config.success = options.success;
        if (options.danger) config.danger = options.danger;

        const opts = {};
        if (options.preset) opts.preset = options.preset;
        if (options.radius) opts.radius = options.radius;
        if (options.font) opts.font = options.font;
        if (Object.keys(opts).length > 0) config.options = opts;

        const overrides = deriveBrandTheme(config);
        const validation = validateTheme(overrides);

        let output;
        if (options.format === 'json') {
          output = JSON.stringify(overrides, null, 2);
        } else {
          output = createTheme(overrides).toCSS();
        }

        if (options.output) {
          const outPath = resolve(process.cwd(), options.output);
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, output, 'utf8');
          console.log(`${c.green}Generated${c.reset} -> ${outPath}`);
        } else {
          process.stdout.write(output + '\n');
        }

        // Print validation summary
        const s = validation.summary;
        const status = validation.valid ? `${c.green}PASS${c.reset}` : `${c.red}FAIL${c.reset}`;
        console.error(`\n${c.dim}Contrast:${c.reset} ${status} (${s.pass}/${s.total} pairs pass)`);
        if (!validation.valid) {
          for (const f of validation.failures) {
            console.error(`  ${c.red}x${c.reset} ${f.label}: ${f.ratio}:1 (needs ${f.required}:1)`);
          }
        }
      } catch (err) {
        console.error(`${c.red}Error:${c.reset} ${err.message}`);
        if (process.env.DEBUG) console.error(err.stack);
        process.exit(1);
      }
    });

  // ── harmonies ───────────────────────────────────────────────────────
  theme
    .command('harmonies')
    .description('Suggest color harmonies from a primary color')
    .requiredOption('--primary <hex>', 'Primary brand color')
    .action(async (options) => {
      try {
        const { suggestHarmonies } = await import('../../lib/theme-presets.js');

        const result = suggestHarmonies(options.primary);

        console.log(`\n${c.cyan}${c.bold}Color Harmonies${c.reset} for ${c.bold}${options.primary}${c.reset}\n`);

        for (const [name, data] of Object.entries(result)) {
          const label = name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
          console.log(`  ${c.bold}${label}${c.reset}`);
          for (const shade of data.shades) {
            const status = shade.ratio >= 4.5 ? c.green : c.yellow;
            console.log(`    ${shade.raw} -> ${shade.shade} ${status}(${shade.ratio}:1)${c.reset}`);
          }
        }
        console.log('');
      } catch (err) {
        console.error(`${c.red}Error:${c.reset} ${err.message}`);
        if (process.env.DEBUG) console.error(err.stack);
        process.exit(1);
      }
    });

  // ── audit ───────────────────────────────────────────────────────────
  theme
    .command('audit')
    .description('Audit theme contrast for WCAG AA compliance')
    .option('--file <path>', 'Path to .aioli-theme.json to audit')
    .option('--primary <hex>', 'Primary color to derive and audit')
    .option('--report <path>', 'Save JSON report to file')
    .action(async (options) => {
      try {
        const { auditTheme, deriveBrandTheme } = await import('../../lib/theme-presets.js');

        let overrides = {};

        if (options.file) {
          const { importThemeFile } = await import('../../lib/theme-file.js');
          const filePath = resolve(process.cwd(), options.file);
          if (!existsSync(filePath)) {
            console.error(`${c.red}Error:${c.reset} File not found: ${filePath}`);
            process.exit(1);
          }
          const json = JSON.parse(readFileSync(filePath, 'utf8'));
          const imported = importThemeFile(json);
          overrides = imported.overrides;
          console.log(`\n${c.cyan}${c.bold}Aioli${c.reset} ${c.dim}Auditing theme "${json.name}"...${c.reset}\n`);
        } else if (options.primary) {
          overrides = deriveBrandTheme({ primary: options.primary });
          console.log(`\n${c.cyan}${c.bold}Aioli${c.reset} ${c.dim}Auditing derived theme for ${options.primary}...${c.reset}\n`);
        } else {
          console.log(`\n${c.cyan}${c.bold}Aioli${c.reset} ${c.dim}Auditing base theme defaults...${c.reset}\n`);
        }

        const audit = auditTheme(overrides);

        for (const pair of audit.pairs) {
          if (pair.skipped) {
            console.log(`  ${c.dim}SKIP${c.reset} ${pair.label}`);
          } else if (pair.passes) {
            console.log(`  ${c.green}PASS${c.reset} ${pair.label} (${pair.ratio}:1)`);
          } else {
            console.log(`  ${c.red}FAIL${c.reset} ${pair.label} (${pair.ratio}:1, needs ${pair.required}:1)`);
          }
        }

        const s = audit.summary;
        console.log(`\n${c.bold}Summary:${c.reset} ${s.pass} pass, ${s.fail} fail, ${s.skipped} skipped / ${s.total} total\n`);

        if (options.report) {
          const reportPath = resolve(process.cwd(), options.report);
          mkdirSync(dirname(reportPath), { recursive: true });
          writeFileSync(reportPath, JSON.stringify(audit, null, 2), 'utf8');
          console.log(`${c.cyan}Report saved:${c.reset} ${reportPath}\n`);
        }

        if (s.fail > 0) process.exit(1);
      } catch (err) {
        console.error(`${c.red}Error:${c.reset} ${err.message}`);
        if (process.env.DEBUG) console.error(err.stack);
        process.exit(1);
      }
    });

  // ── import ──────────────────────────────────────────────────────────
  theme
    .command('import <file>')
    .description('Import a .aioli-theme.json file and generate CSS/JSON')
    .option('--format <fmt>', 'Output format: css or json', 'css')
    .option('-o, --output <path>', 'Write output to file')
    .action(async (file, options) => {
      try {
        const { importThemeFile } = await import('../../lib/theme-file.js');

        const filePath = resolve(process.cwd(), file);
        if (!existsSync(filePath)) {
          console.error(`${c.red}Error:${c.reset} File not found: ${filePath}`);
          process.exit(1);
        }

        const json = JSON.parse(readFileSync(filePath, 'utf8'));
        const result = importThemeFile(json);

        let output;
        if (options.format === 'json') {
          output = JSON.stringify(result.overrides, null, 2);
        } else {
          output = result.theme.toCSS();
        }

        if (options.output) {
          const outPath = resolve(process.cwd(), options.output);
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, output, 'utf8');
          console.log(`${c.green}Imported${c.reset} "${result.metadata.name}" -> ${outPath}`);
        } else {
          process.stdout.write(output + '\n');
        }

        const s = result.validation.summary;
        const status = result.validation.valid ? `${c.green}PASS${c.reset}` : `${c.red}FAIL${c.reset}`;
        console.error(`${c.dim}Contrast:${c.reset} ${status} (${s.pass}/${s.total} pairs)`);
      } catch (err) {
        console.error(`${c.red}Error:${c.reset} ${err.message}`);
        if (process.env.DEBUG) console.error(err.stack);
        process.exit(1);
      }
    });

  // ── export ──────────────────────────────────────────────────────────
  theme
    .command('export')
    .description('Export brand colors to .aioli-theme.json')
    .requiredOption('--name <name>', 'Theme name')
    .requiredOption('--primary <hex>', 'Primary brand color')
    .option('--secondary <hex>', 'Secondary color')
    .option('--accent <hex>', 'Accent color')
    .option('--neutral <hex>', 'Neutral color')
    .option('--success <hex>', 'Success color')
    .option('--danger <hex>', 'Danger color')
    .option('--preset <name>', 'Base preset')
    .option('--radius <value>', 'Border radius')
    .option('--font <family>', 'Font family')
    .option('-o, --output <path>', 'Output file path', '.aioli-theme.json')
    .action(async (options) => {
      try {
        const { exportThemeFile } = await import('../../lib/theme-file.js');

        const brand = { primary: options.primary };
        if (options.secondary) brand.secondary = options.secondary;
        if (options.accent) brand.accent = options.accent;
        if (options.neutral) brand.neutral = options.neutral;
        if (options.success) brand.success = options.success;
        if (options.danger) brand.danger = options.danger;

        const opts = {};
        if (options.preset) opts.preset = options.preset;
        if (options.radius) opts.radius = options.radius;
        if (options.font) opts.font = options.font;

        const json = exportThemeFile({
          name: options.name,
          brand,
          options: Object.keys(opts).length > 0 ? opts : undefined,
        });

        const outPath = resolve(process.cwd(), options.output);
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, json, 'utf8');
        console.log(`${c.green}Exported${c.reset} "${options.name}" -> ${outPath}`);
      } catch (err) {
        console.error(`${c.red}Error:${c.reset} ${err.message}`);
        if (process.env.DEBUG) console.error(err.stack);
        process.exit(1);
      }
    });
}
