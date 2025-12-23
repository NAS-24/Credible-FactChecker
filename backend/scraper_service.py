import httpx
import re  # <--- Built-in Python library (No install needed)
from decouple import config
from typing import Optional, Tuple

# --- Configuration ---
SCRAPING_API_KEY = config('SCRAPING_API_KEY')
SCRAPING_BASE_URL = config('SCRAPING_BASE_URL', default='https://api.scraperapi.com/')

# --- Helper: Lightweight HTML Cleaner ---
def quick_clean_html(raw_html: str) -> str:
    """
    Strips HTML tags and scripts using standard Regex.
    This prevents the LLM from filling up on CSS/JS garbage.
    """
    if not raw_html: return ""
    
    # 1. Remove <script> and <style> blocks entirely
    #    (The content inside them is useless for fact-checking)
    clean_text = re.sub(r'<(script|style).*?>.*?</\1>', '', raw_html, flags=re.DOTALL)
    
    # 2. Remove all other HTML tags (<div...>, <a...>, etc.)
    clean_text = re.sub(r'<.*?>', ' ', clean_text)
    
    # 3. Collapse multiple spaces/newlines into single spaces
    clean_text = ' '.join(clean_text.split())
    
    return clean_text

# --- Core Scraping Service ---
async def fetch_article_content(url: str) -> Tuple[Optional[str], str]:
    if SCRAPING_API_KEY == 'YOUR_SCRAPING_SERVICE_API_KEY':
        return None, "Error: Scraping API key is not configured."

    payload = {
        'api_key': SCRAPING_API_KEY,
        'url': url,
        'render': 'true',  # Essential for JS sites
        'timeout': 60.0
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(SCRAPING_BASE_URL, params=payload, timeout=60.0)
            response.raise_for_status()
            
            raw_html = response.text
            
            # --- CRITICAL IMPROVEMENT ---
            # We clean the text BEFORE sending to the LLM.
            # This ensures the 25,000 char limit captures the ARTICLE, not the MENU.
            cleaned_text = quick_clean_html(raw_html)
            
            print("\n--- DEBUG: CLEANED TEXT INPUT ---")
            print(cleaned_text[:500]) 
            print("---------------------------------\n")
            
            return cleaned_text, "Success: Content retrieved and cleaned."

        except httpx.HTTPStatusError as e:
            status = f"HTTP Error {e.response.status_code}: Blocked by anti-bot. Check URL/Key."
            return None, status
        except Exception as e:
            status = f"Request Error: {e}"
            return None, status