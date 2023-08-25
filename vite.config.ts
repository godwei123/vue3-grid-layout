import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      outputDir: 'dist',
      tsConfigFilePath: './tsconfig.json'
    })
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: 'packages/index.ts',
      name: 'vue3-grid-layout',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
