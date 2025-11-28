import httpx
from decouple import config
from typing import Optional, Tuple
import os

# NOTE: Imports for BeautifulSoup and html2text are REMOVED as they caused errors.

# --- Configuration (assumes SCRAPING_API_KEY/URL are configured in .env) ---
SCRAPING_API_KEY = config('SCRAPING_API_KEY')
SCRAPING_BASE_URL = config('SCRAPING_BASE_URL', default='https://api.scraperapi.com/')

# --- Custom Exception ---
class ScrapingError(Exception):
    """Custom exception for scraping failures."""
    pass

# --- Core Scraping Service (FINAL, RAW TEXT VERSION) ---
async def fetch_article_content(url: str) -> Tuple[Optional[str], str]:
    """
    Fetches the full HTML content of a URL and returns it as raw text.
    The LLM Agent is now solely responsible for cleaning and isolating the article text from HTML noise.
    """
    if SCRAPING_API_KEY == 'YOUR_SCRAPING_SERVICE_API_KEY':
        return None, "Error: Scraping API key is not configured."

    payload = {
        'api_key': SCRAPING_API_KEY,
        'url': url,
        'render': 'true',  # Essential for modern, JavaScript-heavy news sites
        'timeout': 60.0    # Increased timeout for complex sites
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(SCRAPING_BASE_URL, params=payload, timeout=60.0)
            response.raise_for_status()
            
            # --- FINAL STRATEGY: RETURN RAW TEXT ---
            raw_content = response.text
            
            # Print for debugging the input the Agent receives
            print("\n--- DEBUG: RAW TEXT INPUT ---")
            print(raw_content[:1000]) 
            print("-----------------------------\n")
            
            # Returns the full, raw HTML/Text content. The 'cleaned' part of the docstring is now handled by the LLM.
            return raw_content, "Success: Content retrieved (Raw HTML/Text)."

        except httpx.HTTPStatusError as e:
            # Handles 4xx errors, including the 400 Malformed Request/Anti-bot rejection
            status = f"HTTP Error {e.response.status_code}: Blocked by anti-bot. Check URL/Key."
            return None, status
        except Exception as e:
            # Catch general Request Error (Timeout, Connection)
            status = f"Request Error: {e}"
            return None, status

# Example of testing the helper (run only if scraper_service.py is executed directly)
if __name__ == '__main__':
    import asyncio
    example_url = "https://en.wikipedia.org/wiki/India" 
    
    async def test_scraper():
        print(f"Testing scraper for: {example_url}")
        content, status = await fetch_article_content(example_url)
        print(f"Status: {status}")
        if content:
            print(f"Content Snippet: {content[:500]}...")
            
    # asyncio.run(test_scraper()) # Uncomment to run test locally