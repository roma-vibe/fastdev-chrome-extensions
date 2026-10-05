import { extensionConfig } from '../../config/extensionConfig';

/** A value persisted in chrome.storage.local under one key. */
export interface StorageRepository<T> {
  get(): Promise<T>;
  set(value: T): Promise<T>;
  remove(): Promise<void>;
}

export function createLocalStorageRepository<T>(
  key: string,
  fallbackValue: T,
): StorageRepository<T> {
  // chrome.storage.local is already isolated per extension id, so the extension name must not be
  // part of the key: otherwise renaming the extension in .env would start with empty storage.
  // Values saved by older versions under "<namespace>:<key>" are moved to the plain key.
  const storageKey = key;
  const legacyStorageKey = `${extensionConfig.storageNamespace}:${key}`;

  return {
    async get(): Promise<T> {
      const result = await chrome.storage.local.get([storageKey, legacyStorageKey]);
      const value = result[storageKey] as T | undefined;
      if (value !== undefined) return value;

      const legacyValue = result[legacyStorageKey] as T | undefined;
      if (legacyValue !== undefined) {
        await chrome.storage.local.set({ [storageKey]: legacyValue });
        return legacyValue;
      }

      return structuredClone(fallbackValue);
    },
    async set(value: T): Promise<T> {
      await chrome.storage.local.set({ [storageKey]: value });
      return value;
    },
    async remove(): Promise<void> {
      await chrome.storage.local.remove([storageKey, legacyStorageKey]);
    },
  };
}
