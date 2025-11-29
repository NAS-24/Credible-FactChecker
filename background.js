// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "verifyWithCredible",
    title: "Verify with Credible",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "verifyWithCredible") {
    verifySelectedText(tab.id, info.selectionText);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  toggleSidebar(tab.id);
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openSidebar") {
    toggleSidebar(request.tabId);
  } else if (request.action === "analyzePage") {
    analyzePage(request.tabId);
  }
  sendResponse({ success: true });
});

// Helper functions
function verifySelectedText(tabId, selectedText) {
  chrome.tabs.sendMessage(tabId, {
    action: "verifySelectedText",
    selectedText: selectedText
  }).catch(error => {
    console.log('Content script not loaded, injecting...');
    injectContentScript(tabId, () => {
      chrome.tabs.sendMessage(tabId, {
        action: "verifySelectedText",
        selectedText: selectedText
      });
    });
  });
}

function toggleSidebar(tabId) {
  chrome.tabs.sendMessage(tabId, {
    action: "toggleSidebar"
  }).catch(error => {
    console.log('Content script not loaded, injecting...');
    injectContentScript(tabId, () => {
      chrome.tabs.sendMessage(tabId, {
        action: "toggleSidebar"
      });
    });
  });
}

function analyzePage(tabId) {
  chrome.tabs.sendMessage(tabId, {
    action: "analyzePage"
  }).catch(error => {
    console.log('Content script not loaded, injecting...');
    injectContentScript(tabId, () => {
      chrome.tabs.sendMessage(tabId, {
        action: "analyzePage"
      });
    });
  });
}

function injectContentScript(tabId, callback) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  }).then(() => {
    setTimeout(callback, 100);
  }).catch(error => {
    console.error('Failed to inject content script:', error);
  });
}