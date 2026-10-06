# Template Extension

A Chrome extension (Manifest V3) built with Vue 3, Pinia, Vue Router, Tailwind CSS 4 and Font Awesome. The toolbar button opens it in the side panel; the ⇄ button in its header switches to a popup and back. The example Notes page keeps its data in `chrome.storage.local`.

This folder is one workspace of the repository: its dependencies come from the root `package.json` and the shared root `node_modules`. The root `README.md` and `AGENTS.md` describe the whole workspace.

## Settings

`.env` holds the settings of this extension and is git-ignored; `.env.example` is the committed copy with the same keys. `npm run build` creates `.env` from `.env.example` when it is missing. `manifest.config.ts` turns the settings into `dist/manifest.json` and checks Chrome's limits on every build.

| Key                          | Use                                                                        |
| ---------------------------- | -------------------------------------------------------------------------- |
| `VITE_EXTENSION_NAME`        | Name in Chrome, in the Chrome Web Store and in the header (≤ 75 characters) |
| `VITE_EXTENSION_DESCRIPTION` | Description on `chrome://extensions` and in the store (≤ 132 characters)    |
| `VITE_EXTENSION_VERSION`     | Version, 1–4 dot-separated numbers; raise it for every store upload        |

Every `VITE_*` value is built into the extension and readable by anyone who installs it: never put secrets here.

## Commands

Run them in the workspace root (replace `<folder>` with this folder's name):

```sh
npm run build -w <folder>      # build into dist/
npm run dev -- <folder>        # rebuild dist/ on every change
npm test -w <folder>           # this extension's tests
npm run package -- <folder>    # build, then zip dist/ into extension.zip for the Chrome Web Store
```

## Load in Chrome

1. Build it (see above).
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and select this folder's `dist/` (not the folder itself).
3. Click the extension's toolbar button (pin it through the puzzle icon) to open the side panel.
4. After every rebuild, click **Reload** on the extension's card and reopen the panel. The service worker's console is under **Inspect views: service worker**; right-click inside the side panel and choose **Inspect** for the page's DevTools.

## Structure

- `manifest.config.ts` — the manifest (permissions, entry points, icons) and the checks of the settings.
- `vite.config.ts` — builds `index.html` and the service worker into `dist/` and writes `manifest.json`.
- `index.html`, `src/main.ts`, `src/App.vue` — one page for the side panel and the popup.
- `src/components/` — reusable components; `AppShell.vue` is the header with the open-mode switch.
- `src/views/` — pages of the router; `src/router/` — Vue Router with hash history.
- `src/stores/` — Pinia stores, one per data domain.
- `src/services/chrome/` — calls to `chrome.*` APIs (how the extension opens).
- `src/services/storage/` — repositories on `chrome.storage.local`; keys do not depend on the extension name.
- `src/services/api/` — the single HTTP client for future API requests.
- `src/background/service-worker.ts` — the service worker.
- `src/config/extensionConfig.ts` — the settings from `.env` for the app code.
- `src/test/chromeStub.ts` — an in-memory `chrome.*` for tests; tests live next to the code (`*.test.ts`).
- `public/icons/` — 16, 32, 48 and 128 px icons and their SVG source: placeholders to replace before publishing.
