// content.js - FINAL PRODUCTION VERSION
console.log("Credible Content Script Loaded!");

// --- POPUP DISPLAY LOGIC (The Modal Function) ---
function showPopup(tagElement, htmlContent) {
    // 1. Remove any existing popups
    const existingPopup = document.querySelector('.credible-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // 2. Create and style the main popup container
    const popup = document.createElement('div');
    popup.className = 'credible-popup';
    popup.style.zIndex = 2147483647; // Max Z-index for visibility
    popup.style.position = 'absolute';
    popup.innerHTML = htmlContent; 
    
    // 3. Position the popup relative to the clicked tag
    const rect = tagElement.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`; 
    popup.style.left = `${rect.left + window.scrollX}px`;

    // 4. Append to the page body
    document.body.appendChild(popup);

    // 5. Add a listener to close the popup when the user clicks outside of it
    document.addEventListener('click', function close(event) {
        if (!popup.contains(event.target) && event.target !== tagElement) {
            popup.remove();
            document.removeEventListener('click', close);
        }
    });
}

// --- 1. CONFIGURATION ---
const BACKEND_ENDPOINT = "https://credible-factchecker.onrender.com/api/check-credibility";
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
    const userQuery = getUserSearchQuery();
    console.log(`User Query Extracted: ${userQuery || "N/A"}`);
    
    const webLinks = document.querySelectorAll("a:has(h3)");
    const newsLinks = document.querySelectorAll(
        'a.WlydOe, a.JtKRv, a.VDXfz, a:has(h4)'
    );

    const linkElements = [...webLinks, ...newsLinks];
    let searchResults = [];

    linkElements.forEach((link) => {
        const url = link.href;
        if (url && url.startsWith("http")) {
            try {
                const domain = new URL(url).hostname;
                const uniqueKey = url;
                searchResults.push({ url: url, domain: domain });
                CACHED_LINKS.set(uniqueKey, link);
            } catch (e) {
                // Ignore invalid URLs
            }
        }
    });

    console.log(`Found ${searchResults.length} potential search results.`);

    if (searchResults.length > 0) {
        sendDataToBackend(searchResults, userQuery);
    }
}

// *** CRITICAL FIX APPLIED: Listen for DOMContentLoaded with a short delay ***
document.addEventListener('DOMContentLoaded', function() {
    // Delay ensures Google's dynamic content has loaded
    setTimeout(mainExecution, 500); 
});


// --- 3. Communication Function (Unchanged) ---
async function sendDataToBackend(data, userQuery) {
    // ... (Your sendDataToBackend logic is unchanged and correct) ...
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
            tag.addEventListener('click', (event) => {
                // CRITICAL FIX: Prevent default link navigation
                event.preventDefault(); 
                event.stopPropagation(); 
                
                // Call the custom function to show the styled HTML justification
                showPopup(tag, verdict.tag_reason); 
            });


            // 4. Inject into Page (Using resilient 'after' injection)
            const injectionPoint = linkElement.querySelector("h3") || linkElement.querySelector("h4");
            
            if (injectionPoint) {
                // Inject after the header element (safer than prepending)
                injectionPoint.after(tag);
            } else {
                // Fallback injection after the main link element
                linkElement.after(tag);
            }
            
            injectedCount++;
        }
    });
    console.log(
        `[FRONTEND] Injected ${injectedCount} credibility tags into the search results.`
    );
}