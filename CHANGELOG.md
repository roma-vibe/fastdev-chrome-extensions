# Changelog

## 1.0.0 — 2026-10-05

- Initial version: an npm workspace for several Chrome extensions (Manifest V3, Vue 3, Tailwind CSS 4, TypeScript 6.0) with one shared node_modules and one package-lock.json.
- template-extension: one page for the side panel and a 360 px popup with a ⇄ switch, a module service worker, Pinia stores, Vue Router, Font Awesome and services over chrome.storage.local.
- manifest.json is generated from each extension's .env and checked against Chrome's limits; permissions are only sidePanel and storage.
- New extension command (inputs: name, optional folder) and npm run new -- "Name": copy template-extension into a new folder, write its .env and .env.example, link it with npm install.
- Generic root scripts: dev (watch-builds every or the named extensions), build, typecheck, lint, format, test, check and package (dist zipped with manifest.json at the root).
- ESLint enforces the layers: views, components and stores cannot use chrome.*, fetch or web storage directly.
- Notes example with tests through every layer; Vitest projects for the scripts and every extension; zero-warning quality gate.
- Extension names with spaces, quotes, Cyrillic and $ work: npm run new quotes .env values and escapes $ for Vite's loadEnv; invalid names leave nothing behind.
- A missing extension .env is created from its .env.example (by fastDev at creation and by every build, e.g. after a git clone).
- Requirements: Node.js 24+, npm 10+, zip 3+ (Package) and Google Chrome 141+.
- Updates hold TypeScript below 6.1 (typescript-eslint support) and @types/node at 24.
- package.json records allowScripts (fsevents: false), so npm 11 installs without warnings.
- Russian translations of all manifest texts and command inputs; the preview builds the template extension and explains Load unpacked.
- Verified: a project named Test "Ext" Расширения plus a second extension from the New extension command (build, check, one node_modules); extensions loaded in headless Chrome 154 (service worker, side panel, notes, popup switch).
- npm run new avoids double quotes for names with \n or \r sequences (e.g. C:\new), which dotenv would turn into line breaks.
