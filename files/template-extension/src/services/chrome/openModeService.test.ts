import { beforeEach, describe, expect, it } from 'vitest';
import { stubChrome } from '../../test/chromeStub';
import { OPEN_MODE_KEY, readOpenMode, setOpenMode, switchToPopup } from './openModeService';

describe('openModeService', () => {
  let stub: ReturnType<typeof stubChrome>;

  beforeEach(() => {
    stub = stubChrome();
  });

  it('opens the side panel by default', async () => {
    await expect(readOpenMode()).resolves.toBe('sidepanel');
    stub.storage.set(OPEN_MODE_KEY, 'popup');
    await expect(readOpenMode()).resolves.toBe('popup');
  });

  it('configures the toolbar button and remembers the mode', async () => {
    await setOpenMode('popup');
    expect(stub.chrome.action.setPopup).toHaveBeenCalledWith({ popup: 'index.html?popup' });
    expect(stub.chrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: false,
    });
    expect(stub.chrome.action.setTitle).toHaveBeenCalledWith({
      title: 'Test Extension: open the popup',
    });
    expect(stub.storage.get(OPEN_MODE_KEY)).toBe('popup');
  });

  it('switches from the side panel to the popup', async () => {
    await switchToPopup();
    expect(stub.chrome.sidePanel.close).toHaveBeenCalledWith({ windowId: 7 });
    expect(stub.chrome.action.openPopup).toHaveBeenCalled();
    expect(stub.storage.get(OPEN_MODE_KEY)).toBe('popup');
  });
});
