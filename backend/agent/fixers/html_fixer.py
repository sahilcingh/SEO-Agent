"""Fixes SEO issues in plain HTML files."""
from bs4 import BeautifulSoup
import json


def fix_html(html: str, fixes: dict, url: str) -> str:
    """
    Apply all SEO fixes to an HTML string.
    fixes = output from fix_agent.generate_fixes()
    """
    soup = BeautifulSoup(html, "html.parser")
    head = soup.find("head")
    if not head:
        head = soup.new_tag("head")
        if soup.html:
            soup.html.insert(0, head)
        else:
            soup.insert(0, head)

    content = fixes.get("content", {})
    title_text = content.get("improved_title", "")
    desc_text = content.get("improved_meta_description", "")

    # ── Title ──────────────────────────────────────────────────────────────
    if title_text:
        tag = head.find("title")
        if tag:
            tag.string = title_text
        else:
            t = soup.new_tag("title")
            t.string = title_text
            head.append(t)

    # ── Meta description ───────────────────────────────────────────────────
    if desc_text:
        tag = head.find("meta", attrs={"name": "description"})
        if tag:
            tag["content"] = desc_text
        else:
            t = soup.new_tag("meta")
            t["name"] = "description"
            t["content"] = desc_text
            head.append(t)

    # ── Canonical ──────────────────────────────────────────────────────────
    tag = head.find("link", attrs={"rel": "canonical"})
    if tag:
        tag["href"] = url
    else:
        t = soup.new_tag("link")
        t["rel"] = "canonical"
        t["href"] = url
        head.append(t)

    # ── Open Graph ─────────────────────────────────────────────────────────
    og_map = {
        "og:title": title_text,
        "og:description": desc_text,
        "og:url": url,
        "og:type": "website",
    }
    for prop, val in og_map.items():
        if not val:
            continue
        tag = head.find("meta", property=prop)
        if tag:
            tag["content"] = val
        else:
            t = soup.new_tag("meta")
            t["property"] = prop
            t["content"] = val
            head.append(t)

    # ── Schema JSON-LD ─────────────────────────────────────────────────────
    schema = fixes.get("schema_jsonld", "")
    if schema:
        # Remove existing JSON-LD
        for s in head.find_all("script", type="application/ld+json"):
            s.decompose()
        # Parse the schema block (strip <script> tags if present)
        if "<script" in schema:
            schema_soup = BeautifulSoup(schema, "html.parser")
            script_tag = schema_soup.find("script")
            if script_tag:
                head.append(script_tag)
        else:
            t = soup.new_tag("script", type="application/ld+json")
            t.string = schema
            head.append(t)

    return str(soup)
