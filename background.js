// background.js - Production Version (CSP Bypass)

const VERIFY_ENDPOINT = "https://credible-factchecker.onrender.com/api/verify-text";

// 1. Create Menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "credible-verify",
    title: "Verify with Credible",
    contexts: ["selection"]
  });
});

// 2. Handle Click & Network Request
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "credible-verify" && info.selectionText) {
    
    // A. Tell content.js to show the "Thinking..." loader immediately
    // We send a specific "UI_LOADING" action
    chrome.tabs.sendMessage(tab.id, {
      action: "UI_LOADING",
      anchorText: info.selectionText // Optional: could help positioning
    });

    try {
      // B. Perform the Fetch HERE (Background is immune to CORS/CSP blocks)
      const response = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: info.selectionText })
      });

      if (!response.ok) throw new Error("Server Error");

      const result = await response.json();

      // C. Send the SUCCESS result back to content.js
      chrome.tabs.sendMessage(tab.id, {
        action: "UI_RESULT",
        data: result
      });

    } catch (error) {
      console.error("Verification failed:", error);
      // D. Send the ERROR result back to content.js
      chrome.tabs.sendMessage(tab.id, {
        action: "UI_ERROR",
        message: error.message
      });
    }
  }
});