import requests
import json
import re
from bs4 import BeautifulSoup


def extract_schema(url: str) -> dict:
    """
    Extract all structured data from a webpage: JSON-LD schema types,
    Open Graph tags, and Twitter Card tags.

    Args:
        url: The full URL of the page to analyze

    Returns:
        A dictionary with all structured data found on the page.
    """
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; SEOAgent/1.0)"}
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")

        # JSON-LD
        json_ld_types = []
        json_ld_raw = []
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
                json_ld_raw.append(data)
                schema_type = data.get("@type", "Unknown")
                if isinstance(schema_type, list):
                    json_ld_types.extend(schema_type)
                else:
                    json_ld_types.append(schema_type)
            except Exception:
                pass

        # Open Graph
        og = {}
        for tag in soup.find_all("meta", property=re.compile("^og:")):
            og[tag["property"][3:]] = tag.get("content", "")

        # Twitter Cards
        twitter = {}
        for tag in soup.find_all("meta", attrs={"name": re.compile("^twitter:")}):
            twitter[tag["name"][8:]] = tag.get("content", "")

        return {
            "has_json_ld": bool(json_ld_raw),
            "schema_types": list(set(json_ld_types)),
            "json_ld_count": len(json_ld_raw),
            "open_graph": og,
            "has_open_graph": bool(og),
            "twitter_cards": twitter,
            "has_twitter_cards": bool(twitter),
        }
    except Exception as e:
        return {"error": str(e)}
