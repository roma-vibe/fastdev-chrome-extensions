/// <reference types="vite/client" />

import type { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Settings from this extension's .env; vite.config.ts checks that they are set.
declare global {
  interface ImportMetaEnv {
    readonly VITE_EXTENSION_NAME: string;
    readonly VITE_EXTENSION_DESCRIPTION: string;
    readonly VITE_EXTENSION_VERSION: string;
    readonly VITE_STORAGE_NAMESPACE: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// FontAwesomeIcon is registered globally in main.ts.
declare module 'vue' {
  interface GlobalComponents {
    FontAwesomeIcon: typeof FontAwesomeIcon;
  }
}
