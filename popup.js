// popup.js

// --- 1. Get the current active tab's URL ---
async function getCurrentTabUrl() {
  let queryOptions = { active: true, currentWindow: true };
  // chrome.tabs.query gets the information about the current page
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab ? tab.url : null;
}

// --- 2. Send Data to FastAPI Server (Phase 5 Endpoint) ---
async function sendScanRequest(url) {
  // CRITICAL: Ensure you use the correct, active port (8000)
  const ENDPOINT = "https://credible-factchecker.onrender.com/api/verify-article-full"; 
  const statusElement = document.getElementById('status');
  statusElement.textContent = "Scanning... This may take up to 30 seconds.";

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }) // Sends the URL to the ArticleIn Pydantic model
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();

    // Display the final verdict status in the popup
    statusElement.textContent = `Verdict: ${result.composite_verdict}`;
    statusElement.style.color = result.claims_breakdown.False > 0 ? '#ef4444' : '#10b981';

    // Logs detailed results to the hidden background console (for advanced debugging)
    chrome.runtime.sendMessage({ action: "log_result", result: result }); 

  } catch (error) {
    statusElement.textContent = `Error: Check server and console logs.`;
    statusElement.style.color = '#ef4444';
  }
}

// --- 3. Main DOM Listener (Attaches event to the button) ---
document.addEventListener('DOMContentLoaded', async () => {
  const url = await getCurrentTabUrl();
  const urlDisplay = document.getElementById('urlDisplay');
  const scanButton = document.getElementById('fullScanButton'); // The button element

  if (url && url.startsWith('http')) {
    // Show the domain name in the popup
    urlDisplay.textContent = `Analyzing: ${new URL(url).hostname}`;
    
    // <--- ADD THE LISTENER CODE HERE ---
    // This is the CRUCIAL line that connects the button click to the Phase 5 API call.
    scanButton.addEventListener('click', () => sendScanRequest(url)); 
    // -----------------------------------
  } else {
    urlDisplay.textContent = "Cannot scan this page (invalid URL).";
    scanButton.disabled = true;
  }
});