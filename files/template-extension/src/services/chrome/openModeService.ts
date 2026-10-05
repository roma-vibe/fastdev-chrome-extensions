import { extensionConfig } from '../../config/extensionConfig';

/** How the toolbar button opens the extension. */
export type OpenMode = 'popup' | 'sidepanel';

/** chrome.storage.local key of the selected mode (read by the service worker on startup). */
export const OPEN_MODE_KEY = 'openMode';

/**
 * The popup shows the side panel's page (see manifest.config.ts); `?popup` gives it a fixed width,
 * because Chrome sizes popups to their content (src/main.ts, src/app.css).
 */
export const POPUP_PAGE = 'index.html?popup';

export async function readOpenMode(): Promise<OpenMode> {
  const result = await chrome.storage.local.get(OPEN_MODE_KEY);
  return result[OPEN_MODE_KEY] === 'popup' ? 'popup' : 'sidepanel';
}

/** Makes the toolbar button open the popup or the side panel. Used by the UI and the service worker. */
export async function applyOpenMode(mode: OpenMode): Promise<void> {
  await chrome.action.setPopup({ popup: mode === 'popup' ? POPUP_PAGE : '' });
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: mode === 'sidepanel' });
  await chrome.action.setTitle({
    title: `${extensionConfig.name}: open the ${mode === 'popup' ? 'popup' : 'side panel'}`,
  });
}

export async function setOpenMode(mode: OpenMode): Promise<void> {
  await applyOpenMode(mode);
  await chrome.storage.local.set({ [OPEN_MODE_KEY]: mode });
}

/** Called from the side panel: closes it and shows the same page as a popup. */
export async function switchToPopup(): Promise<void> {
  await setOpenMode('popup');
  const currentWindow = await chrome.windows.getCurrent();
  if (currentWindow.id === undefined) throw new Error('The current window has no id');
  await chrome.sidePanel.close({ windowId: currentWindow.id });
  await chrome.action.openPopup();
}

/** Called from the popup: opens the side panel and closes the popup. */
export async function switchToSidePanel(): Promise<void> {
  await setOpenMode('sidepanel');
  await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  window.close();
}
