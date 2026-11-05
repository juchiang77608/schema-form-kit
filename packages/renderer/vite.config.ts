import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Tests and type-checks use the core sources directly (no build step needed).
      '@schema-form-kit/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', '@schema-form-kit/core'],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    name: 'renderer',
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
});
