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
  const linkElements = document.querySelectorAll("a:has(h3)");
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

// --- 4. RENDERING LOGIC (Updated for Final Tags) ---
function injectVerdictsIntoPage(verdicts) {
  let injectedCount = 0;

  verdicts.forEach((verdict) => {
    const linkElement = CACHED_LINKS.get(verdict.url);

    if (linkElement && verdict.label) {
      // ... (BDI and tag creation remains the same) ...

      // --- Determine the CSS Class based on verdict status (NEW LOGIC) ---
      let tagClass = "tag-unscored-default"; // Default: UNSCORED

      if (verdict.label === "VERIFIED") {
        tagClass = "tag-verified-authority"; // Green
      } else if (verdict.label === "REPUTABLE") {
        tagClass = "tag-reputable-quality"; // Blue
      }
      // Note: We don't need 'tag-satire' or 'tag-bad' anymore, as we removed the subjective checks.
      // However, your CSS still has the legacy 'tag-bad' and 'tag-satire' classes.
      // We should use the new CSS classes established earlier (tag-verified-authority, tag-reputable-quality, tag-unscored-default)

      tag.className = `credible-tag ${tagClass}`;

      const injectionPoint = linkElement.querySelector("h3");

      if (injectionPoint) {
        injectionPoint.after(tag);
        injectedCount++;
      }
    }
  });
  console.log(
    `[FRONTEND] Injected ${injectedCount} credibility tags into the search results.`
  );
}
