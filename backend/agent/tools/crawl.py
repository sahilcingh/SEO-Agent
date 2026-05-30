import re
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


def _parse_html(html: str, url: str, status_code: int) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    # Title
    title_tag = soup.find("title")
    title = title_tag.get_text().strip() if title_tag else None

    # Meta description
    meta_desc = soup.find("meta", attrs={"name": "description"})
    description = meta_desc.get("content", "").strip() if meta_desc else None

    # Headings
    headings = {}
    for i in range(1, 7):
        headings[f"h{i}"] = [t.get_text().strip() for t in soup.find_all(f"h{i}")]

    # Images
    images = soup.find_all("img")
    images_data = [
        {"src": img.get("src", ""), "alt": img.get("alt", ""), "has_alt": bool(img.get("alt"))}
        for img in images[:30]
    ]

    # Links
    base_domain = urlparse(url).netloc
    internal_links, external_links = [], []
    for link in soup.find_all("a", href=True)[:100]:
        abs_href = urljoin(url, link["href"])
        parsed = urlparse(abs_href)
        if parsed.scheme in ("http", "https"):
            (internal_links if parsed.netloc == base_domain else external_links).append(abs_href)

    # Canonical & robots
    canonical = soup.find("link", attrs={"rel": "canonical"})
    meta_robots = soup.find("meta", attrs={"name": re.compile("robots", re.I)})

    # Open Graph
    og = {tag["property"][3:]: tag.get("content", "") for tag in soup.find_all("meta", property=re.compile("^og:"))}

    # Word count — skip script/style text only
    word_count = 0
    body = soup.find("body")
    if body:
        for element in body.find_all(string=True):
            if element.parent.name not in ("script", "style", "noscript"):
                word_count += len(re.findall(r"\b\w+\b", str(element)))

    is_spa = word_count < 100 and not headings.get("h1")

    return {
        "url": url,
        "status_code": status_code,
        "is_javascript_rendered": is_spa,
        "title": title,
        "title_length": len(title) if title else 0,
        "meta_description": description,
        "meta_description_length": len(description) if description else 0,
        "headings": headings,
        "word_count": word_count,
        "total_images": len(images),
        "images_without_alt": sum(1 for img in images_data if not img["has_alt"]),
        "internal_links_count": len(set(internal_links)),
        "external_links_count": len(set(external_links)),
        "canonical_url": canonical.get("href") if canonical else None,
        "meta_robots": meta_robots.get("content", "") if meta_robots else None,
        "open_graph": og,
    }


def _crawl_with_playwright(url: str) -> dict:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent="Mozilla/5.0 (compatible; SEOAgent/1.0)"
        )
        response = page.goto(url, wait_until="networkidle", timeout=30000)
        html = page.content()
        status = response.status if response else 200
        browser.close()

    return _parse_html(html, url, status)


def _crawl_with_requests(url: str) -> dict:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; SEOAgent/1.0)"}
    response = requests.get(url, headers=headers, timeout=15)
    return _parse_html(response.text, url, response.status_code)


def crawl_page(url: str) -> dict:
    """
    Crawl a webpage and extract all SEO-relevant on-page data: title, meta description,
    headings, images, links, canonical tag, and Open Graph tags.
    Uses Playwright (headless Chrome) to render JavaScript-heavy SPAs correctly,
    with a fallback to plain HTTP requests.

    Args:
        url: The full URL of the page to crawl (e.g. https://example.com/page)

    Returns:
        A dictionary containing all extracted SEO data from the page.
    """
    try:
        return _crawl_with_playwright(url)
    except ImportError:
        pass
    except Exception as e:
        # Playwright failed for a non-import reason — fall through to requests
        pass

    try:
        return _crawl_with_requests(url)
    except Exception as e:
        return {"error": str(e), "url": url}
