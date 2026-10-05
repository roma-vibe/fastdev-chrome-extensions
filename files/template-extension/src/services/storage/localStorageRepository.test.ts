import { beforeEach, describe, expect, it } from 'vitest';
import { stubChrome } from '../../test/chromeStub';
import { createLocalStorageRepository } from './localStorageRepository';

describe('createLocalStorageRepository', () => {
  let storage: Map<string, unknown>;

  beforeEach(() => {
    ({ storage } = stubChrome());
  });

  it('returns a copy of the fallback value when the key is missing', async () => {
    const fallback = { value: 1 };
    const repository = createLocalStorageRepository('test', fallback);
    const value = await repository.get();
    expect(value).toEqual({ value: 1 });
    expect(value).not.toBe(fallback);
  });

  it('persists and reads values', async () => {
    const repository = createLocalStorageRepository<string[]>('test', []);
    await repository.set(['one', 'two']);
    await expect(repository.get()).resolves.toEqual(['one', 'two']);
    expect(storage.get('test')).toEqual(['one', 'two']);
  });

  it('removes values', async () => {
    const repository = createLocalStorageRepository('test', 'fallback');
    await repository.set('saved');
    await repository.remove();
    await expect(repository.get()).resolves.toBe('fallback');
  });

  it('moves a value from the old namespaced key to the plain key', async () => {
    // VITE_STORAGE_NAMESPACE is "test-extension" in tests (vitest.config.ts).
    storage.set('test-extension:test', 'legacy');
    const repository = createLocalStorageRepository('test', 'fallback');
    await expect(repository.get()).resolves.toBe('legacy');
    expect(storage.get('test')).toBe('legacy');
  });
});
