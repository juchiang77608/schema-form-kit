import { createApp, h, ref } from 'vue';
import '@schema-form-kit/vue/styles.css';
import '@schema-form-kit/builder/styles.css';
import App from './App.vue';
import BuilderPage from './BuilderPage.vue';

// Two pages without a router: #/ is the playground, #/builder is the visual builder.
const route = ref(window.location.hash);
window.addEventListener('hashchange', () => (route.value = window.location.hash));

createApp({
  render: () => h(route.value.startsWith('#/builder') ? BuilderPage : App),
}).mount('#app');
