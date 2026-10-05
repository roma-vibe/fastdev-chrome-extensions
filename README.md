# Chrome Extensions

An npm workspace for several Chrome extensions (Manifest V3, Vue 3, Tailwind CSS 4, TypeScript) that share one node_modules and one package-lock.json. The included template extension opens in the side panel or as a popup and has a service worker, Pinia stores, services over chrome.storage.local, a manifest generated from its own .env, a Notes example with tests and a zero-warning quality gate (ESLint, Prettier, vue-tsc, Vitest). `npm run new -- "Name"` copies it into a new extension; Dev rebuilds every extension for Load unpacked in Chrome, and Package zips them for the Chrome Web Store.

This repository is a [fastDev](https://github.com/roma-vibe/fastDev) project skeleton (`chrome-extensions`). fastDev lists it
from a registry, downloads it when first used and creates named, ready-to-run projects from it.

- `template.toml` — the manifest: requirements, options, env, setup steps and commands.
- `files/` — the files of a new project (`*.tmpl` files are rendered with the project name and options).
- `CHANGELOG.md` — what changed in every version.

Versions are the `vX.Y.Z` tags of this repository and never change once published.
