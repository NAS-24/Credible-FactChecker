// content_bing.js - AGGRESSIVE HEADLINE HUNTER
console.log("Credible: Bing Content Script Loaded!");

// --- POPUP DISPLAY LOGIC (Standard) ---
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

// --- 2. Main Execution Function (HEADLINE HUNTER) ---
function mainExecution() {
    // Bing titles are almost ALWAYS inside <h2> tags. 
    // Sometimes sub-links are in <h3>.
    const candidates = document.querySelectorAll("h2, h3"); 
    let searchResults = [];

    candidates.forEach((element) => {
        // 1. Find the link associated with this headline
        // Bing logic: The <h2> usually contains the <a> tag directly.
        let link = element.querySelector("a") || element.closest("a");

        if (link && link.href) {
            const url = link.href;

            if (CACHED_LINKS.has(url)) return; 

            // 2. Filter out Junk (Bing internal links, Microsoft ads, etc.)
            if (url.startsWith("http") && 
                !url.includes("bing.com/") && 
                !url.includes("microsoft.com") && 
                !url.includes("go.microsoft.com")) {
                
                searchResults.push({ url: url, domain: new URL(url).hostname });
                
                // CRITICAL: Cache the HEADLINE element (so the tag sits next to text)
                CACHED_LINKS.set(url, element); 
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

      // Inject the tag right inside the H2/H3 for perfect alignment
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