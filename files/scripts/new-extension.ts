/**
 * `npm run new -- "Tab Organizer" [--folder tab-organizer] [--skip-install]`
 *
 * Copies template-extension/ to a new extension folder (the slug of the name), sets its package
 * name and .env, then runs `npm install` at the root so npm links the new workspace and records
 * it in package-lock.json.
 */
import { parseArgs } from 'node:util';
import { createExtension } from './lib/new-extension.ts';
import { rootDir, runNpm, TEMPLATE_FOLDER } from './lib/workspace.ts';

const usage = `Usage: npm run new -- "<Extension name>" [--folder <folder>] [--skip-install]

Creates <folder>/ (default, also for an empty --folder: the name in lowercase with dashes) as a
copy of ${TEMPLATE_FOLDER}/.`;

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      folder: { type: 'string' },
      'skip-install': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
} catch (error) {
  console.error(`${error instanceof Error ? error.message : String(error)}\n\n${usage}`);
  process.exit(1);
}

const name = args.positionals.join(' ');
if (args.values.help || !name.trim()) {
  console.log(usage);
  process.exit(args.values.help ? 0 : 1);
}

// An empty --folder (e.g. an optional field left blank in fastDev) means "derive it from the name".
const requestedFolder = args.values.folder?.trim();

let created;
try {
  created = createExtension({
    root: rootDir,
    name,
    folder: requestedFolder === '' ? undefined : requestedFolder,
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
const { folder } = created;
console.log(`Created ${folder}/ ("${created.name}") from ${TEMPLATE_FOLDER}/.`);

if (!args.values['skip-install']) {
  console.log('Linking the new workspace: npm install');
  const install = runNpm(['install', '--no-audit', '--no-fund']);
  if (install.status !== 0) {
    console.error(`npm install failed. ${folder}/ was created; run npm install in the root again.`);
    process.exit(install.status ?? 1);
  }
}

console.log(`
Next steps:
  1. Describe it in ${folder}/.env (VITE_EXTENSION_DESCRIPTION) and keep ${folder}/.env.example in sync.
  2. npm run build -w ${folder}      (or: npm run dev -- ${folder} to rebuild on every change)
  3. chrome://extensions → Developer mode → Load unpacked → select ${folder}/dist`);
