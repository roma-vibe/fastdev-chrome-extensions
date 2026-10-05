import vue from '@vitejs/plugin-vue';
import { defineProject } from 'vitest/config';

// This extension's test project; `npm test` in the workspace root runs it with all others.
// The project name defaults to the "name" in package.json.
export default defineProject({
  plugins: [vue()],
  // Keep caches in the shared root node_modules (the extension has no node_modules of its own).
  cacheDir: '../node_modules/.vite',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', '*.test.ts'],
    // Fixed settings instead of .env, so tests do not depend on local values.
    env: {
      VITE_EXTENSION_NAME: 'Test Extension',
      VITE_EXTENSION_DESCRIPTION: 'Test description',
      VITE_EXTENSION_VERSION: '1.0.0',
      VITE_STORAGE_NAMESPACE: 'test-extension',
    },
  },
});
