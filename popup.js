// --- 1. Get the current active tab's URL ---
async function getCurrentTabUrl() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab ? tab.url : null;
}

// --- 2. Send Data to FastAPI Server ---
async function sendScanRequest(url) {
  const ENDPOINT = "https://credible-factchecker.onrender.com/api/verify-article-full"; 
  const statusElement = document.getElementById('status');
  statusElement.textContent = "Scanning... This may take up to 30 seconds.";

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }) // Send the URL input
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();

    // Display the final verdict status
    statusElement.textContent = `Verdict: ${result.composite_verdict}`;
    statusElement.style.color = result.claims_breakdown.False > 0 ? '#ef4444' : '#10b981';

    // Log detailed results to the background console for debugging
    chrome.runtime.sendMessage({ action: "log_result", result: result }); 

  } catch (error) {
    statusElement.textContent = "Error: Could not connect to backend.";
    statusElement.style.color = '#ef4444';
    // Send error to background for detailed logging
    chrome.runtime.sendMessage({ action: "log_error", error: error.message });
  }
}

// --- 3. Main DOM Listener ---
document.addEventListener('DOMContentLoaded', async () => {
  const url = await getCurrentTabUrl();
  const urlDisplay = document.getElementById('urlDisplay');
  const scanButton = document.getElementById('fullScanButton');
  
  if (url && url.startsWith('http')) {
    // Display short URL and enable button
    urlDisplay.textContent = `Analyzing: ${new URL(url).hostname}`;
    scanButton.addEventListener('click', () => sendScanRequest(url));
  } else {
    urlDisplay.textContent = "Cannot scan this page (not an article).";
    scanButton.disabled = true;
  }
});