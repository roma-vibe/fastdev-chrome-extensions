/** Settings of this extension from its .env (VITE_* keys), replaced at build time by Vite. */
export interface ExtensionConfig {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly storageNamespace: string;
}

export const extensionConfig: ExtensionConfig = {
  name: import.meta.env.VITE_EXTENSION_NAME,
  description: import.meta.env.VITE_EXTENSION_DESCRIPTION,
  version: import.meta.env.VITE_EXTENSION_VERSION,
  storageNamespace: import.meta.env.VITE_STORAGE_NAMESPACE,
};
