// background.js - Production Version

// 1. Create the Context Menu Item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "credible-verify",
    title: "Verify with Credible",
    contexts: ["selection"] // Only show when text is highlighted
  });
});

// 2. Handle the Click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "credible-verify" && info.selectionText) {
    
    console.log("[BACKGROUND] Relay verification request to Content Script:", info.selectionText);

    // CRITICAL FIX: Send the text back to the Active Tab (content.js) 
    // This allows content.js to show the popup right next to the user's cursor.
    chrome.tabs.sendMessage(tab.id, {
      action: "verify_selection",
      text: info.selectionText
    });
  }
});