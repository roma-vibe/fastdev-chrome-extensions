import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stubChrome } from '../test/chromeStub';
import { useNotesStore } from './useNotesStore';

describe('useNotesStore', () => {
  let stub: ReturnType<typeof stubChrome>;

  beforeEach(() => {
    stub = stubChrome();
    setActivePinia(createPinia());
  });

  it('loads the saved notes', async () => {
    stub.storage.set('notes', [{ id: '1', text: 'Saved', createdAt: '2026-01-01T00:00:00.000Z' }]);
    const store = useNotesStore();
    await store.load();
    expect(store.items.map((note) => note.text)).toEqual(['Saved']);
    expect(store.error).toBeNull();
  });

  it('adds trimmed notes to the top and saves them', async () => {
    const store = useNotesStore();
    await store.addNote('First');
    await store.addNote('  Second  ');
    await store.addNote('   ');
    expect(store.items.map((note) => note.text)).toEqual(['Second', 'First']);
    expect(stub.storage.get('notes')).toHaveLength(2);
  });

  it('removes notes', async () => {
    const store = useNotesStore();
    await store.addNote('Keep');
    await store.addNote('Drop');
    const drop = store.items.find((note) => note.text === 'Drop');
    await store.removeNote(drop?.id ?? '');
    expect(store.items.map((note) => note.text)).toEqual(['Keep']);
  });

  it('keeps the list and reports an error when saving fails', async () => {
    const store = useNotesStore();
    await store.addNote('Saved');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stub.chrome.storage.local.set.mockRejectedValueOnce(new Error('quota'));
    await store.addNote('Lost');
    expect(store.items.map((note) => note.text)).toEqual(['Saved']);
    expect(store.error).toBe('Could not save the note.');
  });
});
