import os
from google import genai
from google.genai import types
from decouple import config
from pydantic import BaseModel, Field # We'll need Pydantic for structured output later
from typing import List, Optional, Tuple
import json
import time

# --- AUTHORITATIVE DOMAINS (FOR PHASE 4.2 FILTERING) ---
INDIA_AUTHORITY_DOMAINS = [
    "altnews.in",
    "boomlive.in",
    "thequint.com/news/webqoof",
    "factly.in",
    "pib.gov.in", # Press Information Bureau (Government)
    "who.int",   # WHO
    "cdc.gov",   # CDC
]

#--------------------------------------------------------------------------------------------------------------------#

# --- New Model for a Single Factual Statement ---
class FactualClaim(BaseModel):
    """Represents a single, verifiable statement extracted from an article."""
    claim_text: str = Field(description="The exact sentence or phrase that is a factual claim, copied verbatim from the source text.")
    context: str = Field(description="A brief, one-sentence summary of the section the claim was found in.")

# --- Root Model for the Final List of Claims ---
class ClaimList(BaseModel):
    """The final structured list containing all claims to be verified."""
    claims: List[FactualClaim] = Field(description="A list containing 3 to 5 of the most critical and verifiable factual statements from the article.")

#--------------------------------------------------------------------------------------------------------------------#


# --- STRUCTURED OUTPUT SCHEMA (FOR PHASE 4.3 PARSING) ---
# We define the required output structure in advance to enforce reliable results.
class VerificationResult(BaseModel):
    verdict: str = Field(description="The final classification: True, False, Misleading, or Unverified.")
    explanation: str = Field(description="A concise summary of the evidence found to support the verdict.")
    citation: str = Field(description="The URL or name of the primary authoritative source used for grounding.")


class VerificationAgent:
    """
    The core Agent responsible for grounded fact-checking using the Gemini API.
    """
    def __init__(self):
        """
        Initializes the Gemini client, securing the API key and setting the core System Instruction.
        """
        try:
            # 1. Secure Access: Retrieve GEMINI_API_KEY from .env
            api_key = config("GEMINI_API_KEY")
            if not api_key:
                # Raise a specific error if the environment variable is missing
                raise ValueError("GEMINI_API_KEY not found in .env file. Please check backend/.env")
            
            # 2. Client Initialization
            self.client = genai.Client(api_key=api_key)
            self.model = 'gemini-2.5-pro' # A reasoning model for synthesis   #5RPM/100RPD
            self.priority_domains = INDIA_AUTHORITY_DOMAINS

            # 3. Define the Agent's Core Role (System Instruction)
            self.system_instruction = (
                "You are an unbiased, evidence-based fact-checker named 'Credible'. "
                "Your sole purpose is to verify factual claims based ONLY on the evidence "
                "provided by your Search Tool. Do not use prior knowledge. "
                "Your reasoning must prioritize transparency and verifiability."
            )
            
            print("✅ VerificationAgent initialized successfully. (Phase 4.1 complete)")

        except Exception as e:
            print(f"❌ Error initializing VerificationAgent: {e}")
            self.client = None

  # --- PHASE 5.2 IMPLEMENTATION START ---

    def isolate_claims(self, article_content: str) -> List[str]: # <--- Return List[str] remains
        """
        Uses a specialized Gemini Agent with a retry loop to ingest noisy text and extract claims.
        """
        if not self.client:
            return []
            
        # 1. Define the extraction prompt (FINAL SIMPLIFIED, TEXT-ONLY PROMPT)
        extraction_prompt = f"""
        **TASK:** You are an expert data extraction agent. Your job is to process the text below.
        
        **INSTRUCTIONS:**
        1. The ARTICLE CONTENT may contain raw HTML. Ignore all formatting, navigation, and code.
        2. Read the provided content carefully.
        3. **Extract 1 ** of the most critical, distinct, and verifiable factual statements from the core narrative of the article.
        4. **CRITICAL:** Your response MUST be a single, raw object containing an array named 'claims', where each item has 'claim_text' and 'context' fields.
        5. Do NOT include any prose, commentary, or Markdown fences (```).
        
        **ARTICLE CONTENT:**
        ---
        {article_content[:32000]} 
        ---
        """

        # 2. Configure the Gemini API call
        config = types.GenerateContentConfig(
            # System instruction is removed as it was confusing the model.
            tools=[], 
            temperature=0.1
        )
        
        # --- FINAL FIX: IMPLEMENT RETRY LOGIC (Max 3 attempts) ---
        MAX_RETRIES = 3
        
        for attempt in range(MAX_RETRIES):
            try:
                # 3. Execute the extraction call (using the configured self.model, which is flash)
                response = self.client.models.generate_content(
                    model=self.model, 
                    contents=[extraction_prompt],
                    config=config,
                )
                
                # Check for a null/empty response
                if not response.text:
                    raise ValueError("Received empty text response from Gemini API.")
                
                # 4. Manual Parsing: Read raw text and clean off Markdown formatting
                response_text = response.text.strip()

                # CRITICAL FIX 1: Robustly remove Markdown fences and surrounding text
                start_index = response_text.find('{')
                end_index = response_text.rfind('}')
                if start_index != -1 and end_index != -1:
                    response_text = response_text[start_index : end_index + 1]
                else:
                    # If a clean JSON object is not found, raise an error to trigger a retry
                    raise ValueError("Agent failed to generate recognizable JSON structure after cleanup.")


                # 5. Load and Validate the clean JSON
                raw_data = json.loads(response_text) 
                # Validate against Pydantic model (ClaimList is already defined at the top)
                parsed_result: ClaimList = ClaimList(**raw_data)

                # 6. Final return: Extract the clean string from the Pydantic model
                return [claim.claim_text for claim in parsed_result.claims] # <<< FINAL, CORRECT RETURN

            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    print(f"❌ Extraction Agent Final Error (Phase 5.2): {e}")
                    return []
                else:
                    print(f"⚠️ Extraction Agent temporary failure, retrying: {e}")
                    time.sleep(2)

        return [] # Fallback
    
    # --- PHASE 5.2 IMPLEMENTATION END ---

    # --- PHASE 4.2 Placeholder Method ---
    def generate_grounding_prompt(self, claim: str, pre_existing_evidence: str = None) -> str:
        """
        Constructs the detailed prompt for the Gemini model, applying the Authority Filter 
        and demanding the raw JSON output format via text instruction.
        """
        domain_list = ", ".join(self.priority_domains)
        
        grounding_prompt = f"""
        **VERIFICATION TASK:** You must verify the following factual claim. You are required to use the Search Tool to gather evidence.
        
        **CLAIM:** "{claim}"
        
        **AUTHORITY GUIDANCE (The India Filter):**
        When evaluating search results, you **must prioritize** evidence found from the following authoritative sources. If these sources offer a verdict or strong evidence, use it as the definitive conclusion for your reasoning.
        
        PRIORITY DOMAINS: {domain_list}
        
        **PRE-EXISTING CONTEXT (Tier 1 Check):** {pre_existing_evidence if pre_existing_evidence else 'None.'}
        
        **FINAL RESPONSE FORMAT:**
        You MUST respond with a **single, raw JSON OBJECT**. 
    
        **CRITICAL:** DO NOT include any prose, commentary, or Markdown formatting of any kind. 
        Specifically, do NOT include ```json or ``` markers. Respond with the JSON object itself.

        {{
            "verdict": "CLASSIFICATION (e.g., True, False)",
            "explanation": "SUMMARY_OF_EVIDENCE",
            "citation": "SOURCE_URL_OR_NAME"
         }}
         """
        # Note: The specific JSON structure example is included here to reinforce the format.
        return grounding_prompt.strip()
    
   # --- PHASE 4.3: CORE API CALL IMPLEMENTATION (FINAL, RESILIENT VERSION) ---
    def check_claim(self, claim: str, pre_existing_evidence: Optional[str] = None) -> dict:
        if not self.client:
            return {"verdict": "ERROR", "explanation": "Agent not initialized.", "citation": "System Error"}
            
        full_prompt = self.generate_grounding_prompt(claim, pre_existing_evidence)

        # 2. Configure the Gemini API call (Standard, fixed configuration)
        config = types.GenerateContentConfig(
            tools=[{"google_search": {}}],  # Search Tool remains ENABLED
            system_instruction=self.system_instruction, 
            temperature=0.1
        )

        try:
            # 3. Execute the API call
            response = self.client.models.generate_content(
                model=self.model,
                contents=[full_prompt],
                config=config,
            )
            
            # 4. Manual Parsing: Read raw text and clean off Markdown formatting
            response_text = response.text.strip()
            
            # CRITICAL FIX: If the output starts with Markdown fences (```json or ```), strip the first and last lines.
            if response_text.startswith('```'):
                # This handles the common case where the model wraps the JSON in fences.
                # It splits the text by line and rejoins without the first (```json) and last (```) line.
                response_text = '\n'.join(response_text.split('\n')[1:-1]).strip()

            # 5. Load and Validate the clean JSON (This is where the JSONDecodeError was previously happening)
            raw_data = json.loads(response_text) 
            
            # 6. Validate against Pydantic model (for safety and type coercion)
            parsed_result = VerificationResult(**raw_data)
            
            return {
                "verdict": parsed_result.verdict,
                "explanation": parsed_result.explanation,
                "citation": parsed_result.citation,
            }

        except json.JSONDecodeError:
            # Catch JSON failure after stripping, meaning the content inside was also bad.
            return {
                "verdict": "CRITICAL_ERROR",
                "explanation": f"JSON Parsing Error: Agent failed to produce valid JSON. Raw start: {response_text[:100]}...",
                "citation": "Gemini Output Format Failure"
            }
        except Exception as e:
            # Catch general API failure
            return {
                "verdict": "CRITICAL_ERROR",
                "explanation": f"Gemini API or Request failed: {e}",
                "citation": "Gemini Failure"
            }
    # --- END FINAL CORRECTED check_claim ---