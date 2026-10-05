import { defineStore } from 'pinia';
import { createLocalStorageRepository } from '../services/storage/localStorageRepository';

export interface Note {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
}

interface NotesState {
  items: Note[];
  isLoading: boolean;
  error: string | null;
}

const notesRepository = createLocalStorageRepository<Note[]>('notes', []);

/**
 * Notes of the example feature, persisted in chrome.storage.local through the repository.
 * Actions never throw: a failure is shown through `error`.
 */
export const useNotesStore = defineStore('notes', {
  state: (): NotesState => ({ items: [], isLoading: false, error: null }),
  actions: {
    async load(): Promise<void> {
      this.isLoading = true;
      this.error = null;
      try {
        this.items = await notesRepository.get();
      } catch (error) {
        console.error(error);
        this.error = 'Could not load the notes.';
      } finally {
        this.isLoading = false;
      }
    },
    async addNote(text: string): Promise<void> {
      const normalizedText = text.trim();
      if (!normalizedText) return;
      const note: Note = {
        id: crypto.randomUUID(),
        text: normalizedText,
        createdAt: new Date().toISOString(),
      };
      await this.persist([note, ...this.items], 'Could not save the note.');
    },
    async removeNote(id: string): Promise<void> {
      await this.persist(
        this.items.filter((note) => note.id !== id),
        'Could not delete the note.',
      );
    },
    /** Saves the whole list, then shows it; keeps the previous list when saving fails. */
    async persist(items: Note[], failureMessage: string): Promise<void> {
      this.error = null;
      try {
        this.items = await notesRepository.set(items);
      } catch (error) {
        console.error(error);
        this.error = failureMessage;
      }
    },
  },
});
