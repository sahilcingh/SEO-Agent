import requests
import os


def search_competitors(query: str) -> dict:
    """
    Search Google for top-ranking pages on a given topic or keyword using
    Google Custom Search API. Use this to identify who the main competitors are
    for the page being audited.

    Args:
        query: The main topic or keyword to search (e.g. "best running shoes for beginners")

    Returns:
        A dictionary with the top search results including titles, URLs, and snippets.
    """
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    cx = os.environ.get("GOOGLE_CSE_ID", "")

    if not api_key or not cx:
        return {
            "note": "Google Custom Search not configured — skipping competitor analysis.",
            "results": [],
        }

    try:
        resp = requests.get(
            "https://www.googleapis.com/customsearch/v1",
            params={"key": api_key, "cx": cx, "q": query, "num": 5},
            timeout=15,
        )
        data = resp.json()

        if "error" in data:
            return {"error": data["error"].get("message", "API error"), "results": []}

        return {
            "query": query,
            "results": [
                {
                    "title": item.get("title", ""),
                    "url": item.get("link", ""),
                    "domain": item.get("displayLink", ""),
                    "snippet": item.get("snippet", ""),
                }
                for item in data.get("items", [])
            ],
        }
    except Exception as e:
        return {"error": str(e), "results": []}
