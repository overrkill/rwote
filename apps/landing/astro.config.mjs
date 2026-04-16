// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rwote.com',
  integrations: [
    mdx(),
    sitemap(),
  ],
  output: 'static',
  build: {
    assets: '_assets',
  },
});
