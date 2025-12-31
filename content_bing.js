// content_bing.js - NUCLEAR CLICK VERSION
console.log("Credible: Bing Content Script Loaded!");

// --- POPUP DISPLAY LOGIC (SHADOW DOM VERSION) ---
function showPopup(tagElement, htmlContent) {
  console.log("[BING] Creating Shadow DOM Popup...");

  // 1. Clean up old popups (Remove the Host)
  const existingHost = document.querySelector("#credible-popup-host");
  if (existingHost) existingHost.remove();

  // 2. Create the Shadow Host (The 'Bubble' Container)
  const host = document.createElement("div");
  host.id = "credible-popup-host";
  
  // High Z-index on the host itself ensures it sits on top of Bing
  Object.assign(host.style, {
    position: "absolute",
    zIndex: "2147483647",
    top: "0",
    left: "0",
    width: "0",
    height: "0"
  });

  // 3. Attach Shadow Root (Open mode allows us to inspect it if needed)
  const shadow = host.attachShadow({ mode: "open" });

  // 4. Calculate Position relative to the page
  const rect = tagElement.getBoundingClientRect();
  const topPos = rect.bottom + window.scrollY + 10;
  const leftPos = rect.left + window.scrollX;

  // 5. Create the Popup Content INSIDE the Shadow DOM
  const popupContent = document.createElement("div");
  
  // Style the popup (These styles are PROTECTED from Bing)
  Object.assign(popupContent.style, {
      position: "absolute",
      top: `${topPos}px`,
      left: `${leftPos}px`,
      width: "320px",
      backgroundColor: "#ffffff",
      color: "#333333",
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "15px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      fontFamily: "Segoe UI, Arial, sans-serif",
      fontSize: "13px",
      lineHeight: "1.5",
      textAlign: "left"
  });

  // 6. Inject HTML Content
  // We explicitly sanitize or trust the HTML from backend
  popupContent.innerHTML = htmlContent || "<strong>No details provided.</strong>";

  // 7. Append to Shadow Root
  shadow.appendChild(popupContent);

  // 8. Append Host to the ROOT of the document (documentElement), not body
  // This avoids overflow:hidden issues on the body tag
  document.documentElement.appendChild(host);
  console.log("[BING] Shadow Popup appended to <HTML>");

  // 9. Close Logic
  setTimeout(() => {
      document.addEventListener("click", function close(event) {
          // Note: Events inside Shadow DOM are retargeted. 
          // We simply check if the click was NOT on our host.
          if (host.contains(event.target)) return;
          
          host.remove();
          document.removeEventListener("click", close);
      });
  }, 200);
}

// --- CONFIGURATION ---
const BACKEND_ENDPOINT = "https://credible-factchecker.onrender.com/api/check-credibility";
const CACHED_LINKS = new Map();

// --- HELPER: DECODE BING REDIRECTS ---
function getRealUrl(rawUrl) {
    try {
        if (rawUrl.includes("bing.com/ck/a?") || rawUrl.includes("bing.com/aclk?")) {
            const urlObj = new URL(rawUrl);
            let uParam = urlObj.searchParams.get("u");
            if (uParam) {
                if (uParam.startsWith("a1")) uParam = uParam.substring(2); 
                return atob(uParam.replace(/-/g, '+').replace(/_/g, '/'));
            }
        }
        return rawUrl;
    } catch (e) {
        return rawUrl;
    }
}

// --- MAIN SCANNER ---
function mainExecution() {
    const candidates = document.querySelectorAll("h2, h3, li.b_algo h2 a"); 
    let searchResults = [];

    candidates.forEach((element) => {
        let link = element.querySelector("a") || element.closest("a");

        if (link && link.href) {
            const realUrl = getRealUrl(link.href);

            try {
                const urlObj = new URL(realUrl); 
                let hostname = urlObj.hostname;
                hostname = hostname.replace(/^www\./, ""); 

                if (CACHED_LINKS.has(realUrl)) return;

                if (realUrl.startsWith("http") && 
                    !hostname.includes("bing.com") && 
                    !hostname.includes("microsoft.com")) {
                    
                    searchResults.push({ url: realUrl, domain: hostname });
                    CACHED_LINKS.set(realUrl, element); 
                }
            } catch (error) { }
        }
    });

    if (searchResults.length > 0) {
        const qParam = new URLSearchParams(window.location.search).get("q");
        const query = qParam ? decodeURIComponent(qParam.replace(/\+/g, " ")) : "";
        sendDataToBackend(searchResults, query);
    }
}

// --- BACKEND ---
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

// --- RENDERER (THE FIX IS HERE) ---
function injectVerdictsIntoPage(verdicts) {
  verdicts.forEach((verdict) => {
    const titleElement = CACHED_LINKS.get(verdict.url);

    if (titleElement && verdict.label) {
      
      let tagClass = "tag-unscored-default"; 
      const label = verdict.label.toUpperCase(); 

      if (label === "VERIFIED" || label === "HIGH") {
          tagClass = "tag-verified-authority"; 
      } else if (label === "REPUTABLE") {
          tagClass = "tag-reputable-quality"; 
      } 

      const tag = document.createElement("span");
      tag.className = `credible-tag ${tagClass}`;
      
      // --- FORCE TAG STYLES (Ensure it's clickable) ---
      // This makes sure the tag sits ON TOP of any invisible links
      Object.assign(tag.style, {
          position: "relative", 
          zIndex: "1000",
          cursor: "pointer",
          display: "inline-flex",
          marginLeft: "8px"
      });

      const bdiElement = document.createElement("bdi");
      bdiElement.textContent = verdict.label;
      tag.appendChild(bdiElement);

      // --- NUCLEAR CLICK HANDLER ---
      const handleInteraction = (event) => {
          // 1. Kill the event immediately so Bing doesn't see it
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation(); // The Nuclear Option
          
          console.log("[BING] Tag Clicked!"); // Check console to verify

          const reason = verdict.tag_reason || verdict.explanation || "";
          showPopup(tag, reason);
          
          return false;
      };

      // Listen to both click and mousedown to catch it before Bing does
      tag.addEventListener("click", handleInteraction, true); // true = capture phase
      tag.addEventListener("mousedown", handleInteraction, true);

      if (titleElement) {
         titleElement.appendChild(tag);
      }
    }
  });
}

// --- INITIALIZATION ---
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mainExecution);
} else {
    mainExecution();
}

// Aggressive Polling for Speed
const rapidCheck = setInterval(mainExecution, 500);
setTimeout(() => clearInterval(rapidCheck), 5000); // Stop rapid check after 5s

// Normal Observer
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
const observer = new MutationObserver(debounce(() => {
    mainExecution();
}, 200)); 
observer.observe(document.body, { childList: true, subtree: true });