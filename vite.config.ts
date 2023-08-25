import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [vue(), dts()],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: 'packages/index.ts', //指定组件编译入口文件
      name: 'vue3-grid-layout',
      fileName: (format) => `index.${format}.js` // 打包后的文件名
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
