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
const BACKEND_ENDPOINT =
  "https://credible-factchecker.onrender.com/api/check-credibility";
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