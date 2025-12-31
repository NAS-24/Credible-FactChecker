import uvicorn
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from urllib.parse import urlparse 
from pydantic import BaseModel, Field

# --- IMPORTS FROM YOUR EXISTING STRUCTURE ---
try:
    from credibility_sources import MVP_CREDIBILITY_DATA, DEFAULT_UNSCORED_REASON
except ImportError:
    MVP_CREDIBILITY_DATA = {}
    DEFAULT_UNSCORED_REASON = "Source not assessed."

# Import the existing Scraper Service
try:
    from scraper_service import fetch_article_content
except ImportError:
    print("⚠️ Warning: scraper_service.py not found. Tier 3 will fail.")
    async def fetch_article_content(url): return None, "Scraper module missing."

# --- IMPORT THE NEW PRODUCTION AGENT ---
from agentic_verifier import AgenticVerifier

# --- 1. APP CONFIG ---
app = FastAPI(title="Credible Production Backend", version="5.0-Groq-Tavily")

# Initialize the Groq+Tavily Agent
agent = AgenticVerifier()

# --- 2. CORS (Critical for Chrome Extension) ---
origins = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "https://www.google.com",
    "https://*.google.com", 
    "chrome-extension://*",
    "https://www.bing.com", 
    "https://bing.com",
    "https://credible-website.vercel.app",
    ] # Change this to your Extension ID for Web Store release

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. DATA MODELS ---

# For MVP Tags (Tier 1)
class LinkData(BaseModel):
    url: str
    domain: str

class CredibilityPayload(BaseModel):
    links: List[LinkData]
    query: Optional[str] = None

# For Tier 2 (Highlight & Verify)
class VerifyRequest(BaseModel):
    text: str

# For Tier 3 (Full Article)
class ArticleRequest(BaseModel):
    url: str

# --- 4. ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "active", "brain": "Llama-3.3-70B (Groq)", "eyes": "Tavily"}

# ==============================================================================
# FEATURE 1: MVP DOMAIN TAGGING (Tier 1)
# Preserved exactly from your old code so tags still work.
# ==============================================================================
@app.post("/api/check-credibility")
async def check_credibility_tags(payload: CredibilityPayload): 
    """
    Checks domains against internal Credibility Database (IFCN + Reputable).
    Used for visual tagging on Google Search Results.
    """
    response_data = []
    
    for item in payload.links:
        url = item.url
        domain_root = None
        verdict = "UNVERIFIED_PUBLISHER"
        label = "UNSCORED"
        reason = DEFAULT_UNSCORED_REASON 
        
        try:
            domain_root = urlparse(url).netloc.replace('www.', '').strip()
        except Exception:
            domain_root = None 

        if domain_root and domain_root in MVP_CREDIBILITY_DATA:
            domain_data = MVP_CREDIBILITY_DATA[domain_root]
            label = domain_data.get("tag_ui", "UNSCORED")
            
            if label == "VERIFIED":
                verdict = "IFCN_CERTIFIED_PUBLISHER"
            elif label == "REPUTABLE":
                verdict = "HIGH_EDITORIAL_STANDARD"
            
            reason = domain_data.get("tag_reason", reason)
            
        response_data.append({
            "url": url,
            "domain": domain_root,
            "verdict": verdict,
            "label": label,
            "tag_reason": reason
        })
    
    print(f"[MVP] Tagged {len(response_data)} links.")
    return response_data


# ==============================================================================
# FEATURE 2: AGENTIC VERIFICATION (Tier 2)
# Replaced old Gemini logic with new Groq/Tavily Agent.
# ==============================================================================
@app.post("/api/verify-text")
async def verify_text_endpoint(request: VerifyRequest):
    """
    Receives highlighted text -> Runs Agentic Verification (Groq + Tavily).
    """
    if not request.text:
        raise HTTPException(status_code=400, detail="No text provided")
    
    # Using the new agent method
    result = await agent.verify_claim_agentic(request.text)
    return result


# ==============================================================================
# FEATURE 3: FULL ARTICLE EXTRACTION (Tier 3)
# Combines your Scraper Service with Groq Extraction.
# ==============================================================================
@app.post("/api/extract-claims")
async def extract_claims_endpoint(request: ArticleRequest):
    """
    1. Fetches HTML using scraper_service
    2. Uses Groq to extract verifiable claims
    """
    # Step A: Fetch Content (Using your existing scraper code)
    article_content, status_msg = await fetch_article_content(request.url)
    
    if not article_content:
        raise HTTPException(status_code=424, detail=f"Scraper failed: {status_msg}")

    if len(article_content) < 100:
        raise HTTPException(status_code=400, detail="Article content too short to analyze.")

    # Step B: AI Extraction (Using new Groq Agent)
    claims = await agent.isolate_claims(article_content)
    
    return {"claims": claims}


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8000))
    # reload=False is safer for async loops in production
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)