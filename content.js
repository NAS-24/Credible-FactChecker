// content.js
console.log("Credible Content Script Loaded!");

// --- 1. CONFIGURATION ---
const BACKEND_ENDPOINT = "https://credible-factchecker.onrender.com/api/check-credibility";
const CACHED_LINKS = new Map(); // Map to store link elements for quick injection

// Function to extract the user's search query from the URL bar (e.g., from ?q=...)
function getUserSearchQuery() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        // Google uses 'q' parameter for the query
        const query = urlParams.get("q");
        // Decode the URL characters (like changing '+' to ' ' or '%20')
        return query ? decodeURIComponent(query.replace(/\+/g, " ")) : null;
    } catch (e) {
        console.error("Could not extract search query from URL:", e);
        return null;
    }
}

// --- 2. Main Execution Function ---
function mainExecution() {
    // 2a. Extract User Query FIRST
    const userQuery = getUserSearchQuery();
    console.log(`User Query Extracted: ${userQuery || "N/A"}`);
    
    console.log("DOM Content Loaded. Starting link extraction...");

    // 2b. Data Extraction: Find ALL result links on the page.
    // Web results
    const webLinks = document.querySelectorAll("a:has(h3)");

    // Google News results (do not use <h3>, they use <h4> or special classes)
    const newsLinks = document.querySelectorAll(
        'a.WlydOe, a.JtKRv, a.VDXfz, a:has(h4)'
    );

    // Combine both web + news results
    const linkElements = [...webLinks, ...newsLinks];
    let searchResults = [];

    linkElements.forEach((link) => {
        const url = link.href;
        if (url && url.startsWith("http")) {
            try {
                const domain = new URL(url).hostname;
                const uniqueKey = url;

                searchResults.push({ url: url, domain: domain });
                // Cache the element using its URL as the unique key
                CACHED_LINKS.set(uniqueKey, link);
            } catch (e) {
                // Ignore invalid URLs
            }
        }
    });

    console.log(`Found ${searchResults.length} potential search results.`);

    if (searchResults.length > 0) {
        // 2c. Send data to the Python Backend
        sendDataToBackend(searchResults, userQuery);
    }
}

// *** CRITICAL FIX APPLIED HERE: Listen for DOMContentLoaded with a delay. ***
document.addEventListener('DOMContentLoaded', function() {
    // Use a short delay to ensure the search page is fully settled before modifying the DOM.
    setTimeout(mainExecution, 500); 
});


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
        console.log("FULL VERDICTS ARRAY:", verdicts);
        
        // Phase 3: Display the Tags (Now via Title attribute)
        injectVerdictsIntoPage(verdicts);
    } catch (error) {
        console.error(
            "[FRONTEND] Error communicating with backend. Is the FastAPI server running?",
            error
        );
    }
}

// --- 4. RENDERING LOGIC (MODIFIED FOR TITLE ATTRIBUTE INJECTION - NO NEW ELEMENTS) ---
function injectVerdictsIntoPage(verdicts) {
    let injectedCount = 0;

    verdicts.forEach((verdict) => {
        const linkElement = CACHED_LINKS.get(verdict.url);
        
        // Only proceed if we have a link element and a label
        if (linkElement && verdict.label) {
            
            // Format the verdict into a clean string for the title attribute
            const titleVerdict = 
                `[CREDIBILITY STATUS: ${verdict.label}] - Click for justification.`;
            
            // If the element already has a title, append the verdict.
            const existingTitle = linkElement.getAttribute('title');
            
            if (existingTitle) {
                linkElement.setAttribute('title', `${existingTitle} ${titleVerdict}`);
            } else {
                linkElement.setAttribute('title', titleVerdict);
            }
            
            injectedCount++;
        }
    });
    console.log(
        `[FRONTEND] Injected ${injectedCount} credibility hints into link titles.`
    );
}