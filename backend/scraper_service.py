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

    async with httpx.AsyncClient() as client:
        
        # --- ATTEMPT 1: FAST MODE (Render = False) ---
        # This takes 1-2 seconds. Works for 95% of news sites.
        print(f"🚀 Attempting Fast Scrape: {url}")
        fast_payload = {
            'api_key': SCRAPING_API_KEY,
            'url': url,
            'render': 'false',  # <--- SPEED OPTIMIZATION
            'autoparse': 'true' # Ask ScraperAPI to help find the main text
        }
        
        try:
            response = await client.get(SCRAPING_BASE_URL, params=fast_payload, timeout=15.0)
            if response.status_code == 200:
                raw_html = response.text
                cleaned_text = quick_clean_html(raw_html)
                
                # Validation: Did we actually get the article?
                if len(cleaned_text) > 600:
                    print("✅ Fast Scrape Success!")
                    return cleaned_text, "Success: Retrieved via Fast Mode."
                else:
                    print(f"⚠️ Fast scrape too short ({len(cleaned_text)} chars). Retrying with JS...")
            
        except Exception as e:
            print(f"⚠️ Fast scrape failed: {e}. Retrying...")

        # --- ATTEMPT 2: SLOW MODE (Fallback if Fast Mode failed) ---
        # This takes 15-20 seconds, but guarantees it works for tricky sites.
        print("🐢 Falling back to JS Rendering...")
        slow_payload = {
            'api_key': SCRAPING_API_KEY,
            'url': url,
            'render': 'true',   # <--- The "Heavy" Fix
            'timeout': 60.0
        }
        
        try:
            response = await client.get(SCRAPING_BASE_URL, params=slow_payload, timeout=60.0)
            response.raise_for_status()
            
            raw_html = response.text
            cleaned_text = quick_clean_html(raw_html)
            
            return cleaned_text, "Success: Content retrieved (JS Mode)."

        except httpx.HTTPStatusError as e:
            return None, f"HTTP Error {e.response.status_code}: Scraper blocked."
        except Exception as e:
            return None, f"Request Error: {e}"