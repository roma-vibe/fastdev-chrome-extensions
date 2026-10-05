<script setup lang="ts">
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { onMounted, ref } from 'vue';
import { useNotesStore } from '../stores/useNotesStore';

const notesStore = useNotesStore();
const draft = ref('');

onMounted(() => notesStore.load());

async function submitNote(): Promise<void> {
  await notesStore.addNote(draft.value);
  if (!notesStore.error) draft.value = '';
}
</script>

<template>
  <section class="mt-4 space-y-4">
    <p class="text-sm text-slate-500 dark:text-slate-400">
      Notes are saved in chrome.storage.local.
    </p>
    <form class="grid gap-2" @submit.prevent="submitNote">
      <textarea
        v-model="draft"
        class="w-full resize-y rounded-md border border-slate-300 bg-transparent p-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700"
        aria-label="Note"
        placeholder="Write a note…"
        rows="4"
      />
      <button
        class="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        type="submit"
      >
        <FontAwesomeIcon :icon="faPlus" />
        Add note
      </button>
    </form>
    <p v-if="notesStore.error" class="text-sm text-red-600 dark:text-red-400" role="alert">
      {{ notesStore.error }}
    </p>
    <p
      v-if="!notesStore.isLoading && notesStore.items.length === 0"
      class="text-sm text-slate-500 dark:text-slate-400"
    >
      No notes yet.
    </p>
    <ul v-else class="grid gap-2 p-0">
      <li
        v-for="note in notesStore.items"
        :key="note.id"
        class="flex items-start justify-between gap-2 rounded-md border border-slate-200 p-2 text-sm dark:border-slate-800"
      >
        <span class="break-words whitespace-pre-wrap">{{ note.text }}</span>
        <button
          class="shrink-0 rounded p-1 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
          type="button"
          aria-label="Delete note"
          title="Delete note"
          @click="notesStore.removeNote(note.id)"
        >
          <FontAwesomeIcon :icon="faTrash" />
        </button>
      </li>
    </ul>
  </section>
</template>
