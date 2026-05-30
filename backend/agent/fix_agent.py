import os
import json
import re
import zipfile
import io
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

MODELS_TO_TRY = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "qwen/qwen3-32b",
    "llama-3.1-8b-instant",
]


def _llm(client: Groq, system: str, prompt: str) -> str:
    for model in MODELS_TO_TRY:
        try:
            res = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=4096,
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            if model == MODELS_TO_TRY[-1]:
                raise
            continue
    return ""


def _strip_fences(text: str) -> str:
    text = re.sub(r"^```[\w]*\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _fetch_html(url: str) -> str:
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="networkidle", timeout=30000)
            html = page.content()
            browser.close()
        return html
    except Exception:
        import requests
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        return resp.text


def generate_fixes(url: str, audit_report: dict) -> dict:
    """
    Given a URL and its audit report, generate all possible SEO fixes.
    Returns structured fixes + a ZIP archive as bytes.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    # Fetch live HTML
    html = _fetch_html(url)

    # Extract existing <head> content
    head_match = re.search(r"<head[^>]*>(.*?)</head>", html, re.DOTALL | re.IGNORECASE)
    existing_head = head_match.group(1) if head_match else ""

    issues   = audit_report.get("issues", {})
    on_page  = audit_report.get("on_page_seo", {})
    tech     = audit_report.get("technical", {})
    score    = audit_report.get("overall_score", 0)

    summary = f"""
URL: {url}
Current SEO score: {score}/100

On-page data:
- Title: {on_page.get('title', {}).get('value', 'missing')} ({on_page.get('title', {}).get('length', 0)} chars)
- Meta description: {on_page.get('meta_description', {}).get('value', 'missing')} ({on_page.get('meta_description', {}).get('length', 0)} chars)
- H1 count: {on_page.get('headings', {}).get('h1_count', 0)}
- Word count: {on_page.get('content', {}).get('word_count', 0)}
- Images missing alt: {on_page.get('images', {}).get('missing_alt', 0)} of {on_page.get('images', {}).get('total', 0)}

Technical:
- Canonical: {tech.get('canonical', {}).get('present', False)}
- Structured data: {tech.get('structured_data', {}).get('found', False)} — types: {tech.get('structured_data', {}).get('types', [])}
- Open Graph: {tech.get('open_graph', {}).get('found', False)}

Critical issues: {[i['title'] for i in issues.get('critical', [])]}
Warnings: {[i['title'] for i in issues.get('warnings', [])]}

Existing <head>:
{existing_head[:3000]}
"""

    fixes = {}

    # ── 1. Optimised <head> HTML ──────────────────────────────────────────
    head_raw = _llm(
        client,
        "You are an SEO engineer. Output only clean HTML — no explanation, no markdown fences.",
        f"""Rewrite the complete <head> section for this page to fix ALL SEO issues.

{summary}

Rules:
- Title: 50-60 characters, include primary keyword naturally
- Meta description: 140-160 characters, compelling, include keyword
- Add canonical tag pointing to {url}
- Add complete Open Graph tags (og:title, og:description, og:url, og:type)
- Add Twitter Card meta tags
- Add/fix meta robots if needed
- Keep all existing tags that are already correct (charset, viewport, CSS links, etc.)
- Output ONLY the content that goes INSIDE <head>...</head>, starting with <meta charset...""",
    )
    fixes["head_html"] = _strip_fences(head_raw)

    # ── 2. JSON-LD Schema ─────────────────────────────────────────────────
    schema_raw = _llm(
        client,
        "You are an SEO engineer. Output only valid JSON-LD — no explanation, no markdown.",
        f"""Generate a complete JSON-LD structured data script for this page.

{summary}

Choose the most appropriate schema type (WebSite, WebPage, Organization, Article, Product, LocalBusiness, etc.) based on the page content.
Include as many relevant fields as possible from the available data.
Output ONLY the <script type="application/ld+json">...</script> block.""",
    )
    fixes["schema_jsonld"] = _strip_fences(schema_raw)

    # ── 3. robots.txt ─────────────────────────────────────────────────────
    from urllib.parse import urlparse
    domain = urlparse(url).scheme + "://" + urlparse(url).netloc
    fixes["robots_txt"] = f"""User-agent: *
Allow: /

Sitemap: {domain}/sitemap.xml
"""

    # ── 4. Content improvements ───────────────────────────────────────────
    content_raw = _llm(
        client,
        "You are an SEO content strategist. Be specific and actionable.",
        f"""Based on this SEO audit, provide specific content improvements.

{summary}

Return a JSON object with these fields:
{{
  "improved_title": "the exact new title tag text (50-60 chars)",
  "improved_meta_description": "the exact new meta description (140-160 chars)",
  "suggested_h1": "the exact H1 tag text to use",
  "content_gaps": ["gap 1", "gap 2", "gap 3"],
  "internal_linking_suggestions": ["add link to X from Y", ...],
  "keyword_suggestions": ["primary keyword", "secondary keyword 1", "secondary keyword 2"]
}}""",
    )
    try:
        raw = _strip_fences(content_raw)
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        fixes["content"] = json.loads(match.group()) if match else {"raw": content_raw}
    except Exception:
        fixes["content"] = {"raw": content_raw}

    # ── 5. Implementation guide ───────────────────────────────────────────
    guide_raw = _llm(
        client,
        "You are a technical SEO consultant. Be concise and specific.",
        f"""Write a step-by-step implementation guide for applying these SEO fixes to {url}.

Audit summary: {summary}

Format as numbered steps. Include:
1. Which file/section to edit for each fix
2. Exact code or text to paste
3. How to verify each fix worked
4. Expected score improvement after each fix

Keep it practical — assume the developer has basic HTML knowledge.""",
    )
    fixes["implementation_guide"] = guide_raw

    # ── 6. Build ZIP ──────────────────────────────────────────────────────
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("head_replacement.html",
            f"<!-- Replace the content inside your <head>...</head> with this -->\n{fixes['head_html']}")
        zf.writestr("schema_markup.html",
            f"<!-- Add this before </body> or inside <head> -->\n{fixes['schema_jsonld']}")
        zf.writestr("robots.txt", fixes["robots_txt"])
        zf.writestr("content_improvements.json",
            json.dumps(fixes["content"], indent=2))
        zf.writestr("implementation_guide.md", fixes["implementation_guide"])
        zf.writestr("README.md", f"""# SEO Fixes for {url}

Current score: {score}/100

## Files in this package

| File | What to do |
|------|-----------|
| head_replacement.html | Replace everything inside your <head> tag with this |
| schema_markup.html | Add this JSON-LD block inside <head> |
| robots.txt | Upload to your domain root ({domain}/robots.txt) |
| content_improvements.json | Suggested title, meta, H1 and keyword improvements |
| implementation_guide.md | Step-by-step instructions |

## Quick wins (do these first)
{chr(10).join(f'- {i["title"]}: {i.get("how_to_fix", "")}' for i in issues.get("critical", [])[:3])}
""")
    buf.seek(0)
    fixes["zip_bytes"] = buf.getvalue()

    return fixes
