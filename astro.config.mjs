import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://maxine.science',
  // If using username.github.io, no base needed
  // If using a custom domain, no base needed
  // If using a repo name like github.com/user/repo, set base: '/repo'
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
    },
  },
});
