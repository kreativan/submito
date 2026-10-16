import { defineConfig } from 'vitepress';
import { repoRoot, submitoSitePlugin, writeExtras } from './submito-site.js';

const sidebar = [
  {
    text: 'Introduction',
    items: [
      { text: 'Getting started', link: '/getting-started' },
    ],
  },
  {
    text: 'Guide',
    items: [
      { text: 'Configuration', link: '/configuration' },
      { text: 'Forms & markup', link: '/forms-and-markup' },
      { text: 'Validation', link: '/validation' },
      { text: 'Server responses', link: '/server-responses' },
      { text: 'Response UI', link: '/response-ui' },
      { text: 'Events & instance API', link: '/events' },
    ],
  },
  {
    text: 'Integrations',
    items: [
      { text: 'Math captcha', link: '/math-captcha' },
      { text: 'Google reCAPTCHA', link: '/recaptcha' },
      { text: 'Cloudflare Turnstile', link: '/turnstile' },
      { text: 'Phone numbers', link: '/intl-tel-input' },
      { text: 'SweetAlert2', link: '/sweetalert2' },
    ],
  },
  {
    text: 'AI',
    items: [
      { text: 'AI & agents', link: '/ai' },
      { text: 'Agent skill', link: '/agent-skill' },
    ],
  },
  {
    text: 'More',
    items: [
      { text: 'Internationalization', link: '/internationalization' },
      { text: 'Security', link: '/security' },
    ],
  },
];

/** Shared with the site plugin, which builds /llms.txt, /llms-full.txt and /<page>.md from it. */
const site = {
  title: 'Submito',
  description:
    'Vanilla JavaScript AJAX forms: live validation, captchas, phone input and response dialogs. Zero dependencies.',
  sidebar,
};

export default defineConfig({
  title: site.title,
  description: site.description,
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: false,
  // Static files served next to the docs, not VitePress pages.
  ignoreDeadLinks: [/^\/playground/, /^\/llms(-full)?\.txt/, /^\/skills\//],
  themeConfig: {
    siteTitle: site.title,
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Options', link: '/configuration' },
      { text: 'AI', link: '/ai' },
      { text: 'Playground', link: '/playground/', target: '_self' },
    ],
    sidebar,
    search: {
      provider: 'local',
    },
    outline: {
      label: 'On this page',
      level: [2, 3],
    },
    socialLinks: [],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'kreativan.dev',
    },
  },
  vite: {
    plugins: [submitoSitePlugin(site)],
    server: {
      open: '/',
      fs: {
        allow: [repoRoot],
      },
    },
  },
  buildEnd() {
    writeExtras(site);
  },
});
