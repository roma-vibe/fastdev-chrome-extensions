import { vi } from 'vitest';

/**
 * Replaces the global `chrome` with an in-memory stand-in for the APIs this extension uses.
 * `storage` holds what chrome.storage.local would; values are copied like Chrome serializes them.
 */
export function stubChrome() {
  const storage = new Map<string, unknown>();
  const keyList = (keys: string | string[]): string[] => (Array.isArray(keys) ? keys : [keys]);
  const resolved = () => vi.fn(() => Promise.resolve());

  const chrome = {
    storage: {
      local: {
        get: vi.fn((keys: string | string[]) =>
          Promise.resolve(
            Object.fromEntries(
              keyList(keys)
                .filter((key) => storage.has(key))
                .map((key) => [key, storage.get(key)]),
            ),
          ),
        ),
        set: vi.fn((values: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(values)) {
            storage.set(key, JSON.parse(JSON.stringify(value)));
          }
          return Promise.resolve();
        }),
        remove: vi.fn((keys: string | string[]) => {
          for (const key of keyList(keys)) storage.delete(key);
          return Promise.resolve();
        }),
      },
    },
    action: { setPopup: resolved(), setTitle: resolved(), openPopup: resolved() },
    sidePanel: { setPanelBehavior: resolved(), open: resolved(), close: resolved() },
    windows: {
      WINDOW_ID_CURRENT: -2,
      getCurrent: vi.fn(() => Promise.resolve({ id: 7 })),
    },
  };

  vi.stubGlobal('chrome', chrome);
  return { storage, chrome };
}
