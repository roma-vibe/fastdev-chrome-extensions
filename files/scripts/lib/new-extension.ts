/**
 * Creating a new extension from template-extension/ (used by `npm run new`).
 * Pure helpers (slug, copy filter, .env writing) are exported for tests.
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { listWorkspaces, TEMPLATE_FOLDER } from './workspace.ts';

/** Version of a new extension (VITE_EXTENSION_VERSION; package.json versions are not used). */
export const INITIAL_VERSION = '0.1.0';

/** Chrome limits the extension name to 75 characters. */
const MAX_NAME_LENGTH = 75;

/** Folder names that must not become extensions. */
const RESERVED_FOLDERS = new Set(['node_modules', 'scripts', 'dist', 'coverage']);

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', ґ: 'g', д: 'd', е: 'e', ё: 'e', є: 'ie', ж: 'zh', з: 'z',
  и: 'i', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '',
  ы: 'y', ь: '', э: 'e', ю: 'iu', я: 'ia',
}; // prettier-ignore

/** Folder and package name for an extension name: "Tab Organizer" → "tab-organizer". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[а-яёєіїґ]/g, (char) => CYRILLIC[char] ?? char)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '');
}

/** Returns the trimmed name, or throws when Chrome would not accept it. */
export function validateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Give the extension a name: npm run new -- "Tab Organizer"');
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new Error(`The name is longer than ${String(MAX_NAME_LENGTH)} characters.`);
  }
  if (/\p{Cc}/u.test(trimmed)) throw new Error('The name must not contain control characters.');
  return trimmed;
}

/** Throws when `folder` cannot be a new extension folder. */
export function validateFolder(folder: string): void {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(folder)) {
    throw new Error(
      `"${folder}" is not a valid folder name: use lowercase letters, digits and dashes (--folder <name>).`,
    );
  }
  if (RESERVED_FOLDERS.has(folder)) throw new Error(`"${folder}" is a reserved folder name.`);
}

/**
 * Whether a file of template-extension/ goes into the copy. `relativePath` is relative to the
 * template folder. Build output, packages, local settings and dependencies stay behind.
 */
export function shouldCopy(relativePath: string): boolean {
  if (relativePath === '') return true;
  const parts = relativePath.split(/[\\/]/);
  const name = parts.at(-1) ?? '';
  if (parts.includes('node_modules')) return false;
  if (['dist', 'coverage', 'extension.zip'].includes(parts[0] ?? '')) return false;
  if (name === '.DS_Store' || name.endsWith('.tsbuildinfo')) return false;
  if (name === '.env' || (name.startsWith('.env.') && name !== '.env.example')) return false;
  return true;
}

/**
 * Formats a .env value so that Vite's loadEnv (dotenv + dotenv-expand) reads it back unchanged:
 * quotes when needed, and `$` escaped because Vite expands `$VAR` even inside quotes.
 */
export function formatEnvValue(value: string): string {
  if (/[\r\n]/.test(value)) throw new Error('.env values must be on one line.');
  const escaped = value.replaceAll('$', '\\$');
  if (/^[\w.:/@+-]*$/.test(escaped)) return escaped;
  for (const quote of ["'", '"', '`']) {
    // Inside double quotes dotenv turns \n and \r into line breaks.
    if (quote === '"' && /\\[nr]/.test(escaped)) continue;
    if (!escaped.includes(quote)) return `${quote}${escaped}${quote}`;
  }
  throw new Error(`Cannot write ${value} to .env: it uses all three quote characters.`);
}

/**
 * Sets `values` in the text of a .env file: replaces the lines of existing keys (keeping comments
 * and order) and appends missing keys.
 */
export function setEnvValues(text: string, values: Record<string, string>): string {
  const pending = new Map(Object.entries(values));
  const lines = text.split('\n').map((line) => {
    const key = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line)?.[1];
    if (key === undefined || !pending.has(key)) return line;
    const value = pending.get(key) ?? '';
    pending.delete(key);
    return `${key}=${formatEnvValue(value)}`;
  });
  let result = lines.join('\n');
  if (pending.size > 0) {
    if (result !== '' && !result.endsWith('\n')) result += '\n';
    for (const [key, value] of pending) result += `${key}=${formatEnvValue(value)}\n`;
  }
  return result;
}

export interface NewExtensionOptions {
  /** The workspace root. */
  root: string;
  /** Display name (VITE_EXTENSION_NAME). */
  name: string;
  /** Folder and package name; derived from the name when missing. */
  folder?: string;
}

export interface NewExtension {
  name: string;
  folder: string;
  dir: string;
}

/**
 * Copies template-extension/ to a new folder and personalises it: package name, README title,
 * .env.example and .env. Does not run npm.
 */
export function createExtension(options: NewExtensionOptions): NewExtension {
  const name = validateName(options.name);
  const folder = options.folder ?? slugify(name);
  if (!folder) {
    throw new Error(`Cannot make a folder name from "${name}": pass one with --folder <name>.`);
  }
  validateFolder(folder);

  const templateDir = join(options.root, TEMPLATE_FOLDER);
  if (!existsSync(join(templateDir, 'package.json'))) {
    throw new Error(`${TEMPLATE_FOLDER}/ is missing: it is the base of every new extension.`);
  }
  const dir = join(options.root, folder);
  if (existsSync(dir))
    throw new Error(`${folder}/ already exists; choose another name or --folder.`);
  const packageNames = listWorkspaces(options.root).map(
    (workspace) => readJson(join(options.root, workspace, 'package.json')).name,
  );
  if (packageNames.includes(folder)) {
    throw new Error(`A workspace package is already named "${folder}"; use --folder.`);
  }

  // Prepare the settings before copying, so an invalid value leaves nothing behind.
  const templateExample = join(templateDir, '.env.example');
  const env = setEnvValues(
    existsSync(templateExample) ? readFileSync(templateExample, 'utf8') : '',
    {
      VITE_EXTENSION_NAME: name,
      VITE_EXTENSION_VERSION: INITIAL_VERSION,
    },
  );

  cpSync(templateDir, dir, {
    recursive: true,
    filter: (source) => shouldCopy(relative(templateDir, source)),
  });

  const packageFile = join(dir, 'package.json');
  const packageJson = readJson(packageFile);
  packageJson.name = folder;
  writeFileSync(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`);

  const readme = join(dir, 'README.md');
  if (existsSync(readme)) {
    writeFileSync(
      readme,
      readFileSync(readme, 'utf8').replace(/^# .*$/m, () => `# ${name}`),
    );
  }

  writeFileSync(join(dir, '.env.example'), env);
  writeFileSync(join(dir, '.env'), env);

  return { name, folder, dir };
}

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
}
