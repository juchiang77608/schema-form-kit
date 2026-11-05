import { defineConfig } from 'vitest/config';

// Root config: each package declares its own project (environment, plugins).
export default defineConfig({
  test: {
    projects: ['packages/core', 'packages/renderer'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**'],
      reporter: ['text', 'html', 'json-summary'],
    },
  },
});
