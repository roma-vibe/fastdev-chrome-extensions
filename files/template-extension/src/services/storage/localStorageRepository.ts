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
  return {
    async get(): Promise<T> {
      const result = await chrome.storage.local.get(key);
      return (result[key] as T | undefined) ?? structuredClone(fallbackValue);
    },
    async set(value: T): Promise<T> {
      await chrome.storage.local.set({ [key]: value });
      return value;
    },
    async remove(): Promise<void> {
      await chrome.storage.local.remove(key);
    },
  };
}
