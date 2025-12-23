// content.js - FINAL PRODUCTION VERSION (Resilient Flow)
console.log("Credible Content Script Loaded!");

// --- POPUP DISPLAY LOGIC (The Modal Function) ---
function showPopup(tagElement, htmlContent) {
  // 1. Remove any existing popups
  const existingPopup = document.querySelector(".credible-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // 2. Create and style the main popup container
  const popup = document.createElement("div");
  popup.className = "credible-popup";
  popup.style.zIndex = 2147483647; // Max Z-index for visibility
  popup.style.position = "absolute";
  popup.innerHTML = htmlContent;

  // 3. Position the popup relative to the clicked tag
  const rect = tagElement.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  // 4. Append to the page body
  document.body.appendChild(popup);

  // 5. Add a listener to close the popup when the user clicks outside of it
  document.addEventListener("click", function close(event) {
    if (!popup.contains(event.target) && event.target !== tagElement) {
      popup.remove();
      document.removeEventListener("click", close);
    }
  });
}

// --- 1. CONFIGURATION ---
const BACKEND_ENDPOINT = "https://credible-factchecker.onrender.com/api/check-credibility";
const VERIFY_ENDPOINT = "https://credible-factchecker.onrender.com/api/verify-text";

const CACHED_LINKS = new Map();

// Function to extract the user's search query from the URL bar (e.g., from ?q=...)
function getUserSearchQuery() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    return query ? decodeURIComponent(query.replace(/\+/g, " ")) : null;
  } catch (e) {
    console.error("Could not extract search query from URL:", e);
    return null;
  }
}

// --- 2. Main Execution Function ---
function mainExecution() {
    // 1. Selector A: Standard Search Results (The Blue Titles)
    const standardTitles = Array.from(document.querySelectorAll('h3'));
    
    // 2. Selector B: "Top Stories" & "News" Cards 
    // These often don't use H3. They use specific roles or classes.
    // [role="heading"] catches the card titles safely.
    const newsTitles = Array.from(document.querySelectorAll('div[role="heading"], div.n0jPhd, a.WlydOe .mCBkyc'));

    // Combine them
    const allCandidates = [...standardTitles, ...newsTitles];
    
    let searchResults = [];

    allCandidates.forEach((element) => {
        // Find the closest anchor tag wrapper (Upwards)
        let link = element.closest('a');
        
        // If not found upwards, check if the element ITSELF is a link (rare but happens)
        if (!link && element.tagName === 'A') {
            link = element;
        }

        if (link && link.href) {
            if (CACHED_LINKS.has(link.href)) return; 

            const url = link.href;
            
            // Filter out Google internal links & empty links
            if (url.startsWith("http") && !url.includes("google.com/")) {
                
                // VISUAL CHECK: Ensure we are tagging the TEXT, not the IMAGE
                // If the element we found is the headline text, we are good.
                // We want to avoid injecting the tag on top of the thumbnail image.
                
                searchResults.push({ url: url, domain: new URL(url).hostname });
                
                // CRITICAL: We map the URL to the specific ELEMENT we want to tag (the text header),
                // not just the big link container. This ensures the tag sits next to the text.
                CACHED_LINKS.set(url, element); 
            }
        }
    });

    if (searchResults.length > 0) {
        console.log(`[DOM] Found ${searchResults.length} new results.`);
        const qParam = new URLSearchParams(window.location.search).get("q");
        const query = qParam ? decodeURIComponent(qParam.replace(/\+/g, " ")) : "";
        
        sendDataToBackend(searchResults, query);
    }
}

// --- 3. Communication Function (Unchanged) ---
async function sendDataToBackend(data, userQuery) {
  try {
    console.log(
      `[FRONTEND] Sending ${data.length} items to backend at ${BACKEND_ENDPOINT}...`
    );
    const payload = {
      links: data,
      query: userQuery,
    };
    const response = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const verdicts = await response.json();
    console.log("-----------------------------------------");
    console.log(`[FRONTEND] SUCCESS! Received ${verdicts.length} verdicts.`);
    injectVerdictsIntoPage(verdicts);
  } catch (error) {
    console.error(
      "[FRONTEND] Error communicating with backend. Is the FastAPI server running?",
      error
    );
  }
}

// --- 4. RENDERING LOGIC (FINAL PRODUCTION VERSION WITH UI INJECTION) ---
function injectVerdictsIntoPage(verdicts) {
  let injectedCount = 0;

  verdicts.forEach((verdict) => {
    const linkElement = CACHED_LINKS.get(verdict.url);

    if (linkElement && verdict.label) {
      // 1. Determine the CSS Class for the tag color
      let tagClass = "tag-unscored-default";

      if (verdict.label === "VERIFIED") {
        tagClass = "tag-verified-authority"; // Green
      } else if (verdict.label === "REPUTABLE") {
        tagClass = "tag-reputable-quality"; // Blue
      }

      // 2. Create the Tag Element
      const tag = document.createElement("span");
      tag.className = `credible-tag ${tagClass}`;

      // FINAL FIX FOR MIRRORING (using BDI)
      const bdiElement = document.createElement("bdi");
      bdiElement.textContent = verdict.label;
      tag.appendChild(bdiElement);

      // 3. Attach Click Listener (The Pop-up UX with Event Fix)
      tag.addEventListener("click", (event) => {
        // CRITICAL FIX: Prevent default link navigation
        event.preventDefault();
        event.stopPropagation();

        // Call the custom function to show the styled HTML justification
        showPopup(tag, verdict.tag_reason);
      });

      // 4. Inject into Page (Using resilient 'after' injection)
      
      // --- NEW INJECTION LOGIC ---
      let targetElement = linkElement;
    
      // Check if we can append INSIDE the element (Best for News Cards / Divs)
      if (targetElement.tagName === 'DIV' || targetElement.tagName === 'H3') {
           targetElement.appendChild(tag); 
      } else {
           // Fallback: Append AFTER the element (Best for standard Links)
           targetElement.after(tag); 
      }
      
      injectedCount++;
    }
  });
  console.log(
    `[FRONTEND] Injected ${injectedCount} credibility tags into the search results.`
  );
}


// --- 5. INITIALIZATION & OBSERVER (The "Engine Starter") ---

// A. Run immediately in case the page is already ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mainExecution);
} else {
    mainExecution();
}

// B. Debounce function to prevent spamming the backend while the page loads
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// C. Set up a MutationObserver to watch for new search results (Infinite Scroll / Dynamic Loading)
const observer = new MutationObserver(debounce(() => {
    // Only re-run if we find new un-processed links (you might need to update mainExecution to skip already tagged ones)
    // For now, re-running mainExecution is fine as your map handles caching
    mainExecution();
}, 1000)); // Wait 1 second after changes stop before running

// Start observing the body for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log("Credible: Observer attached. Waiting for search results...");


// =========================================================
// TIER 2: SELECTION VERIFICATION (Agentic Check)
// =========================================================

// 1. Listen for the message from background.js (Right-Click)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "verify_selection") {
        handleSelectionVerification(request.text);
    }
});

// 2. Main Handler for Highlight Verification
async function handleSelectionVerification(text) {
    // A. Create a temporary "Anchor" element to position the popup
    // We do this because showPopup() expects a DOM element to position against,
    // but a text selection isn't a single element. We fake it.
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Create invisible 1x1 pixel anchor at the selection start
    const tempAnchor = document.createElement("span");
    tempAnchor.style.position = "fixed";
    tempAnchor.style.left = rect.left + "px";
    tempAnchor.style.top = rect.top + "px";
    tempAnchor.style.width = "1px";
    tempAnchor.style.height = "1px";
    tempAnchor.style.opacity = "0"; // Invisible
    document.body.appendChild(tempAnchor);

    // B. Show "Thinking..." State immediately
    // We reuse your existing showPopup function!
    showPopup(tempAnchor, `
        <div style="padding: 10px; font-family: sans-serif; color: #333;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                <div class="credible-spinner" style="width: 16px; height: 16px; border: 2px solid #ccc; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <strong>Agent is verifying...</strong>
            </div>
            <p style="margin: 0; font-size: 12px; color: #666;">Checking against official sources.</p>
        </div>
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `);

    try {
        // C. Call the New Agentic Backend
        const response = await fetch(VERIFY_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) throw new Error("Backend connection failed");

        const result = await response.json();

        // D. Determine Color based on Verdict
        let color = "#ffa500"; // Orange (Unverified/Misleading)
        if (result.verdict === "VERIFIED") color = "#28a745"; // Green
        if (result.verdict === "FALSE") color = "#dc3545"; // Red

        // E. Format the Final HTML
        const htmlContent = `
            <div style="max-width: 300px; padding: 10px; font-family: sans-serif;">
                <h3 style="margin: 0 0 8px 0; color: ${color}; font-size: 16px; display: flex; align-items: center; justify-content: space-between;">
                    ${result.verdict}
                    <span style="font-size: 10px; color: #999; border: 1px solid #ddd; padding: 2px 5px; border-radius: 4px;">Confidence: ${(result.confidence_score * 100).toFixed(0)}%</span>
                </h3>
                <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.4; color: #333;">
                    ${result.explanation}
                </p>
                <div style="font-size: 11px; background: #f8f9fa; padding: 5px; border-radius: 4px;">
                    <strong style="color: #555;">Primary Source:</strong><br>
                    ${result.sources.length > 0 
                        ? `<a href="${result.sources[0]}" target="_blank" style="color: #007bff; text-decoration: none; word-break: break-all;">${new URL(result.sources[0]).hostname}</a>` 
                        : "No direct source found."}
                </div>
            </div>
        `;

        // F. Update the popup with real data
        showPopup(tempAnchor, htmlContent);

    } catch (error) {
        showPopup(tempAnchor, `
            <div style="padding: 10px; color: #dc3545; font-family: sans-serif;">
                <strong>Error:</strong> ${error.message}<br>
                <span style="font-size: 11px; color: #666;">Is the local backend running?</span>
            </div>
        `);
    }
}