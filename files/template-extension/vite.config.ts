import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import {
  APP_PAGE,
  createManifest,
  readExtensionSettings,
  SERVICE_WORKER_FILE,
} from './manifest.config.ts';

/** This extension's folder: .env, index.html and dist/ are resolved from here. */
const extensionDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  ensureEnvFile();
  // Only VITE_* keys are read; they also reach the app as import.meta.env.VITE_*.
  const settings = readExtensionSettings(loadEnv(mode, extensionDir, 'VITE_'));

  return {
    root: extensionDir,
    envDir: extensionDir,
    // Keep caches in the shared root node_modules (the extension has no node_modules of its own).
    cacheDir: '../node_modules/.vite',
    plugins: [vue(), tailwindcss(), manifestPlugin(createManifest(settings))],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rolldownOptions: {
        input: {
          index: fileURLToPath(new URL(APP_PAGE, import.meta.url)),
          'service-worker': fileURLToPath(
            new URL('src/background/service-worker.ts', import.meta.url),
          ),
        },
        output: {
          // manifest.json points to the service worker by a fixed name.
          entryFileNames: (chunk): string =>
            chunk.name === 'service-worker' ? SERVICE_WORKER_FILE : 'assets/[name]-[hash].js',
        },
      },
    },
  };
});

/** A fresh clone has no .env (it is git-ignored): start from the committed .env.example. */
function ensureEnvFile(): void {
  const envFile = fileURLToPath(new URL('.env', import.meta.url));
  const exampleFile = fileURLToPath(new URL('.env.example', import.meta.url));
  if (!existsSync(envFile) && existsSync(exampleFile)) {
    copyFileSync(exampleFile, envFile);
    console.info(`Created ${envFile} from .env.example`);
  }
}

/** Writes manifest.json into dist/ next to the built pages. */
function manifestPlugin(manifest: chrome.runtime.ManifestV3): Plugin {
  return {
    name: 'extension-manifest',
    generateBundle(): void {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
    },
  };
}
