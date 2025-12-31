// content_bing.js - OPTIMIZED FOR BING
console.log("Credible: Bing Content Script Loaded!");

// --- POPUP DISPLAY LOGIC (Identical to Google) ---
function showPopup(tagElement, htmlContent) {
  const existingPopup = document.querySelector(".credible-popup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.className = "credible-popup";
  popup.style.zIndex = 2147483647;
  popup.style.position = "absolute";
  popup.innerHTML = htmlContent;

  const rect = tagElement.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  document.body.appendChild(popup);

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

// --- 2. Main Execution Function (BING SPECIFIC) ---
function mainExecution() {
    // Bing uses 'li.b_algo' for main results and 'div.news-card' for news
    const candidates = document.querySelectorAll("li.b_algo, div.news-card, div.ans");
    let searchResults = [];

    candidates.forEach((element) => {
        // Bing headlines are usually in H2
        const titleElement = element.querySelector("h2, h3");
        
        // Find the main link (often inside the H2)
        const link = element.querySelector("a");

        if (link && link.href && titleElement) {
            const url = link.href;

            if (CACHED_LINKS.has(url)) return; 

            // Filter out internal Bing links & Ads
            if (url.startsWith("http") && 
                !url.includes("bing.com/") && 
                !url.includes("microsoft.com")) {
                
                searchResults.push({ url: url, domain: new URL(url).hostname });
                
                // CRITICAL: Cache the TITLE element so the tag appears next to the text
                CACHED_LINKS.set(url, titleElement); 
            }
        }
    });

    if (searchResults.length > 0) {
        console.log(`[BING] Found ${searchResults.length} new results.`);
        const qParam = new URLSearchParams(window.location.search).get("q");
        const query = qParam ? decodeURIComponent(qParam.replace(/\+/g, " ")) : "";
        
        sendDataToBackend(searchResults, query);
    }
}

// --- 3. Communication Function ---
async function sendDataToBackend(data, userQuery) {
  try {
    const payload = { links: data, query: userQuery };
    const response = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const verdicts = await response.json();
    injectVerdictsIntoPage(verdicts);
  } catch (error) {
    console.error("[BING] Backend Error:", error);
  }
}

// --- 4. RENDERING LOGIC ---
function injectVerdictsIntoPage(verdicts) {
  verdicts.forEach((verdict) => {
    const titleElement = CACHED_LINKS.get(verdict.url);

    if (titleElement && verdict.label) {
      let tagClass = "tag-unscored-default";
      if (verdict.label === "VERIFIED") tagClass = "tag-verified-authority";
      else if (verdict.label === "REPUTABLE") tagClass = "tag-reputable-quality";

      const tag = document.createElement("span");
      tag.className = `credible-tag ${tagClass}`;
      
      const bdiElement = document.createElement("bdi");
      bdiElement.textContent = verdict.label;
      tag.appendChild(bdiElement);

      tag.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showPopup(tag, verdict.tag_reason);
      });

      // Bing headlines are simple, we can usually just append inside the H2
      titleElement.appendChild(tag);
    }
  });
}

// --- 5. INITIALIZATION ---
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mainExecution);
} else {
    mainExecution();
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const observer = new MutationObserver(debounce(() => {
    mainExecution();
}, 1000));

observer.observe(document.body, { childList: true, subtree: true });