/** Helpers shared by the workspace scripts (dev, new, package). */
import { type SpawnSyncReturns, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseEnv } from 'node:util';

/** The workspace root (the folder with the root package.json). */
export const rootDir = resolve(import.meta.dirname, '../..');

/** The base extension that `npm run new` copies. */
export const TEMPLATE_FOLDER = 'template-extension';

/** The file that makes a workspace an extension (it defines the manifest). */
export const EXTENSION_MARKER = 'manifest.config.ts';

/**
 * The npm workspaces: top-level folders with a package.json, which is what the root
 * `"workspaces": ["*\/"]` matches. Sorted by name.
 */
export function listWorkspaces(root: string = rootDir): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'node_modules' &&
        existsSync(join(root, entry.name, 'package.json')),
    )
    .map((entry) => entry.name)
    .sort();
}

/** The workspaces that are Chrome extensions (they have a manifest.config.ts). Sorted by name. */
export function listExtensions(root: string = rootDir): string[] {
  return listWorkspaces(root).filter((folder) => existsSync(join(root, folder, EXTENSION_MARKER)));
}

/**
 * The extensions named on the command line (all of them when none is named).
 * Accepts folder names with a trailing slash (shell completion); throws on unknown names.
 */
export function selectExtensions(available: string[], requested: string[]): string[] {
  if (requested.length === 0) return available;
  const selected = requested.map((name) => name.replace(/[\\/]+$/, ''));
  const unknown = selected.filter((name) => !available.includes(name));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown extension folder: ${unknown.join(', ')}. Available: ${available.join(', ') || 'none'}.`,
    );
  }
  return [...new Set(selected)];
}

/** The workspace name: APP_NAME from the root .env (written by fastDev), if there is one. */
export function workspaceName(root: string = rootDir): string | undefined {
  const envFile = join(root, '.env');
  if (!existsSync(envFile)) return undefined;
  const name = parseEnv(readFileSync(envFile, 'utf8')).APP_NAME?.trim();
  if (!name) return undefined;
  return name;
}

/**
 * Runs npm with inherited output. Uses the npm that started this script (`npm run …`) when known,
 * so the same npm version installs as the one the owner runs.
 */
export function runNpm(args: string[], cwd: string = rootDir): SpawnSyncReturns<Buffer> {
  const npmCli = process.env.npm_execpath;
  return npmCli?.endsWith('.js')
    ? spawnSync(process.execPath, [npmCli, ...args], { cwd, stdio: 'inherit' })
    : spawnSync('npm', args, { cwd, stdio: 'inherit' });
}
