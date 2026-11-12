import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      // Tests use package sources directly (no build step needed).
      { find: '@schema-form-kit/core', replacement: src('../core/src/index.ts') },
      { find: '@schema-form-kit/builder-core', replacement: src('../builder-core/src/index.ts') },
      { find: '@schema-form-kit/vue', replacement: src('../renderer/src/index.ts') },
    ],
  },
  build: {
    lib: { entry: { index: 'src/index.ts' }, formats: ['es'] },
    rollupOptions: {
      external: [
        'vue',
        '@schema-form-kit/core',
        '@schema-form-kit/vue',
        '@schema-form-kit/builder-core',
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    name: 'builder',
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
});
