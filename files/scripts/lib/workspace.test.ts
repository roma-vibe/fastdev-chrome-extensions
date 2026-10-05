import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listExtensions, listWorkspaces, selectExtensions, workspaceName } from './workspace.ts';

describe('workspace helpers', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'workspace-test-'));
    for (const folder of ['tab-organizer', 'template-extension', 'node_modules', '.hidden']) {
      mkdirSync(join(root, folder));
      writeFileSync(join(root, folder, 'package.json'), '{}');
      writeFileSync(join(root, folder, 'manifest.config.ts'), '');
    }
    // A shared library workspace is not an extension.
    mkdirSync(join(root, 'shared'));
    writeFileSync(join(root, 'shared', 'package.json'), '{}');
    mkdirSync(join(root, 'scripts'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('lists the workspaces and the extensions among them', () => {
    expect(listWorkspaces(root)).toEqual(['shared', 'tab-organizer', 'template-extension']);
    expect(listExtensions(root)).toEqual(['tab-organizer', 'template-extension']);
  });

  it('selects all extensions or the named ones', () => {
    const all = ['tab-organizer', 'template-extension'];
    expect(selectExtensions(all, [])).toEqual(all);
    expect(selectExtensions(all, ['tab-organizer/', 'tab-organizer'])).toEqual(['tab-organizer']);
    expect(() => selectExtensions(all, ['nope'])).toThrow(
      'Unknown extension folder: nope. Available: tab-organizer, template-extension.',
    );
  });

  it('reads the workspace name from the root .env', () => {
    expect(workspaceName(root)).toBeUndefined();
    writeFileSync(join(root, '.env'), `APP_NAME='Test "Ext" Расширения'\n`);
    expect(workspaceName(root)).toBe('Test "Ext" Расширения');
  });
});
