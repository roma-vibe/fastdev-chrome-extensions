/**
 * The extension's service worker (manifest "background"). It restores how the toolbar button
 * opens the extension (popup or side panel) whenever Chrome starts it.
 * Keep it small: it has no DOM, and Chrome stops it when it is idle.
 */
import { applyOpenMode, OPEN_MODE_KEY, readOpenMode } from '../services/chrome/openModeService';

async function restoreOpenMode(): Promise<void> {
  try {
    await applyOpenMode(await readOpenMode());
  } catch (error) {
    console.error('Failed to apply the open mode:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => void restoreOpenMode());
chrome.runtime.onStartup.addListener(() => void restoreOpenMode());
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && OPEN_MODE_KEY in changes) void restoreOpenMode();
});

void restoreOpenMode();
