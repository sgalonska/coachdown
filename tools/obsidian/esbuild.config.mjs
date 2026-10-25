import esbuild from 'esbuild';
import { builtinModules } from 'node:module';

const watch = process.argv.includes('--watch');
const production = process.argv.includes('--production');

const shared = { bundle: true, logLevel: 'info', sourcemap: production ? false : 'inline', minify: production };

// Obsidian plugin: main.js next to manifest.json and styles.css
const plugin = await esbuild.context({
  ...shared,
  entryPoints: ['src/main.ts'],
  outfile: 'main.js',
  format: 'cjs',
  target: 'es2020',
  platform: 'browser',
  external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*', ...builtinModules],
});

// Command-line tool and library build of the parser
const cli = await esbuild.context({ ...shared, sourcemap: false, minify: false, entryPoints: ['src/cli.ts'], outfile: 'dist/cli.cjs', format: 'cjs', platform: 'node', target: 'node18', banner: { js: '#!/usr/bin/env node' } });
const lib = await esbuild.context({ ...shared, sourcemap: false, minify: false, entryPoints: ['src/index.ts'], outfile: 'dist/coachdown.mjs', format: 'esm', platform: 'neutral', target: 'es2020' });

if (watch) {
  await Promise.all([plugin.watch(), cli.watch(), lib.watch()]);
} else {
  await Promise.all([plugin.rebuild(), cli.rebuild(), lib.rebuild()]);
  await Promise.all([plugin.dispose(), cli.dispose(), lib.dispose()]);
}
