// popup.js - FINAL (Background Relay Version)

document.addEventListener("DOMContentLoaded", async () => {
  const scanBtn = document.getElementById("fullScanButton"); 
  const statusMsg = document.getElementById("status");       
  const listElement = document.getElementById("claimsList"); 

  // 1. Get Current Tab
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url.startsWith("http")) {
    statusMsg.innerText = "Cannot scan this page.";
    scanBtn.disabled = true;
    return;
  }

  // 2. MAIN CLICK LISTENER (Triggers Tier 3 Scan)
  scanBtn.addEventListener("click", () => {
    // UI Updates
    scanBtn.disabled = true;
    scanBtn.innerText = "Agent is reading...";
    statusMsg.innerText = "Extracting claims...";
    listElement.innerHTML = "";

    // SEND MESSAGE TO BACKGROUND (The Relay)
    // We don't fetch here; we ask background.js to do it.
    chrome.runtime.sendMessage({ 
      action: "SCAN_ARTICLE", 
      url: tab.url 
    });
  });

  // 3. LISTEN FOR SCAN RESULTS (From Background)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "SCAN_RESULT") {
      handleScanResult(message.data);
    }
    if (message.action === "SCAN_ERROR") {
      statusMsg.innerText = "Error: " + message.error;
      statusMsg.style.color = "red";
      scanBtn.disabled = false;
      scanBtn.innerText = "Scan Article";
    }
  });

  // 4. RENDER LOGIC
  function handleScanResult(data) {
    scanBtn.innerText = "Scan Complete";
    scanBtn.disabled = false;

    if (!data.claims || data.claims.length === 0) {
      statusMsg.innerText = "No verifiable claims found.";
      return;
    }

    statusMsg.innerText = `Found ${data.claims.length} claims. Click to verify.`;

    data.claims.forEach(claimText => {
      const li = document.createElement("li");
      li.className = "claim-item";
      li.innerText = claimText;
      li.style.cursor = "pointer";
      li.style.padding = "8px";
      li.style.borderBottom = "1px solid #eee";

      // Tier 2 Verification Logic (Clicking a specific claim)
      li.addEventListener("click", () => {
        if (li.dataset.verifying === "true") return;
        li.dataset.verifying = "true";
        li.style.opacity = "0.6";
        li.innerText = "Verifying...";

        // Send 'verify' request to background
        chrome.runtime.sendMessage({
          action: "VERIFY_CLAIM_POPUP",
          text: claimText
        }, (response) => {
           // Callback function triggers when background.js finishes
           updateClaimUI(li, response);
        });
      });

      listElement.appendChild(li);
    });
  }

  // 5. UPDATE UI AFTER VERIFICATION
  function updateClaimUI(li, result) {
    if (!result || result.error) {
      li.innerText = "Error verifying.";
      li.style.opacity = "1";
      return;
    }

    const color = result.verdict === "VERIFIED" ? "green" : 
                  result.verdict === "FALSE" ? "red" : "orange";
                  
    li.innerHTML = `
      <div style="border-left: 4px solid ${color}; padding-left: 8px;">
        <strong style="color:${color}">${result.verdict}</strong>
        <p style="margin: 4px 0; font-size: 0.9em; color: #333;">${result.explanation}</p>
        <div style="font-size: 0.8em; color: #666;">
           ${result.sources.length ? `<a href="${result.sources[0]}" target="_blank" style="color:007bff;">Source</a>` : ""}
        </div>
      </div>
    `;
    li.style.opacity = "1";
    li.style.cursor = "default";
  }
});