import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./vue_src', import.meta.url))
    },
  },
  build: {
    outDir :'../dist/',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(rootDir, 'index.html'),
        options: resolve(rootDir, 'options/options.html'),
      },
    },
  }
})
