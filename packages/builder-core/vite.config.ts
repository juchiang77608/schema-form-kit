import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@schema-form-kit/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
    rollupOptions: { external: ['@schema-form-kit/core'] },
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    name: 'builder-core',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
