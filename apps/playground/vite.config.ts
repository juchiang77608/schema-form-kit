import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Use package sources so the playground never needs a prior library build.
    alias: [
      { find: '@schema-form-kit/core', replacement: src('../../packages/core/src/index.ts') },
      {
        find: '@schema-form-kit/vue/styles.css',
        replacement: src('../../packages/renderer/src/styles.css'),
      },
      { find: '@schema-form-kit/vue', replacement: src('../../packages/renderer/src/index.ts') },
    ],
  },
});
