/**
 * manifest.json of this extension, generated at build time from .env (see vite.config.ts).
 * Change permissions, entry points and icons here; the checks below run on every build.
 */

/** The .env keys this extension reads (documented in .env.example). */
export interface ExtensionSettings {
  readonly name: string;
  readonly description: string;
  readonly version: string;
}

/** Output file of the service worker entry (src/background/service-worker.ts), see vite.config.ts. */
export const SERVICE_WORKER_FILE = 'service-worker.js';

/** The page shown in the side panel and in the popup. */
export const APP_PAGE = 'index.html';

// Limits enforced by Chrome and the Chrome Web Store.
const MAX_NAME_LENGTH = 75;
const MAX_DESCRIPTION_LENGTH = 132;
const VERSION_PATTERN = /^(0|[1-9]\d{0,4})(\.(0|[1-9]\d{0,4})){0,3}$/;

/** Reads and validates the extension settings; throws one error that lists every problem. */
export function readExtensionSettings(env: Record<string, string | undefined>): ExtensionSettings {
  const settings: ExtensionSettings = {
    name: env.VITE_EXTENSION_NAME?.trim() ?? '',
    description: env.VITE_EXTENSION_DESCRIPTION?.trim() ?? '',
    version: env.VITE_EXTENSION_VERSION?.trim() ?? '',
  };

  const problems: string[] = [];
  if (!settings.name) problems.push('VITE_EXTENSION_NAME is empty');
  if (settings.name.length > MAX_NAME_LENGTH) {
    problems.push(`VITE_EXTENSION_NAME is longer than ${String(MAX_NAME_LENGTH)} characters`);
  }
  if (settings.description.length > MAX_DESCRIPTION_LENGTH) {
    problems.push(
      `VITE_EXTENSION_DESCRIPTION is longer than ${String(MAX_DESCRIPTION_LENGTH)} characters`,
    );
  }
  if (!isValidVersion(settings.version)) {
    problems.push(
      `VITE_EXTENSION_VERSION "${settings.version}" must be 1-4 dot-separated numbers (0-65535)`,
    );
  }

  if (problems.length > 0) {
    throw new Error(`Invalid extension settings in .env: ${problems.join('; ')}.`);
  }
  return settings;
}

function isValidVersion(version: string): boolean {
  return VERSION_PATTERN.test(version) && version.split('.').every((part) => Number(part) <= 65535);
}

const ICONS = {
  '16': 'icons/icon16.png',
  '32': 'icons/icon32.png',
  '48': 'icons/icon48.png',
  '128': 'icons/icon128.png',
};

/**
 * Manifest V3 with the smallest set of permissions the template needs:
 * `sidePanel` for the side panel and `storage` for chrome.storage.local.
 * Add permissions, host_permissions and content_scripts only when a feature needs them.
 */
export function createManifest(settings: ExtensionSettings): chrome.runtime.ManifestV3 {
  return {
    manifest_version: 3,
    name: settings.name,
    version: settings.version,
    description: settings.description,
    // chrome.sidePanel.close(), used when switching to the popup, exists since Chrome 141.
    minimum_chrome_version: '141',
    icons: ICONS,
    action: { default_title: settings.name, default_icon: ICONS },
    side_panel: { default_path: APP_PAGE },
    background: { service_worker: SERVICE_WORKER_FILE, type: 'module' },
    permissions: ['sidePanel', 'storage'],
  };
}
