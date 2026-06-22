import '@/assets/main.css'
import { createApp } from 'vue';
import App from '@/App.vue' ;

document.documentElement.classList.add('popupDocument');

const app = createApp(App)
app.mount('#app')
