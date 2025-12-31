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
const CACHED_LINKS = new Map();

// --- 2. Main Execution Function (The "Headline Hunter" Strategy) ---
function mainExecution() {
    const hostname = window.location.hostname;
    let headlineSelector = "";

    // 1. Determine which headlines to look for
    if (hostname.includes("google")) {
        // Google uses <h3> for titles
        headlineSelector = "h3";
    } else if (hostname.includes("bing")) {
        // Bing uses <h2> for titles (and sometimes <h3> for sub-links)
        headlineSelector = "h2, h3";
    } else {
        return; // Not on a supported site
    }

    // 2. Find ALL headlines on the page
    const candidates = document.querySelectorAll(headlineSelector);
    let searchResults = [];

    candidates.forEach((element) => {
        // 3. Smart Link Detection:
        // Case A: The headline is INSIDE the link (Google style: <a><h3>Title</h3></a>)
        // Case B: The headline CONTAINS the link (Bing style: <h2><a href>Title</a></h2>)
        let link = element.closest("a") || element.querySelector("a");

        if (link && link.href) {
            const url = link.href;

            // Prevent processing the same link twice
            if (CACHED_LINKS.has(url)) return; 

            // 4. Filter out junk (Internal Google/Bing links, ads, empty links)
            // We want only real external URLs (http/https)
            if (url.startsWith("http") && 
                !url.includes("google.com/") && 
                !url.includes("bing.com/") && 
                !url.includes("googleusercontent") &&
                !url.includes("microsoft.com")) {
                
                // Add to list for backend processing
                searchResults.push({ url: url, domain: new URL(url).hostname });
                
                // CRITICAL: Cache the HEADLINE element (so the tag sits next to the text)
                CACHED_LINKS.set(url, element); 
            }
        }
    });

    // 5. Send to Backend
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
// TIER 2: SELECTION VERIFICATION (Updated for CSP Bypass)
// =========================================================

// Global variable to hold the anchor element between messages
let currentAnchor = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // CASE 1: Show the "Thinking" Loader
    if (request.action === "UI_LOADING") {
        createAnchorAndShowLoader();
    }

    // CASE 2: Show the Real Result (Success)
    if (request.action === "UI_RESULT") {
        showFinalResult(request.data);
    }

    // CASE 3: Show Error
    if (request.action === "UI_ERROR") {
        showErrorResult(request.message);
    }
});

function createAnchorAndShowLoader() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Create/Reset invisible anchor
    if (currentAnchor) currentAnchor.remove();
    
    currentAnchor = document.createElement("span");
    currentAnchor.style.position = "fixed";
    currentAnchor.style.left = rect.left + "px";
    currentAnchor.style.top = rect.top + "px";
    currentAnchor.style.width = "1px";
    currentAnchor.style.height = "1px";
    currentAnchor.style.opacity = "0"; 
    document.body.appendChild(currentAnchor);

    // Show Loader
    showPopup(currentAnchor, `
        <div style="padding: 10px; font-family: sans-serif; color: #333;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                <div class="credible-spinner" style="width: 16px; height: 16px; border: 2px solid #ccc; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <strong>Agent is verifying...</strong>
            </div>
            <p style="margin: 0; font-size: 12px; color: #666;">Bypassing site security...</p>
        </div>
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `);
}

function showFinalResult(result) {
    if (!currentAnchor) return;

    // Determine Color for the header
    let color = "#ffa500"; 
    if (result.verdict === "VERIFIED") color = "#28a745"; 
    if (result.verdict === "FALSE") color = "#dc3545"; 

    const htmlContent = `
        <div style="max-width: 300px; padding: 12px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-radius: 8px;">
            
            <h3 style="margin: 0 0 10px 0; color: ${color}; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: space-between;">
                ${result.verdict}
                <span style="font-size: 11px; color: #555; border: 2px solid #eee; padding: 3px 6px; border-radius: 12px; font-weight: 600;">${(result.confidence_score * 100).toFixed(0)}% Conf.</span>
            </h3>

            <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #000000; font-weight: 500;">
                ${result.explanation}
            </p>

            <div style="font-size: 12px; background: #f1f3f5; padding: 8px; border-radius: 6px; border-left: 4px solid #ddd;">
                <strong style="color: #333; font-weight: 700;">Source:</strong><br>
                ${result.sources.length > 0 
                    ? `<a href="${result.sources[0]}" target="_blank" style="color: #007bff; text-decoration: none; font-weight: 600;">${new URL(result.sources[0]).hostname} ↗</a>` 
                    : "No direct source linked."}
            </div>
        </div>
    `;

    showPopup(currentAnchor, htmlContent);
}

function showErrorResult(msg) {
    if (!currentAnchor) return;
    showPopup(currentAnchor, `<div style="padding:10px; color:red;">Error: ${msg}</div>`);
}