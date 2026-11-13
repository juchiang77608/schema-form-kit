import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const repo = 'https://github.com/juchiang77608/schema-form-kit';

export default defineConfig({
  title: 'schema-form-kit',
  description:
    'JSON-driven forms for Vue 3 with conditional logic, validation and a visual builder.',
  lang: 'en',
  cleanUrls: true,
  lastUpdated: true,
  head: [['meta', { name: 'theme-color', content: '#4f46e5' }]],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Playground', link: 'https://forms.janicechiang.dev' },
      { text: 'Builder', link: 'https://forms.janicechiang.dev/#/builder' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Schema and fields', link: '/guide/schema' },
          { text: 'Conditions', link: '/guide/conditions' },
          { text: 'Validation', link: '/guide/validation' },
          { text: 'Steps and repeatable groups', link: '/guide/steps-and-groups' },
          { text: 'Customization', link: '/guide/customization' },
          { text: 'Visual builder', link: '/guide/builder' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'API', link: '/api/' },
          { text: 'Design decisions (ADR)', link: `${repo}/tree/main/docs/adr` },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: repo }],
    editLink: {
      pattern: `${repo}/edit/main/apps/docs/:path`,
      text: 'Edit this page on GitHub',
    },
    search: { provider: 'local' },
    footer: { message: 'Released under the MIT License.', copyright: '© Janice Chiang' },
  },

  vite: {
    resolve: {
      // Live examples use the package sources, so the docs never need a prior library build.
      alias: [
        { find: '@schema-form-kit/core', replacement: src('../../../packages/core/src/index.ts') },
        {
          find: '@schema-form-kit/vue/styles.css',
          replacement: src('../../../packages/renderer/src/styles.css'),
        },
        {
          find: '@schema-form-kit/vue',
          replacement: src('../../../packages/renderer/src/index.ts'),
        },
      ],
      dedupe: ['vue'],
    },
  },
});
