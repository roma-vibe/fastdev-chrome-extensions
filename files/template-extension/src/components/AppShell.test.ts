import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { stubChrome } from '../test/chromeStub';
import AppShell from './AppShell.vue';

describe('AppShell', () => {
  let stub: ReturnType<typeof stubChrome>;

  beforeEach(() => {
    stub = stubChrome();
  });

  it('shows the extension name from .env and switches to the popup', async () => {
    const wrapper = mount(AppShell, {
      global: { plugins: [createPinia()], stubs: { FontAwesomeIcon: true, RouterView: true } },
    });
    await flushPromises();
    expect(wrapper.get('h1').text()).toBe('Test Extension');

    const toggle = wrapper.get('button[aria-label="Open in a popup instead"]');
    await toggle.trigger('click');
    await flushPromises();
    expect(stub.chrome.action.openPopup).toHaveBeenCalled();
    expect(wrapper.find('button[aria-label="Open in the side panel instead"]').exists()).toBe(true);
  });
});
