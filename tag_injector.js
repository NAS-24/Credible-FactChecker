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
window.onload = function () {
  // 2a. Extract User Query FIRST
  const userQuery = getUserSearchQuery();
  console.log(`User Query Extracted: ${userQuery || "N/A"}`);
   
  console.log("Page has loaded. Starting link extraction...");

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
};

// --- 3. Communication Function ---
// Now sends a combined payload (links + single query)
async function sendDataToBackend(data, userQuery) {
  try {
    console.log(
      `[FRONTEND] Sending ${data.length} items to backend at ${BACKEND_ENDPOINT}...`
    );

    // Build the combined payload that matches the FastAPI Pydantic model
    const payload = {
      links: data,
      query: userQuery,
    };

    const response = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), // Send the combined object
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const verdicts = await response.json();

    console.log("-----------------------------------------");
    console.log(`[FRONTEND] SUCCESS! Received ${verdicts.length} verdicts.`);
    console.log("FULL VERDICTS ARRAY:", verdicts);

    // Phase 3: Display the Tags
    injectVerdictsIntoPage(verdicts);
  } catch (error) {
    console.error(
      "[FRONTEND] Error communicating with backend. Is the FastAPI server running?",
      error
    );
  }
}

// --- 4. RENDERING LOGIC (FINAL PRODUCTION VERSION) ---
function injectVerdictsIntoPage(verdicts) {
    let injectedCount = 0;

    verdicts.forEach((verdict) => {
        const linkElement = CACHED_LINKS.get(verdict.url);

        // Check if a tag should be displayed (must have a valid link and a label, which is always true unless UNSCORED)
        if (linkElement && verdict.label) {
            
            // 1. Determine the CSS Class based on the FINAL 'label'
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

            // 3. Attach Click/Pop-up Listener (UX/Legal Compliance)
            tag.addEventListener('click', () => {
                // IMPORTANT: This uses the 'tag_reason' field which contains the styled HTML for the pop-up box.
                // In a production extension, you would replace this 'alert' with a custom modal function.
                
                // For demonstration, we show the reason content:
                alert(`Status: ${verdict.label}\n\n--- LEGAL JUSTIFICATION ---\n${verdict.tag_reason.replace(/<[^>]*>/g, '')}`);
            });


            // 4. Inject into Page
            const injectionPoint =
                linkElement.querySelector("h3") || 
                linkElement.querySelector("h4"); // for Google News;
                linkElement; // <<< CRITICAL ADDITION: Use the main anchor link as a fallback injection point.
            
            if (injectionPoint) {
                // If it found a header, inject after the header. If it used the linkElement, inject after the link.
                if (injectionPoint === linkElement) {
                    // If we use the raw link element, inject *after* the element to prevent disrupting the link.
                    linkElement.after(tag);
                } else {
                    // If we found the h3/h4, inject after the header (inside the link context).
                    injectionPoint.after(tag);
                }
                    
                injectedCount++;
            }
        }
    });
    console.log(
        `[FRONTEND] Injected ${injectedCount} credibility tags into the search results.`
    );
}