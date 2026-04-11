// background.js — Service Worker (Manifest V3)

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Set side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-insight',
    title: 'Save to Rwote',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-insight' && info.selectionText) {
    const text = info.selectionText.trim();
    if (!text) return;

    // Open side panel then send the selected text
    chrome.sidePanel.open({ tabId: tab.id }, () => {
      // Small delay to let the panel initialize
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'SAVE_SELECTION',
          text
        }).catch(() => {
          // Panel may not be ready yet — store pending and panel will pick it up
          chrome.storage.session.set({ pendingSelection: text });
        });
      }, 400);
    });
  }
});

// Relay messages from content scripts to side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHAT_TEXT') {
    chrome.runtime.sendMessage(message).catch(() => {});
  }
  if (message.type === 'SELECTION_FROM_CONTENT') {
    chrome.runtime.sendMessage({
      type: 'SAVE_SELECTION',
      text: message.text
    }).catch(() => {
      chrome.storage.session.set({ pendingSelection: message.text });
    });
  }
  sendResponse({ ok: true });
  return true;
});
