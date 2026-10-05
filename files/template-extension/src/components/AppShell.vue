<script setup lang="ts">
import { faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { computed, onMounted } from 'vue';
import { extensionConfig } from '../config/extensionConfig';
import { useUiStore } from '../stores/useUiStore';

const uiStore = useUiStore();

const toggleLabel = computed(() =>
  uiStore.isSidePanel ? 'Open in a popup instead' : 'Open in the side panel instead',
);

onMounted(() => uiStore.loadOpenMode());
</script>

<template>
  <main class="min-w-60 p-4 text-slate-900 dark:text-slate-100">
    <header class="flex items-center justify-between gap-4">
      <h1 class="text-xl font-semibold">
        {{ extensionConfig.name }}
      </h1>
      <button
        class="rounded-md p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
        type="button"
        :aria-label="toggleLabel"
        :title="toggleLabel"
        :disabled="uiStore.isLoading"
        @click="uiStore.toggleOpenMode"
      >
        <FontAwesomeIcon :icon="faArrowRightArrowLeft" />
      </button>
    </header>
    <p v-if="uiStore.error" class="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
      {{ uiStore.error }}
    </p>
    <RouterView />
  </main>
</template>
