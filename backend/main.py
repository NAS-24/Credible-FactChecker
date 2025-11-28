import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from urllib.parse import urlparse 
import os, sys
import httpx 
from decouple import config 
from pydantic import BaseModel, Field # For structured data input

try:
    from credibility_sources import MVP_CREDIBILITY_DATA, DEFAULT_UNSCORED_REASON
except ImportError:
    MVP_CREDIBILITY_DATA = {}
    DEFAULT_UNSCORED_REASON = "Source not assessed."



# --- PHASE 4 IMPORTS: Agent and Models ---
# The VerificationAgent class and its supporting model VerificationResult 
# are expected to be in the sibling file 'verification_agent.py'.
try:
    from verification_agent import VerificationAgent, VerificationResult
except ImportError:
    print("Warning: Could not import VerificationAgent. AI verification endpoint will be disabled.")
    VerificationAgent = None 
    # Placeholder classes to prevent hard crash
    class VerificationResult(BaseModel):
        verdict: str = ""
        explanation: str = ""
        citation: str = ""


# --- 1. FastAPI App Initialization & Config ---
app = FastAPI(title="Credible Hybrid Backend", version="4.0-Agentic-Core")

# Initialize the persistent agent instance
if VerificationAgent:
    verification_agent = VerificationAgent()
else:
    verification_agent = None


# Get API Key securely from the .env file
API_KEY = config('GOOGLE_FACT_CHECK_API_KEY', default='YOUR_FALLBACK_KEY')
FACT_CHECK_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"


# --- 2. CORS Configuration (CRITICAL) ---
origins = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "https://www.google.com",
    "https://*.google.com", 
    "chrome-extension://*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


# --- 3. Pydantic Data Models (Phase 4.4 and MVP) ---
class LinkData(BaseModel):
    url: str
    domain: str

class CredibilityPayload(BaseModel):
    links: List[LinkData]
    query: Optional[str] = None # The user's original search term

class ClaimIn(BaseModel):
    """Model to receive a single claim from the frontend."""
    claim: str

class AgenticVerificationResponse(BaseModel):
    """The structured output format for the Phase 4 Agentic Check."""
    claim_verdict: str
    explanation: str
    citation: str
    tier_used: str


# --- Phase 4.4 Helper Function for Tier 1: Legacy API Call ---
async def check_tier1_api(claim: str) -> Optional[dict]:
    """Performs the quick lookup against the legacy fact check database (Tier 1)."""
    params = {"query": claim, "key": API_KEY, "languageCode": "en-IN"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(FACT_CHECK_URL, params=params, timeout=4.0) 
            response.raise_for_status()
            data = response.json()

            if data.get("claims") and data["claims"][0].get("claimReview"):
                first_review = data["claims"][0]["claimReview"][0]
                return {
                    "verdict": first_review.get("textualRating", "VERIFIED"),
                    "source": first_review.get("publisher", {}).get("name", "Legacy Fact Check API")
                }
        except httpx.RequestError as e:
            print(f"[Tier 1 Error] Request failed: {e}")
            pass
    return None


# --- 4. MVP LEGACY ENDPOINT (Preserved for compatibility) ---
@app.post("/api/check-credibility")
async def check_credibility_legacy(payload: CredibilityPayload): 
    """
    Phase 1 MVP: Instant Tag Assignment
    Checks domains against the internal Credibility Database (IFCN + Reputable).
    """
    response_data = []
    
    # Loop through every link sent by the extension
    for item in payload.links:
        url = item.url
        domain_root = None
        
        # --- DEFAULT STATE (The "Safe" Baseline) ---
        # If we know nothing about the domain, we assign this neutral status.
        verdict = "UNVERIFIED_PUBLISHER"
        label = "UNSCORED"
        reason = DEFAULT_UNSCORED_REASON 
        
        # 1. Extract Domain
        try:
            # Simple extraction: 'https://www.bbc.com/news' -> 'bbc.com'
            domain_root = urlparse(url).netloc.replace('www.', '').strip()
        except Exception:
            domain_root = None 

        # 2. CHECK CREDIBILITY DATABASE (Tier 2 Check)
        # We check if this domain exists in our unified 'credibility_sources.py' file
        if domain_root and domain_root in MVP_CREDIBILITY_DATA:
            domain_data = MVP_CREDIBILITY_DATA[domain_root]
            
            # If found, we overwrite the default with the specific data
            # Example: label becomes "VERIFIED" or "REPUTABLE"
            label = domain_data.get("tag_ui", "UNSCORED")
            
            # Example: verdict becomes "IFCN_CERTIFIED_PUBLISHER"
            # We map the UI tag to a code status for your internal tracking
            if label == "VERIFIED":
                verdict = "IFCN_CERTIFIED_PUBLISHER"
            elif label == "REPUTABLE":
                verdict = "HIGH_EDITORIAL_STANDARD"
            
            # Example: reason becomes the specific blue/green HTML box
            reason = domain_data.get("tag_reason", reason)
            
        
        # 3. BUILD RESPONSE
        response_data.append({
            "url": url,
            "domain": domain_root,
            "verdict": verdict,   # For internal logic/analytics
            "label": label,       # The visual text (VERIFIED / REPUTABLE / UNSCORED)
            "tag_reason": reason  # The HTML content for the pop-up
        })
    
    print(f"[MVP] Processed {len(response_data)} links. Sending tags.")
    return response_data


# --- 5. NEW PHASE 4 CORE ENDPOINT (Hybrid Orchestrator) ---
@app.post("/api/check-agentic-claim", response_model=AgenticVerificationResponse, tags=["Verification-Agentic"])
async def verify_claim_agentic(data: ClaimIn):
    """
    Orchestrates the full Hybrid Verification Flow (Tier 1 Lookup -> Tier 2 Gemini Agent).
    """
    claim = data.claim

    if not verification_agent:
        raise HTTPException(status_code=503, detail="AI Verification Agent is not initialized. Check server logs.")
    
    # 1. Execute Tier 1: High-Confidence Lookup (Legacy API)
    tier1_result = await check_tier1_api(claim)
    
    pre_existing_evidence = None
    if tier1_result:
        # If Tier 1 found a result, create the strong context for the Agent
        pre_existing_evidence = (
            f"The static database search found a pre-existing verdict: "
            f"VERDICT: {tier1_result['verdict']} by SOURCE: {tier1_result['source']}."
        )
        tier_used = "Hybrid (Tier 1 Success)"
    else:
        # If no result, instruct the Agent to perform a filtered search
        pre_existing_evidence = "No pre-existing verdict was found. Rely exclusively on live, prioritized search evidence."
        tier_used = "Agentic (Tier 2 Search)"


    # 2. Call the Hybrid Gemini Agent (The Core Reasoning Engine)
    try:
        # Pass the claim and the contextual evidence to the Agent
        agent_output = verification_agent.check_claim(claim, pre_existing_evidence)
    except Exception as e:
        # Catch unexpected errors from the Agent/Gemini API
        raise HTTPException(
            status_code=500,
            detail=f"Internal Agent Error: Could not complete synthesis. {e}"
        )

    # 3. Final Response Consolidation
    # Note: Domain verdict is not needed for this new, comprehensive claim check response
    
    return AgenticVerificationResponse(
        claim_verdict=agent_output.get("verdict", "UNVERIFIED_PARSE_FAIL"),
        explanation=agent_output.get("explanation", "Agent output could not be parsed."),
        citation=agent_output.get("citation", "Agent Search/Citation Missing"),
        tier_used=tier_used
    )

# --- Pydantic Models for Phase 5.3 ---
class ArticleIn(BaseModel):
    """Input model to receive the URL for full article verification."""
    url: str

class CompositeVerdict(BaseModel):
    """Final output model for the full article check."""
    url: str
    total_claims_analyzed: int
    claims_breakdown: Dict[str, int] = Field(description="Count of verdicts (e.g., {'True': 2, 'False': 1, 'Misleading': 1}).")
    composite_verdict: str
    individual_results: List[Dict[str, str]]

# Add this import to the top of main.py
from scraper_service import fetch_article_content 

# --- New Endpoint for Full Article Verification (Phase 5.3) ---
@app.post("/api/verify-article-full", response_model=CompositeVerdict, tags=["Full-Article-Check"])
async def verify_full_article(data: ArticleIn):
    url = data.url
    
    if not verification_agent:
        raise HTTPException(status_code=503, detail="AI Verification Agent is not initialized.")

    # 1. FETCH CONTENT (Phase 5.1) - RESTORED ORIGINAL CALL
    # This line calls the external scraping API
    article_content, status_message = await fetch_article_content(url) 
    
    if not article_content:
        # This triggers the 424 error if the scraper is blocked or fails
        raise HTTPException(status_code=424, detail=f"Failed to retrieve article content: {status_message}")
        
    # 2. ISOLATE CLAIMS (Phase 5.2) - The Agent now runs on the actual content retrieved from the web
    claims_list = verification_agent.isolate_claims(article_content) 
    
    if not claims_list:
        # This triggers the 404 error if the Agent finds no claims
        raise HTTPException(status_code=404, detail="No verifiable factual claims could be isolated from the article content.")
    
    # 3. VERIFY EACH CLAIM (Phase 4.3 Loop) - This is the final verification step.
    individual_results = []
    verdict_counts = {"True": 0, "False": 0, "Misleading": 0, "Unverified": 0, "CRITICAL_ERROR": 0}
    
    for claim in claims_list:
        verdict_result = verification_agent.check_claim(claim=claim, pre_existing_evidence=None)
        
        verdict = verdict_result.get('verdict', 'CRITICAL_ERROR').split(':')[0].strip()
        verdict_counts[verdict] = verdict_counts.get(verdict, 0) + 1
        
        individual_results.append({
            "claim": claim,
            "verdict": verdict,
            "citation": verdict_result.get('citation', 'N/A')
        })

    # 4. SYNTHESIZE FINAL COMPOSITE VERDICT
    total = len(claims_list)
    false_count = verdict_counts.get("False", 0)
    true_count = verdict_counts.get("True", 0)
    
    if false_count > true_count and false_count > verdict_counts["Misleading"]:
        composite_verdict = f"CONTENT CONTAINS MAJOR FALSE CLAIMS ({false_count} False)"
    elif true_count >= total * 0.75: 
        composite_verdict = "HIGHLY RELIABLE (Claims largely verified)"
    elif verdict_counts["Misleading"] > 0 or verdict_counts["Unverified"] > 0:
        composite_verdict = "CONTEXT REQUIRED (Verification is Mixed/Misleading)"
    else:
        composite_verdict = "INCONCLUSIVE (Default)"
        
    # 5. RETURN FINAL STRUCTURED RESPONSE
    return CompositeVerdict(
        url=url,
        total_claims_analyzed=total,
        claims_breakdown=verdict_counts,
        composite_verdict=composite_verdict,
        individual_results=individual_results
    )

if __name__ == "__main__":
    # The default port for local testing is 8000. 
    port = int(os.environ.get('PORT', 8000))
    # CRITICAL: Change reload=True to reload=False for production safety.
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)