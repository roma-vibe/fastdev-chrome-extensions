import { defineStore } from 'pinia';
import {
  type OpenMode,
  readOpenMode,
  switchToPopup,
  switchToSidePanel,
} from '../services/chrome/openModeService';

interface UiState {
  openMode: OpenMode;
  isLoading: boolean;
  error: string | null;
}

/** UI state shared by every view: how the extension opens (side panel or popup). */
export const useUiStore = defineStore('ui', {
  state: (): UiState => ({ openMode: 'sidepanel', isLoading: false, error: null }),
  getters: {
    isSidePanel: (state): boolean => state.openMode === 'sidepanel',
  },
  actions: {
    async loadOpenMode(): Promise<void> {
      try {
        this.openMode = await readOpenMode();
      } catch (error) {
        console.error(error);
      }
    },
    async toggleOpenMode(): Promise<void> {
      this.isLoading = true;
      this.error = null;
      try {
        if (this.isSidePanel) {
          await switchToPopup();
          this.openMode = 'popup';
        } else {
          await switchToSidePanel();
          this.openMode = 'sidepanel';
        }
      } catch (error) {
        console.error(error);
        this.error = 'Could not switch how the extension opens.';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
