import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    crx({
      manifest: './public/manifest.json'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './core'),
      '@ai': resolve(__dirname, './ai'),
      '@flows': resolve(__dirname, './flows'),
      '@adapters': resolve(__dirname, './adapters')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: './src/background/index.ts',
        content: './src/content/index.ts',
        popup: './src/popup/index.ts',
        options: './src/options/index.ts'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
