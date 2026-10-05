import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { stubChrome } from '../test/chromeStub';
import NotesView from './NotesView.vue';

function mountView(): ReturnType<typeof mount> {
  return mount(NotesView, {
    global: { plugins: [createPinia()], stubs: { FontAwesomeIcon: true } },
  });
}

describe('NotesView', () => {
  let stub: ReturnType<typeof stubChrome>;

  beforeEach(() => {
    stub = stubChrome();
  });

  it('shows the saved notes', async () => {
    stub.storage.set('notes', [{ id: '1', text: 'Saved', createdAt: '2026-01-01T00:00:00.000Z' }]);
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.findAll('li').map((item) => item.text())).toEqual(['Saved']);
  });

  it('adds and deletes a note', async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.text()).toContain('No notes yet.');

    await wrapper.get('textarea').setValue('Buy milk');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.findAll('li').map((item) => item.text())).toEqual(['Buy milk']);
    expect(wrapper.get<HTMLTextAreaElement>('textarea').element.value).toBe('');

    await wrapper.get('button[aria-label="Delete note"]').trigger('click');
    await flushPromises();
    expect(wrapper.findAll('li')).toHaveLength(0);
    expect(stub.storage.get('notes')).toEqual([]);
  });
});
