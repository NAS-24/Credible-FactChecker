// popup.js - Production Agentic Version

const API_BASE = "https://credible-factchecker.onrender.com/api";

// --- 1. Get Current Tab ---
async function getCurrentTabUrl() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab ? tab.url : null;
}

// --- 2. Main Scan Function (Tier 3 Extraction) ---
async function performScan(url) {
  const statusElement = document.getElementById('status');
  const listElement = document.getElementById('claimsList'); // Ensure this exists in HTML
  const scanButton = document.getElementById('fullScanButton');

  // Reset UI
  statusElement.textContent = "Agent is reading article... (Extracting Claims)";
  statusElement.style.color = "#666";
  listElement.innerHTML = "";
  scanButton.disabled = true;

  try {
    // A. Call Extraction Endpoint
    const response = await fetch(`${API_BASE}/extract-claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }) // Matches Pydantic 'ArticleRequest'
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    const data = await response.json();

    // B. Handle Results
    if (!data.claims || data.claims.length === 0) {
      statusElement.textContent = "No verifiable claims found.";
      return;
    }

    statusElement.textContent = `Found ${data.claims.length} claims. Click one to verify.`;
    
    // C. Render the Interactive List
    data.claims.forEach(claimText => {
      const li = document.createElement("li");
      li.className = "claim-item"; // Add styling for this class in CSS
      li.textContent = claimText;
      li.style.cursor = "pointer";
      li.style.padding = "8px";
      li.style.borderBottom = "1px solid #eee";

      // Add Click Listener for Tier 2 Verification
      li.addEventListener("click", () => verifySpecificClaim(li, claimText));
      
      listElement.appendChild(li);
    });

  } catch (error) {
    statusElement.textContent = "Error: " + error.message;
    statusElement.style.color = "#ef4444";
  } finally {
    scanButton.disabled = false;
  }
}

// --- 3. Individual Claim Verification (Tier 2) ---
async function verifySpecificClaim(liElement, claimText) {
  // Prevent double clicks
  if (liElement.dataset.loading === "true") return;
  liElement.dataset.loading = "true";

  const originalText = liElement.textContent;
  liElement.textContent = "Verifying with Agent... ⏳";
  liElement.style.opacity = "0.7";

  try {
    const response = await fetch(`${API_BASE}/verify-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: claimText }) // Matches 'VerifyRequest'
    });

    const result = await response.json();

    // Update UI with Verdict
    const color = result.verdict === "VERIFIED" ? "green" : 
                  result.verdict === "FALSE" ? "red" : "orange";

    liElement.innerHTML = `
      <div style="border-left: 4px solid ${color}; padding-left: 8px;">
        <strong style="color:${color}">${result.verdict}</strong>
        <p style="margin: 4px 0; font-size: 0.9em; color: #333;">${result.explanation}</p>
        <div style="font-size: 0.8em; color: #666;">
           ${result.sources.length ? `<a href="${result.sources[0]}" target="_blank">Source Link</a>` : ""}
        </div>
      </div>
    `;
    liElement.style.opacity = "1";
    liElement.style.cursor = "default";

  } catch (error) {
    li.textContent = originalText; // Revert on error
    alert("Verification failed. Is backend running?");
    li.dataset.loading = "false";
  }
}

// --- 4. Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  const url = await getCurrentTabUrl();
  const urlDisplay = document.getElementById('urlDisplay');
  const scanButton = document.getElementById('fullScanButton');

  if (url && url.startsWith('http')) {
    urlDisplay.textContent = `Analyzing: ${new URL(url).hostname}`;
    
    // Attach Listener
    scanButton.addEventListener('click', () => performScan(url));
    
  } else {
    urlDisplay.textContent = "Invalid Page";
    scanButton.disabled = true;
  }
});