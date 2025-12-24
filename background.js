// background.js - Final Production Version
// Handles network requests for both Popup (Tier 3) and Context Menu (Tier 2)

// --- CONFIGURATION ---
const VERIFY_ENDPOINT = "https://credible-factchecker.onrender.com/api/verify-text";
const EXTRACT_ENDPOINT = "https://credible-factchecker.onrender.com/api/extract-claims";

// --- 1. SETUP CONTEXT MENU (Tier 2 Trigger) ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "credible-verify",
    title: "Verify with Credible",
    contexts: ["selection"]
  });
});

// --- 2. HANDLE MESSAGES FROM POPUP (Tier 3 Relay) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // CASE A: Tier 3 - "Scan Article" from Popup
  if (request.action === "SCAN_ARTICLE") {
    fetch(EXTRACT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: request.url })
    })
    .then(res => res.json())
    .then(data => {
      // Send result back to the Popup
      chrome.runtime.sendMessage({ action: "SCAN_RESULT", data: data });
    })
    .catch(err => {
      chrome.runtime.sendMessage({ action: "SCAN_ERROR", error: err.message });
    });
    
    return true; // Keep channel open for async response
  }

  // CASE B: Tier 3 - "Verify Specific Claim" from Popup List
  if (request.action === "VERIFY_CLAIM_POPUP") {
    fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: request.text })
    })
    .then(res => res.json())
    .then(data => sendResponse(data)) // Send data back to the specific popup callback
    .catch(err => sendResponse({ error: err.message }));

    return true; // Keep channel open for async response
  }
});

// --- 3. HANDLE CONTEXT MENU CLICKS (Tier 2 Trigger) ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "credible-verify" && info.selectionText) {
    
    // 1. Tell content.js to show "Thinking..."
    chrome.tabs.sendMessage(tab.id, {
      action: "UI_LOADING",
      anchorText: info.selectionText
    });

    try {
      // 2. Fetch from Backend (Bypassing CORS)
      const response = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: info.selectionText })
      });

      if (!response.ok) throw new Error("Server Error");

      const result = await response.json();

      // 3. Send Success Result to content.js
      chrome.tabs.sendMessage(tab.id, {
        action: "UI_RESULT",
        data: result
      });

    } catch (error) {
      // 4. Send Error to content.js
      chrome.tabs.sendMessage(tab.id, {
        action: "UI_ERROR",
        message: error.message
      });
    }
  }
});