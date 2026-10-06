import { describe, expect, it } from 'vitest';
import { createManifest, readExtensionSettings } from './manifest.config.ts';

const env = {
  VITE_EXTENSION_NAME: ' Tab Organizer ',
  VITE_EXTENSION_DESCRIPTION: 'Groups tabs.',
  VITE_EXTENSION_VERSION: '1.2.3',
};

describe('readExtensionSettings', () => {
  it('reads and trims the settings', () => {
    expect(readExtensionSettings(env)).toEqual({
      name: 'Tab Organizer',
      description: 'Groups tabs.',
      version: '1.2.3',
    });
  });

  it('lists every problem in one error', () => {
    expect(() =>
      readExtensionSettings({ VITE_EXTENSION_NAME: '', VITE_EXTENSION_VERSION: '1.02' }),
    ).toThrow(
      'VITE_EXTENSION_NAME is empty; VITE_EXTENSION_VERSION "1.02" must be 1-4 dot-separated numbers (0-65535)',
    );
  });

  it('enforces the limits of Chrome', () => {
    expect(() => readExtensionSettings({ ...env, VITE_EXTENSION_NAME: 'x'.repeat(76) })).toThrow(
      'longer than 75 characters',
    );
    expect(() => readExtensionSettings({ ...env, VITE_EXTENSION_VERSION: '1.2.3.4.5' })).toThrow(
      'VITE_EXTENSION_VERSION',
    );
    expect(() => readExtensionSettings({ ...env, VITE_EXTENSION_VERSION: '65536' })).toThrow(
      'VITE_EXTENSION_VERSION',
    );
    expect(
      readExtensionSettings({ ...env, VITE_EXTENSION_NAME: 'Я'.repeat(75) }).name,
    ).toHaveLength(75);
  });
});

describe('createManifest', () => {
  it('builds a Manifest V3 with the side panel, the service worker and minimal permissions', () => {
    const manifest = createManifest(readExtensionSettings(env));
    expect(manifest).toMatchObject({
      manifest_version: 3,
      name: 'Tab Organizer',
      version: '1.2.3',
      description: 'Groups tabs.',
      side_panel: { default_path: 'index.html' },
      background: { service_worker: 'service-worker.js', type: 'module' },
      permissions: ['sidePanel', 'storage'],
    });
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.content_scripts).toBeUndefined();
  });
});
