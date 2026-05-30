import requests
import re
from urllib.parse import urljoin, urlparse


def check_robots_sitemap(url: str) -> dict:
    """
    Check the domain's robots.txt and sitemap.xml for crawlability and indexability signals.
    Reports disallow rules, sitemap location, and whether the target URL is blocked.

    Args:
        url: Any URL from the domain to check (e.g. https://example.com/blog/post)

    Returns:
        A dictionary with robots.txt rules and sitemap status.
    """
    parsed = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    target_path = parsed.path or "/"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; SEOAgent/1.0)"}

    result = {
        "robots_txt": {
            "found": False,
            "url": f"{base_url}/robots.txt",
            "disallowed_paths": [],
            "page_is_blocked": False,
            "sitemap_declared": None,
        },
        "sitemap": {
            "found": False,
            "url": None,
            "page_count": None,
        },
    }

    # --- robots.txt ---
    try:
        resp = requests.get(f"{base_url}/robots.txt", headers=headers, timeout=10)
        if resp.status_code == 200:
            result["robots_txt"]["found"] = True
            content = resp.text

            in_user_agent_block = False
            for line in content.splitlines():
                line = line.strip()
                if line.lower().startswith("user-agent:"):
                    ua = line.split(":", 1)[1].strip()
                    in_user_agent_block = ua in ("*", "Googlebot")
                elif in_user_agent_block and line.lower().startswith("disallow:"):
                    path = line.split(":", 1)[1].strip()
                    if path:
                        result["robots_txt"]["disallowed_paths"].append(path)
                        if target_path.startswith(path) or path == "/":
                            result["robots_txt"]["page_is_blocked"] = True
                elif line.lower().startswith("sitemap:"):
                    result["robots_txt"]["sitemap_declared"] = line.split(":", 1)[1].strip()
    except Exception as e:
        result["robots_txt"]["error"] = str(e)

    # --- sitemap.xml ---
    sitemap_url = result["robots_txt"]["sitemap_declared"] or f"{base_url}/sitemap.xml"
    try:
        resp = requests.get(sitemap_url, headers=headers, timeout=10)
        if resp.status_code == 200:
            result["sitemap"]["found"] = True
            result["sitemap"]["url"] = sitemap_url
            result["sitemap"]["page_count"] = len(re.findall(r"<loc>", resp.text))
    except Exception as e:
        result["sitemap"]["error"] = str(e)

    return result
