import os
import json
import asyncio
from decouple import config
from groq import AsyncGroq  # The Brain (Llama 3.3)
from tavily import TavilyClient # The Eyes (Search)
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional
from duckduckgo_search import DDGS # The Eyes (Search-Backup)

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
            self.ddg_client = DDGS() # <--- Initialize Backup Search

            # 2. Define Models
            self.verify_model = MODEL_NAME  # Big Brain (70B) for Accuracy
            self.fast_model = "llama-3.1-8b-instant" # Fast Brain (8B) for Speed

            print("✅ Production Agent Initialized (Groq + Tavily) + DUCKDUCKGO (Backup).")
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
    # INTERNAL: SEARCH TOOL (The "Eyes" - Master Version)
    # ------------------------------------------------------------------
    async def _perform_search(self, query: str) -> str:
        """
        1. Tries Tavily (Strict Mode with India Domains).
        2. If Tavily fails or runs out of credits, falls back to DuckDuckGo.
        """
        results = []
        
        # --- ATTEMPT 1: TAVILY (The "Ferrari") ---
        try:
            # print(f"🔍 Tavily Search: {query}")
            
            # Using asyncio to prevent blocking the server
            import asyncio
            response = await asyncio.to_thread(
                self.tavily_client.search,
                query=query,
                search_depth="basic",
                # Make sure INDIA_AUTHORITY_DOMAINS is defined in your file imports/constants
                include_domains=INDIA_AUTHORITY_DOMAINS, 
                max_results=5
            )
            
            for res in response.get('results', []):
                results.append(f"Source: {res['url']}\nContent: {res['content']}\n")
            
            # If we got results, return them immediately
            if results:
                return "\n".join(results)

        except Exception as e:
            print(f"⚠️ Tavily Failed ({e}). Switching to DuckDuckGo...")

        # --- ATTEMPT 2: DUCKDUCKGO (The "Spare Tire") ---
        try:
            print(f"🦆 DDG Fallback Search: {query}")
            from duckduckgo_search import AsyncDDGS
            
            async with AsyncDDGS() as ddgs:
                # DDG works differently, so we can't use 'include_domains' here easily.
                # We just do a broad search to ensure we get *some* evidence.
                ddg_results = await ddgs.text(query, max_results=5)
                
                for res in ddg_results:
                    results.append(f"Source: {res['href']}\nContent: {res['body']}\n")
                    
            return "\n".join(results)

        except Exception as ddg_e:
            print(f"❌ All searches failed: {ddg_e}")
            return ""

    # ------------------------------------------------------------------
    # TIER 2: VERIFY CLAIM (The "Brain")
    # ------------------------------------------------------------------
    async def verify_claim_agentic(self, claim_text: str) -> dict:
        if not self.llm_client:
            return {
                "verdict": "ERROR", 
                "confidence_score": 0.0, 
                "explanation": "Backend offline.", 
                "sources": []
            }

        # 1. FIRST SEARCH ATTEMPT (Using Failover Logic)
        # This will try Tavily -> If it fails -> Try DuckDuckGo
        evidence = await self._perform_search(claim_text)

        # 2. SELF-CORRECTION LOOP
        # If the first search returned nothing (from BOTH engines), try a better keyword.
        if not evidence or "No evidence found" in evidence:
            print("🔄 Evidence weak. Retrying with 'Fact Check' keywords...")
            
            # The retry ALSO uses the fallback logic (Infinite Free Search)
            evidence = await self._perform_search_with_fallback(f"fact check {claim_text} official data")

        # 3. REASONING (LLM Analysis)
        # (This part remains exactly the same as your code)
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
                model=self.verify_model, # Make sure to use the 70B model here
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )

            raw_json = json.loads(response.choices[0].message.content)
            
            # Helper to safely extract sources if the LLM put them in the text
            # (Optional safety step, your Pydantic model likely handles this)
            if "sources" not in raw_json: raw_json["sources"] = []

            return raw_json

        except Exception as e:
            print(f"⚠️ Verification Failed: {e}")
            return {
                "verdict": "UNVERIFIED", 
                "confidence_score": 0.0, 
                "explanation": f"Analysis failed: {str(e)}", 
                "sources": []
            }