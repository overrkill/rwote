import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Rwote',
    description: 'Save and view notes from any page',
    version: '0.1.0',
    permissions: ['storage', 'contextMenus', 'sidePanel'],
    action: {},
    icons: {
      16: '/icons/icon16.png',
      48: '/icons/icon48.png',
      128: '/icons/icon128.png',
    },
  },
});
