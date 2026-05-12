export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'save-to-rwote',
      title: 'Save to Rwote',
      contexts: ['selection'],
    });
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'save-to-rwote' && info.selectionText && tab?.id) {
      const note = {
        id: crypto.randomUUID(),
        text: info.selectionText.trim(),
        url: tab.url || '',
        pageTitle: tab.title || '',
        createdAt: new Date().toISOString(),
      };

      const { notes = [] } = await browser.storage.local.get('notes');
      notes.unshift(note);
      await browser.storage.local.set({ notes });

      await browser.action.setBadgeText({ text: '✓' });
      setTimeout(() => browser.action.setBadgeText({ text: '' }), 2000);
    }
  });

  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case 'GET_NOTES':
        browser.storage.local.get('notes').then(({ notes = [] }) => {
          sendResponse({ notes });
        });
        return true;

      case 'DELETE_NOTE':
        browser.storage.local.get('notes').then(({ notes = [] }) => {
          const filtered = notes.filter((n: any) => n.id !== message.id);
          browser.storage.local.set({ notes: filtered }).then(() => {
            sendResponse({ ok: true });
          });
        });
        return true;

      default:
        sendResponse({ ok: false, error: 'Unknown message type' });
        return false;
    }
  });
});
