import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadEnv } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createExtension,
  formatEnvValue,
  setEnvValues,
  shouldCopy,
  slugify,
  validateFolder,
  validateName,
} from './new-extension.ts';

describe('slugify', () => {
  it('makes folder names from extension names', () => {
    expect(slugify('Tab Organizer')).toBe('tab-organizer');
    expect(slugify('  Test "Ext" 2.0!  ')).toBe('test-ext-2-0');
    expect(slugify('Café Crème')).toBe('cafe-creme');
    expect(slugify('Органайзер вкладок')).toBe('organaizer-vkladok');
    expect(slugify('Щука и ёж')).toBe('shchuka-i-ezh');
    expect(slugify('🙂')).toBe('');
  });
});

describe('validateName and validateFolder', () => {
  it('accepts names Chrome accepts', () => {
    expect(validateName('  Tab Organizer ')).toBe('Tab Organizer');
    expect(() => validateName('   ')).toThrow('Give the extension a name');
    expect(() => validateName('x'.repeat(76))).toThrow('longer than 75 characters');
    expect(() => validateName('Two\nlines')).toThrow('control characters');
  });

  it('accepts lowercase folder names that are not reserved', () => {
    expect(() => {
      validateFolder('tab-organizer-2');
    }).not.toThrow();
    expect(() => {
      validateFolder('Tab');
    }).toThrow('not a valid folder name');
    expect(() => {
      validateFolder('node_modules');
    }).toThrow('not a valid folder name');
    expect(() => {
      validateFolder('scripts');
    }).toThrow('reserved');
  });
});

describe('shouldCopy', () => {
  it('skips build output, packages, local settings and dependencies', () => {
    for (const path of ['src/main.ts', 'public/icons/icon16.png', '.env.example', 'README.md']) {
      expect(shouldCopy(path), path).toBe(true);
    }
    for (const path of [
      'dist',
      'dist/manifest.json',
      'extension.zip',
      'coverage',
      '.env',
      '.env.local',
      'node_modules',
      'src/node_modules/x.js',
      'tsconfig.tsbuildinfo',
      'src/.DS_Store',
    ]) {
      expect(shouldCopy(path), path).toBe(false);
    }
  });
});

describe('.env writing', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'env-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('quotes values only when needed', () => {
    expect(formatEnvValue('0.1.0')).toBe('0.1.0');
    expect(formatEnvValue('Tab Organizer')).toBe("'Tab Organizer'");
    expect(formatEnvValue("Tom's")).toBe('"Tom\'s"');
    expect(formatEnvValue("Tom's C:\\new")).toBe("`Tom's C:\\new`");
    expect(() => formatEnvValue('a\nb')).toThrow('one line');
  });

  it('writes values that Vite reads back unchanged', () => {
    const names = [
      'Test "Ext" Расширения',
      "Tom's Tabs",
      `It's "both"`,
      "Tom's C:\\new",
      'Costs $5 or $HOME # not a comment',
      'Plain',
    ];
    const text = names.map((name, index) => `VITE_N${String(index)}=${formatEnvValue(name)}`);
    writeFileSync(join(dir, '.env'), `${text.join('\n')}\n`);
    const env = loadEnv('production', dir, 'VITE_');
    expect(names.map((_, index) => env[`VITE_N${String(index)}`])).toEqual(names);
  });

  it('replaces existing keys, keeps comments and appends missing keys', () => {
    const text = '# Name\nVITE_EXTENSION_NAME=Old\n# Version\nVITE_EXTENSION_VERSION=9.9\n';
    expect(
      setEnvValues(text, { VITE_EXTENSION_NAME: 'New One', VITE_STORAGE_NAMESPACE: 'new-one' }),
    ).toBe(
      "# Name\nVITE_EXTENSION_NAME='New One'\n# Version\nVITE_EXTENSION_VERSION=9.9\nVITE_STORAGE_NAMESPACE=new-one\n",
    );
  });
});

describe('createExtension', () => {
  let root: string;

  function write(path: string, content: string): void {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'workspace-test-'));
    write('package.json', '{ "name": "app", "workspaces": ["*/"] }\n');
    write(
      'template-extension/package.json',
      '{ "name": "template-extension", "version": "0.0.0", "private": true }\n',
    );
    write('template-extension/README.md', '# Template Extension\n\nAbout it.\n');
    write(
      'template-extension/.env.example',
      "# Name\nVITE_EXTENSION_NAME='Template Extension'\nVITE_EXTENSION_DESCRIPTION='Does things.'\nVITE_EXTENSION_VERSION=1.4.0\nVITE_STORAGE_NAMESPACE=template-extension\n",
    );
    write('template-extension/.env', 'VITE_EXTENSION_NAME=Local\n');
    write('template-extension/src/main.ts', 'export {};\n');
    write('template-extension/dist/manifest.json', '{}\n');
    write('template-extension/extension.zip', 'zip');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('copies the template into a folder named after the extension', () => {
    const created = createExtension({ root, name: '  Tab Organizer ' });
    expect(created).toEqual({
      name: 'Tab Organizer',
      folder: 'tab-organizer',
      dir: join(root, 'tab-organizer'),
    });

    const read = (path: string): string => readFileSync(join(created.dir, path), 'utf8');
    expect(read('src/main.ts')).toBe('export {};\n');
    expect(existsSync(join(created.dir, 'dist'))).toBe(false);
    expect(existsSync(join(created.dir, 'extension.zip'))).toBe(false);
    expect(JSON.parse(read('package.json'))).toEqual({
      name: 'tab-organizer',
      version: '0.0.0',
      private: true,
    });
    expect(read('README.md')).toBe('# Tab Organizer\n\nAbout it.\n');

    const expectedEnv =
      "# Name\nVITE_EXTENSION_NAME='Tab Organizer'\nVITE_EXTENSION_DESCRIPTION='Does things.'\nVITE_EXTENSION_VERSION=0.1.0\nVITE_STORAGE_NAMESPACE=tab-organizer\n";
    expect(read('.env.example')).toBe(expectedEnv);
    expect(read('.env')).toBe(expectedEnv);
    // The template itself is untouched.
    expect(readFileSync(join(root, 'template-extension/.env'), 'utf8')).toBe(
      'VITE_EXTENSION_NAME=Local\n',
    );
  });

  it('uses a Cyrillic name for Chrome and a transliterated folder', () => {
    const created = createExtension({ root, name: 'Test "Ext" Расширения' });
    expect(created.folder).toBe('test-ext-rasshireniia');
    expect(loadEnv('production', created.dir, 'VITE_').VITE_EXTENSION_NAME).toBe(
      'Test "Ext" Расширения',
    );
  });

  it('accepts an explicit folder', () => {
    expect(createExtension({ root, name: '🙂', folder: 'smile' }).folder).toBe('smile');
    expect(() => createExtension({ root, name: '🙂' })).toThrow('--folder');
  });

  it('leaves nothing behind when the name cannot be written to .env', () => {
    expect(() => createExtension({ root, name: `It's "all" \`three\``, folder: 'quotes' })).toThrow(
      'all three quote characters',
    );
    expect(existsSync(join(root, 'quotes'))).toBe(false);
  });

  it('refuses existing folders and package names', () => {
    createExtension({ root, name: 'Tab Organizer' });
    expect(() => createExtension({ root, name: 'Tab Organizer' })).toThrow('already exists');
    expect(() => createExtension({ root, name: 'Template', folder: 'template-extension' })).toThrow(
      'already exists',
    );
    write('other/package.json', '{ "name": "taken" }\n');
    expect(() => createExtension({ root, name: 'Taken' })).toThrow('already named "taken"');
  });
});
