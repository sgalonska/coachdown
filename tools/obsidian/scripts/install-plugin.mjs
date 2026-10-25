// Copies the built plugin into a vault:  npm run install-plugin -- "/path/to/your/vault"
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const vault = process.argv[2];
if (!vault) {
  console.error('Usage: npm run install-plugin -- "/path/to/your/vault"');
  process.exit(1);
}
const root = resolve(vault);
if (!existsSync(join(root, '.obsidian'))) {
  console.error(`No .obsidian folder in ${root}. Is this an Obsidian vault? Open it in Obsidian once, then try again.`);
  process.exit(1);
}
for (const f of ['main.js', 'manifest.json', 'styles.css']) {
  if (!existsSync(f)) {
    console.error(`${f} is missing. Run "npm run build" first.`);
    process.exit(1);
  }
}
const target = join(root, '.obsidian', 'plugins', 'coachdown');
mkdirSync(target, { recursive: true });
for (const f of ['main.js', 'manifest.json', 'styles.css']) copyFileSync(f, join(target, f));
console.log(`Installed Coachdown into ${target}`);
console.log('In Obsidian: Settings → Community plugins → reload the list and enable "Coachdown".');
