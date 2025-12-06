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

// *** CRITICAL FIX APPLIED HERE: Listen for DOMContentLoaded instead of load. ***
document.addEventListener('DOMContentLoaded', mainExecution);


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
        injectVerdictsIntoPage(verdicts);
    } catch (error) {
        console.error(
            "[FRONTEND] Error communicating with backend. Is the FastAPI server running?",
            error
        );
    }
}

// --- 4. RENDERING LOGIC (MODIFIED for PREPEND) ---
function injectVerdictsIntoPage(verdicts) {
    let injectedCount = 0;

    verdicts.forEach((verdict) => {
        const linkElement = CACHED_LINKS.get(verdict.url);

        if (linkElement && verdict.label) {
            let tagClass = "tag-unscored-default"; 
            if (verdict.label === "VERIFIED") {
                tagClass = "tag-verified-authority"; 
            } else if (verdict.label === "REPUTABLE") {
                tagClass = "tag-reputable-quality"; 
            } 

            const tag = document.createElement("span");
            tag.className = `credible-tag ${tagClass}`;
            const bdiElement = document.createElement("bdi");
            bdiElement.textContent = verdict.label;
            tag.appendChild(bdiElement);

            tag.addEventListener('click', () => {
                alert(`Status: ${verdict.label}\n\n--- LEGAL JUSTIFICATION ---\n${verdict.tag_reason.replace(/<[^>]*>/g, '')}`);
            });

            // 4. Inject into Page: Target the H3 or H4 element.
            const headerElement =
                linkElement.querySelector("h3") || 
                linkElement.querySelector("h4"); 
            
            if (headerElement) {
                // *** CRITICAL CHANGE: Use prepend() to insert the tag INSIDE 
                //     the header element, BEFORE the title text. ***
                headerElement.prepend(tag);
                
                injectedCount++;
            }
        }
    });
    console.log(
        `[FRONTEND] Injected ${injectedCount} credibility tags into the search results.`
    );
}