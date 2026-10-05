import { createRouter, createWebHashHistory } from 'vue-router';
import NotesView from '../views/NotesView.vue';

// Hash history: extension pages are static files, so the path must stay index.html.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/notes' },
    { path: '/notes', name: 'notes', component: NotesView },
  ],
});

export default router;
