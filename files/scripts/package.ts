/**
 * `npm run package [-- <folder>…]`: zips each extension's dist/ into <extension>/extension.zip for
 * the Chrome Web Store (manifest.json at the root of the archive). `npm run package` builds first.
 * Uses the system `zip` command (part of macOS).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { listExtensions, rootDir, selectExtensions, workspaceName } from './lib/workspace.ts';

let extensions: string[];
try {
  extensions = selectExtensions(listExtensions(), process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const name = workspaceName();
if (name) console.log(`${name}: packaging ${String(extensions.length)} extension(s)`);

let failed = false;
for (const extension of extensions) {
  const dist = join(rootDir, extension, 'dist');
  const archive = join(rootDir, extension, 'extension.zip');
  if (!existsSync(join(dist, 'manifest.json'))) {
    console.error(`${extension}: dist/manifest.json is missing; run npm run build first.`);
    failed = true;
    continue;
  }
  rmSync(archive, { force: true });
  // -X: no extra file attributes, so the archive only changes when the files do.
  const zip = spawnSync('zip', ['-r', '-q', '-X', archive, '.', '-x', '*.DS_Store'], {
    cwd: dist,
    stdio: 'inherit',
  });
  if (zip.error) {
    console.error(`Could not run zip: ${zip.error.message}. Install zip and try again.`);
    process.exit(1);
  }
  if (zip.status !== 0) {
    console.error(`${extension}: zip failed with code ${String(zip.status)}.`);
    failed = true;
    continue;
  }
  const kilobytes = (statSync(archive).size / 1024).toFixed(1);
  console.log(`${extension}/extension.zip (${kilobytes} kB)`);
}

process.exit(failed ? 1 : 0);
