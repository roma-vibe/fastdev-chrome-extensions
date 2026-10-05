import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { extensionConfig } from './config/extensionConfig';
import router from './router';
import './app.css';

// One page for the side panel and the popup; the popup is opened as index.html?popup.
document.title = extensionConfig.name;
if (new URLSearchParams(location.search).has('popup')) {
  document.documentElement.classList.add('popup');
}

createApp(App)
  .component('FontAwesomeIcon', FontAwesomeIcon)
  .use(createPinia())
  .use(router)
  .mount('#app');
