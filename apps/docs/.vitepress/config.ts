import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const repo = 'https://github.com/juchiang77608/schema-form-kit';
const editPattern = `${repo}/edit/main/apps/docs/:path`;

const enNav = [
  { text: 'Guide', link: '/guide/getting-started' },
  { text: 'API', link: '/api/' },
  { text: 'Playground', link: 'https://forms.janicechiang.dev' },
  { text: 'Builder', link: 'https://forms.janicechiang.dev/#/builder' },
];

const zhNav = [
  { text: '指南', link: '/zh/guide/getting-started' },
  { text: 'API', link: '/zh/api/' },
  { text: 'Playground', link: 'https://forms.janicechiang.dev' },
  { text: '編輯器', link: 'https://forms.janicechiang.dev/#/builder' },
];

const enSidebar = [
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
];

const zhSidebar = [
  {
    text: '指南',
    items: [
      { text: '開始使用', link: '/zh/guide/getting-started' },
      { text: 'Schema 與欄位', link: '/zh/guide/schema' },
      { text: '條件', link: '/zh/guide/conditions' },
      { text: '驗證', link: '/zh/guide/validation' },
      { text: '步驟與可重複群組', link: '/zh/guide/steps-and-groups' },
      { text: '自訂', link: '/zh/guide/customization' },
      { text: '視覺化編輯器', link: '/zh/guide/builder' },
    ],
  },
  {
    text: '參考',
    items: [
      { text: 'API', link: '/zh/api/' },
      { text: '設計決策（ADR）', link: `${repo}/tree/main/docs/adr` },
    ],
  },
];

export default defineConfig({
  title: 'schema-form-kit',
  cleanUrls: true,
  lastUpdated: true,
  head: [['meta', { name: 'theme-color', content: '#4f46e5' }]],

  themeConfig: {
    socialLinks: [{ icon: 'github', link: repo }],
    search: { provider: 'local' },
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      description:
        'JSON-driven forms for Vue 3 with conditional logic, validation and a visual builder.',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
        outline: { label: 'On this page' },
        docFooter: { prev: 'Previous page', next: 'Next page' },
        lastUpdated: { text: 'Last updated' },
        langMenuLabel: 'Language',
        returnToTopLabel: 'Return to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Appearance',
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
        editLink: { pattern: editPattern, text: 'Edit this page on GitHub' },
        footer: { message: 'Released under the MIT License.', copyright: '© Janice Chiang' },
      },
    },
    zh: {
      label: '繁體中文',
      lang: 'zh-TW',
      link: '/zh/',
      description: '用 JSON 描述 Vue 3 表單：條件邏輯、驗證，以及視覺化編輯器。',
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
        outline: { label: '本頁目錄' },
        docFooter: { prev: '上一頁', next: '下一頁' },
        lastUpdated: { text: '最後更新' },
        langMenuLabel: '語言',
        returnToTopLabel: '回到頂部',
        sidebarMenuLabel: '選單',
        darkModeSwitchLabel: '外觀',
        lightModeSwitchTitle: '切換到淺色',
        darkModeSwitchTitle: '切換到深色',
        editLink: { pattern: editPattern, text: '在 GitHub 編輯此頁' },
        footer: { message: '以 MIT 授權釋出。', copyright: '© Janice Chiang' },
      },
    },
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
