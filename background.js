
// 1. Create the Context Menu Item on Installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "verify-claim",
    title: "Verify Statement with Credible",
    contexts: ["selection"] // Only show when text is selected
  });
});

// 2. Listen for Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "verify-claim" && info.selectionText) {
    
    const claimText = info.selectionText;
    console.log("[BACKGROUND] User selected text for verification:", claimText);

    // 3. Send the Claim to the Python Backend
    verifyClaimWithBackend(claimText);
  }
});

// 3. Verification Logic
async function verifyClaimWithBackend(claim) {
  const ENDPOINT = "https://credible-factchecker.onrender.com/api/check-agentic-claim"; 

  try {
    console.log(`[BACKGROUND] Sending claim to ${ENDPOINT}...`);
    
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: claim }) // Matches the ClaimIn Pydantic model
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    
    // For now, log the result to the console (visible in the Extension's background console)
    console.log("-----------------------------------------");
    console.log("[BACKGROUND] VERIFICATION COMPLETE");
    console.log("VERDICT:", result.claim_verdict);
    console.log("EXPLANATION:", result.explanation);
    console.log("CITATION:", result.citation);
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("[BACKGROUND] Error verifying claim:", error);
  }
}