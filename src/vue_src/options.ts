import '@/assets/main.css';
import { createApp } from 'vue';
import OptionsPage from '@/OptionsPage.vue';

document.documentElement.classList.add('optionsDocument');

const app = createApp(OptionsPage);
app.mount('#app');
