import os
import json
import asyncio
from decouple import config
from groq import AsyncGroq  # The Brain (Llama 3.3)
from tavily import TavilyClient # The Eyes (Search)
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional
from urllib.parse import urlparse  # <--- NEW IMPORT

# --- CONFIGURATION ---
MODEL_NAME = "llama-3.3-70b-versatile" # Fast, Free, Smart

INDIA_AUTHORITY_DOMAINS = [
    # 1. Fact Checkers (For debunking)
    "altnews.in", "boomlive.in", "thequint.com", "factly.in", "vishvasnews.com",
    
    # 2. Government & Official (For data)
    "pib.gov.in", "who.int", "rbi.org.in", "sci.gov.in", # Supreme Court of India
    
    # 3. Tier 1 Reputable News (For breaking events)
    "thehindu.com", "indianexpress.com", "ndtv.com", 
    "livemint.com", "timesofindia.indiatimes.com", "hindustantimes.com",
    "reuters.com", "bbc.com", "ptinews.com" # Press Trust of India
]

# --- NEW HELPER FUNCTION: BAD URL FILTER ---
def is_valid_article_url(url: str) -> bool:
    """
    Filters out sitemaps, categories, homepages, and non-article pages.
    Returns True if the URL looks like a specific news article.
    """
    bad_patterns = [
        "/sitemap", "/category/", "/topic/", "/tags/", 
        "/search", "/index", "facebook.com", "twitter.com", 
        "instagram.com", "youtube.com", "reddit.com"
    ]
    
    # 1. Block known bad patterns
    if any(pattern in url.lower() for pattern in bad_patterns):
        return False

    # 2. Block root domains (e.g., just "timesofindia.indiatimes.com/")
    try:
        parsed = urlparse(url)
        # If path is empty or just "/", it's a homepage, not an article
        if len(parsed.path) < 2 or parsed.path == "/":
            return False
    except:
        return False
        
    return True


# --- PYDANTIC MODELS (Data Safety) ---
class FactualClaim(BaseModel):
    claim_text: str = Field(description="The exact sentence extracted from text.")
    context: str = Field(description="Brief context summary.")

class ClaimList(BaseModel):
    claims: List[FactualClaim]

class VerificationResult(BaseModel):
    verdict: str = Field(description="VERIFIED, FALSE, MISLEADING, or UNVERIFIED")
    confidence_score: float = Field(description="0.0 to 1.0 confidence.")
    explanation: str = Field(description="Concise proof summary.")
    sources: List[str] = Field(description="List of supporting URLs.")

# --- THE AGENT CLASS ---
class AgenticVerifier:
    def __init__(self):
        try:
            # 1. Initialize Clients
            self.llm_client = AsyncGroq(api_key=config("GROQ_API_KEY"))
            self.search_client = TavilyClient(api_key=config("TAVILY_API_KEY"))
            
            # 2. Define Models
            self.verify_model = MODEL_NAME  # Big Brain (70B) for Accuracy
            self.fast_model = "llama-3.1-8b-instant" # Fast Brain (8B) for Speed
            
            print("✅ Production Agent Initialized (Groq + Tavily).")
        except Exception as e:
            print(f"❌ Init Error: {e}")
            self.llm_client = None

    # ------------------------------------------------------------------
    # TIER 3: EXTRACT CLAIMS (Restored Logic)
    # ------------------------------------------------------------------
    async def isolate_claims(self, article_content: str) -> List[str]:
        """
        Scans a full article and extracts 3-5 verifiable factual claims.
        """
        if not self.llm_client: return []

        # Limit text to 15k chars to prevent "heavy" processing
        shortened_text = article_content[:15000]

        system_instruction = (
            "You are an expert data extraction agent. "
            "Extract 3-5 distinct, verifiable factual claims from the text. "
            "Ignore opinions. Return JSON only."
        )

        prompt = f"""
        **TEXT TO ANALYZE:**
        {shortened_text}
        
        **OUTPUT FORMAT (JSON):**
        {{
            "claims": [
                {{"claim_text": "Exact quote 1", "context": "Context 1"}},
                {{"claim_text": "Exact quote 2", "context": "Context 2"}}
            ]
        }}
        """

        try:
            # ⭐ CRITICAL CHANGE: Using the FAST MODEL here
            response = await self.llm_client.chat.completions.create(
                model=self.fast_model,  # <--- Using 8b-instant
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}, 
                temperature=0.1 # Low temp for speed
            )
            
            # Parse & Validate
            raw_json = json.loads(response.choices[0].message.content)
            validated_data = ClaimList(**raw_json) 
            
            return [c.claim_text for c in validated_data.claims]

        except Exception as e:
            print(f"⚠️ Extraction Failed: {e}")
            return []

    # ------------------------------------------------------------------
    # INTERNAL: SEARCH TOOL (The "Eyes") - UPDATED LOGIC HERE
    # ------------------------------------------------------------------
    async def _perform_search(self, query: str) -> str:
        try:
            # 1. ENHANCE QUERY to force deep links (news reports), not generic pages
            enhanced_query = f"{query} news report article 2024 2025"
            print(f"🔎 Searching (Enhanced): {enhanced_query}")

            response = await asyncio.to_thread(
                self.search_client.search,
                query=enhanced_query,
                search_depth="basic",
                include_domains=INDIA_AUTHORITY_DOMAINS, # Hard Filter
                max_results=8 # Increase fetch size since we might filter some out
            )
            
            context = []
            valid_count = 0

            # 2. FILTER LOOP
            for result in response.get('results', []):
                url = result.get('url', '')
                
                # Check if URL is a valid article (not sitemap/home)
                if is_valid_article_url(url):
                    context.append(f"Source: {url}\nContent: {result['content']}\n")
                    valid_count += 1
                else:
                    print(f"🗑️ Skipped Bad URL: {url}")
                
                # Stop after we have 3 good sources to save context window
                if valid_count >= 3:
                    break
            
            return "\n".join(context) if context else ""
        except Exception as e:
            print(f"⚠️ Search Error: {e}")
            return ""

    # ------------------------------------------------------------------
    # TIER 2: VERIFY CLAIM (The "Brain")
    # ------------------------------------------------------------------
    async def verify_claim_agentic(self, claim_text: str) -> dict:
        if not self.llm_client:
            return VerificationResult(verdict="ERROR", confidence_score=0.0, explanation="Offline", sources=[]).dict()

        # 1. First Search Attempt
        evidence = await self._perform_search(claim_text)

        # 2. Self-Correction Loop (Simple Agentic Behavior)
        # If no evidence found (or all filtered out), try a broader keyword search
        if not evidence:
            print("🔄 Evidence weak. Retrying with 'Fact Check' keywords...")
            # Try searching specifically for fact checks if normal news fails
            evidence = await self._perform_search(f"fact check {claim_text} official data")

        # 3. Reasoning with Groq
        system_instruction = (
            "You are Credible, a strict fact-checking AI. "
            "Compare the Claim vs Evidence. "
            "If evidence is from trusted sources (PIB, AltNews), trust it implicitly. "
            "Output JSON."
        )

        prompt = f"""
        **CLAIM:** "{claim_text}"
        
        **EVIDENCE:**
        {evidence[:6000] if evidence else "No direct evidence found."}
        
        **INSTRUCTIONS:**
        - VERIFIED: Evidence confirms the claim.
        - FALSE: Evidence contradicts the claim.
        - MISLEADING: Claim is partially true but misses context.
        - UNVERIFIED: No matching evidence found.
        
        **REQUIRED JSON FORMAT:**
        {{
            "verdict": "VERIFIED" | "FALSE" | "MISLEADING" | "UNVERIFIED",
            "confidence_score": 0.9,
            "explanation": "2 sentence summary.",
            "sources": ["extracted_url_1"]
        }}
        """

        try:
            response = await self.llm_client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )

            raw_json = json.loads(response.choices[0].message.content)
            
            # Pydantic Validation ensures safe output for your Frontend
            result = VerificationResult(**raw_json)
            return result.dict()

        except ValidationError as e:
            print(f"⚠️ Validation Error: {e}")
            return {
                "verdict": "UNVERIFIED", 
                "confidence_score": 0.0,
                "explanation": "AI output format invalid.", 
                "sources": []
            }
        except Exception as e:
            print(f"⚠️ Verification Failed: {e}")
            return {
                "verdict": "UNVERIFIED", 
                "confidence_score": 0.0,
                "explanation": "Analysis failed.", 
                "sources": []
            }