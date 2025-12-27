document.addEventListener("DOMContentLoaded", async () => {
  const scanBtn = document.getElementById("fullScanButton"); 
  const statusMsg = document.getElementById("status");       
  const listElement = document.getElementById("claimsList"); 
  const urlDisplay = document.getElementById("urlDisplay");

  // 1. Get Current Tab & Display URL
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url.startsWith("http")) {
    statusMsg.innerText = "Cannot scan this page.";
    scanBtn.disabled = true;
    return;
  }
  
  // Show clean URL in header
  try {
      urlDisplay.innerText = new URL(tab.url).hostname;
  } catch(e) {
      urlDisplay.innerText = "Current Page";
  }

  // 2. MAIN CLICK LISTENER
  scanBtn.addEventListener("click", () => {
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="btn-icon">⏳</span> Reading...';
    statusMsg.innerText = "Extracting claims...";
    listElement.innerHTML = "";

    chrome.runtime.sendMessage({ 
      action: "SCAN_ARTICLE", 
      url: tab.url 
    });
  });

  // 3. LISTEN FOR RESULTS
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "SCAN_RESULT") {
      handleScanResult(message.data);
    }
    if (message.action === "SCAN_ERROR") {
      statusMsg.innerText = "Error: " + message.error;
      statusMsg.style.color = "#ef4444";
      scanBtn.disabled = false;
      scanBtn.innerHTML = '<span class="btn-icon">🔍</span> Scan Article';
    }
  });

  // 4. RENDER CARDS (The New UI Logic)
  function handleScanResult(data) {
    scanBtn.innerHTML = '<span class="btn-icon">✅</span> Scan Complete';
    scanBtn.disabled = false;

    if (!data.claims || data.claims.length === 0) {
      statusMsg.innerText = "No verifiable claims found.";
      return;
    }

    statusMsg.innerText = `Found ${data.claims.length} claims. Click to verify.`;

    data.claims.forEach(claimText => {
      const li = document.createElement("li");
      li.className = "claim-card"; // Apply new CSS class
      
      // HTML Structure for the Card
      li.innerHTML = `
        <span class="claim-text">"${claimText}"</span>
        <div class="claim-footer">
            <span class="badge unverified">PENDING</span>
            <small style="color: #94a3b8; font-size: 10px;">Click to verify</small>
        </div>
      `;

      // Click Listener for Verification
      li.addEventListener("click", () => {
        if (li.dataset.verifying === "true") return;
        
        // Update UI to "Loading" state
        li.dataset.verifying = "true";
        li.style.opacity = "0.7";
        li.querySelector(".badge").innerText = "ANALYZING...";
        li.querySelector(".badge").style.background = "#e0f2fe";
        li.querySelector(".badge").style.color = "#0369a1";

        // Send 'verify' request
        chrome.runtime.sendMessage({
          action: "VERIFY_CLAIM_POPUP",
          text: claimText
        }, (response) => {
           updateClaimUI(li, response);
        });
      });

      listElement.appendChild(li);
    });
  }

  // 5. UPDATE CARD AFTER VERIFICATION
  function updateClaimUI(li, result) {
    li.style.opacity = "1";
    li.style.cursor = "default";
    
    if (!result || result.error) {
       li.querySelector(".claim-footer").innerHTML = `
         <span class="badge false">ERROR</span>
         <small style="color: #ef4444;">Failed to verify.</small>
       `;
       return;
    }

    // Determine Badge Color
    const verdict = result.verdict || "UNVERIFIED";
    const lowerVerdict = verdict.toLowerCase(); // 'verified', 'false', 'misleading'
    
    // Create Source Link if available
    const sourceHtml = result.sources && result.sources.length > 0 
        ? `<a href="${result.sources[0]}" target="_blank" style="color:#2563eb; text-decoration:none;">View Source ↗</a>` 
        : "";

    // Update the Footer with the Result
    li.querySelector(".claim-footer").innerHTML = `
        <div style="width: 100%;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="badge ${lowerVerdict}">${verdict}</span>
                <span style="font-size:10px; color:#64748b;">${Math.round((result.confidence_score || 0) * 100)}% Conf.</span>
            </div>
            <p style="margin:0; font-size:11px; color:#334155; line-height:1.4;">
                ${result.explanation}
            </p>
            <div style="margin-top:6px; font-size:10px; text-align:right;">
                ${sourceHtml}
            </div>
        </div>
    `;
    
    // Remove click listener (clone method) to prevent re-verifying
    const newLi = li.cloneNode(true);
    li.parentNode.replaceChild(newLi, li);
  }
});