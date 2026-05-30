import os
import json
import re
import math
from groq import Groq
from dotenv import load_dotenv

from .tools.crawl import crawl_page
from .tools.pagespeed import check_pagespeed
from .tools.robots import check_robots_sitemap
from .tools.schema import extract_schema
from .tools.search import search_competitors

load_dotenv()


# ---------------------------------------------------------------------------
# Strict deterministic scoring — no LLM involved
# ---------------------------------------------------------------------------

def _status(score: int) -> str:
    if score >= 80: return "good"
    if score >= 50: return "warning"
    return "critical"


def _grade(score: int) -> str:
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 65: return "C"
    if score >= 50: return "D"
    return "F"


def _score_title(length: int) -> int:
    if length == 0:       return 0    # missing
    if length < 20:       return 20   # way too short
    if length < 30:       return 45   # too short
    if length <= 60:      return 100  # optimal
    if length <= 70:      return 65   # slightly long
    return 30                         # too long


def _score_meta(length: int) -> int:
    if length == 0:       return 0    # missing
    if length < 70:       return 25   # way too short
    if length < 100:      return 55   # short
    if length <= 160:     return 100  # optimal
    if length <= 180:     return 65   # slightly long
    return 35                         # too long — truncated in SERPs


def _score_headings(h1_count: int) -> int:
    if h1_count == 0:     return 0    # no H1 — critical
    if h1_count == 1:     return 100  # perfect
    return 50                         # multiple H1s — confuses crawlers


def _score_content(word_count: int) -> int:
    if word_count < 100:   return 0
    if word_count < 300:   return 30
    if word_count < 600:   return 55
    if word_count < 1000:  return 75
    if word_count < 1500:  return 88
    return 100


def _score_images(total: int, missing_alt: int) -> int:
    if total == 0:         return 100  # no images → not an issue
    ratio = missing_alt / total
    if ratio == 0:         return 100
    if ratio <= 0.10:      return 80
    if ratio <= 0.25:      return 60
    if ratio <= 0.50:      return 35
    return 10


def _score_links(internal: int) -> int:
    if internal == 0:      return 0
    if internal < 3:       return 40
    if internal < 6:       return 70
    if internal < 10:      return 85
    return 100


def _score_technical(canonical: bool, robots_ok: bool,
                     sitemap: bool, schema: bool, og: bool) -> int:
    pts = 0
    if canonical:  pts += 25
    if robots_ok:  pts += 20
    if sitemap:    pts += 20
    if schema:     pts += 20
    if og:         pts += 15
    return pts


def calculate_scores(raw: dict) -> dict:
    """
    Compute all SEO sub-scores and overall score from raw tool data.
    Returns a dict the LLM uses verbatim — no re-scoring allowed.
    """
    crawl   = raw.get("crawl", {})
    ps_mob  = raw.get("pagespeed_mobile", {})
    ps_desk = raw.get("pagespeed_desktop", {})
    robots  = raw.get("robots_sitemap", {})
    schema  = raw.get("schema", {})

    # --- On-page ---
    title_len = crawl.get("title_length", 0)
    meta_len  = crawl.get("meta_description_length", 0)
    h1_count  = len(crawl.get("headings", {}).get("h1", []))
    words     = crawl.get("word_count", 0)
    total_img = crawl.get("total_images", 0)
    miss_alt  = crawl.get("images_without_alt", 0)
    internal  = crawl.get("internal_links_count", 0)

    s_title   = _score_title(title_len)
    s_meta    = _score_meta(meta_len)
    s_heading = _score_headings(h1_count)
    s_content = _score_content(words)
    s_images  = _score_images(total_img, miss_alt)
    s_links   = _score_links(internal)

    on_page_score = round(
        s_title * 0.25 + s_meta * 0.20 + s_heading * 0.25 +
        s_content * 0.15 + s_images * 0.05 + s_links * 0.10
    )

    # --- Performance ---
    mob_perf  = ps_mob.get("scores", {}).get("performance", 0)
    desk_perf = ps_desk.get("scores", {}).get("performance", 0)
    perf_score = mob_perf  # weight mobile

    # --- Technical ---
    canonical_ok = bool(crawl.get("canonical_url"))
    robots_ok    = (robots.get("robots_txt", {}).get("found", False) and
                    not robots.get("robots_txt", {}).get("page_is_blocked", False))
    sitemap_ok   = robots.get("sitemap", {}).get("found", False)
    schema_ok    = schema.get("has_json_ld", False)
    og_ok        = schema.get("has_open_graph", False)

    tech_score = _score_technical(canonical_ok, robots_ok, sitemap_ok, schema_ok, og_ok)

    # --- Content quality (word count proxy) ---
    content_score = s_content

    # --- Overall weighted score ---
    overall = round(
        on_page_score * 0.30 +
        perf_score    * 0.25 +
        tech_score    * 0.25 +
        content_score * 0.20
    )

    return {
        "overall_score": overall,
        "grade": _grade(overall),
        "breakdown": {
            "on_page": {"score": on_page_score, "weight": "30%"},
            "performance": {"score": perf_score, "weight": "25%"},
            "technical": {"score": tech_score, "weight": "25%"},
            "content": {"score": content_score, "weight": "20%"},
        },
        "sub_scores": {
            "title":       {"score": s_title,   "status": _status(s_title),   "length": title_len},
            "meta":        {"score": s_meta,    "status": _status(s_meta),    "length": meta_len},
            "headings":    {"score": s_heading, "status": _status(s_heading), "h1_count": h1_count},
            "content":     {"score": s_content, "status": _status(s_content), "word_count": words},
            "images":      {"score": s_images,  "status": _status(s_images),  "total": total_img, "missing_alt": miss_alt},
            "links":       {"score": s_links,   "status": _status(s_links),   "internal": internal},
            "mobile_perf": {"score": mob_perf,  "status": _status(mob_perf)},
            "desktop_perf":{"score": desk_perf, "status": _status(desk_perf)},
            "technical":   {"score": tech_score,"status": _status(tech_score)},
        },
        "technical_checks": {
            "canonical": canonical_ok,
            "robots_ok": robots_ok,
            "sitemap": sitemap_ok,
            "structured_data": schema_ok,
            "open_graph": og_ok,
        },
    }


SYSTEM_PROMPT = """You are an expert SEO analyst. You will receive raw data collected from SEO tools.
Analyse the data thoroughly and return a comprehensive JSON SEO audit report.
Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object."""

REPORT_SCHEMA = {
    "url": "string",
    "overall_score": "number 0-100",
    "grade": "A/B/C/D/F",
    "summary": "2-3 sentence overview",
    "issues": {
        "critical": [{"title": "", "description": "", "how_to_fix": ""}],
        "warnings": [{"title": "", "description": "", "how_to_fix": ""}],
        "info": [{"title": "", "description": ""}],
    },
    "on_page_seo": {
        "title": {"value": "", "length": 0, "score": 0, "status": "good/warning/critical"},
        "meta_description": {"value": "", "length": 0, "score": 0, "status": ""},
        "headings": {"h1_count": 0, "structure": {}, "score": 0, "status": ""},
        "content": {"word_count": 0, "score": 0, "status": ""},
        "images": {"total": 0, "missing_alt": 0, "score": 0, "status": ""},
        "links": {"internal": 0, "external": 0, "score": 0, "status": ""},
    },
    "performance": {
        "mobile_score": 0,
        "desktop_score": 0,
        "lcp": "",
        "cls": "",
        "fcp": "",
        "tbt": "",
        "error": "null or error message if PageSpeed API failed",
    },
    "technical": {
        "canonical": {"present": False, "value": ""},
        "robots": {"page_blocked": False, "robots_txt_found": False},
        "sitemap": {"found": False, "url": "", "page_count": 0},
        "structured_data": {"found": False, "types": []},
        "open_graph": {"found": False},
    },
    "competitors": [{"url": "", "title": "", "domain": ""}],
    "action_plan": [{"priority": "high/medium/low", "action": "", "expected_impact": ""}],
    "full_summary": "A complete markdown-formatted audit summary covering all findings, scores, issues, and the full action plan. Written so a developer or AI agent can read it and immediately start fixing the site. Include all critical and warning issues with exact fix instructions. Include all action plan items.",
}

# Groq available models — ordered best quality first
MODELS_TO_TRY = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "qwen/qwen3-32b",
    "llama-3.1-8b-instant",
]


def _trim(data: dict, max_list: int = 5) -> dict:
    """Recursively trim lists to keep prompt size manageable."""
    if isinstance(data, dict):
        return {k: _trim(v, max_list) for k, v in data.items()}
    if isinstance(data, list):
        return [_trim(i, max_list) for i in data[:max_list]]
    if isinstance(data, str) and len(data) > 300:
        return data[:300] + "..."
    return data


def _gather_data(url: str) -> dict:
    """Run all SEO tools in Python — zero LLM tokens spent here."""
    crawl = crawl_page(url)
    pagespeed_mobile = check_pagespeed(url, strategy="mobile")
    pagespeed_desktop = check_pagespeed(url, strategy="desktop")
    robots = check_robots_sitemap(url)
    schema = extract_schema(url)
    topic = crawl.get("title") or url
    competitors = search_competitors(topic)
    return {
        "crawl": crawl,
        "pagespeed_mobile": pagespeed_mobile,
        "pagespeed_desktop": pagespeed_desktop,
        "robots_sitemap": robots,
        "schema": schema,
        "competitors": competitors,
    }


def run_seo_audit(url: str) -> dict:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in environment. Get a free key at https://console.groq.com")

    # Step 1 — run all tools + compute scores in Python (0 LLM calls)
    raw_data = _trim(_gather_data(url))
    scores   = calculate_scores(raw_data)

    # Step 2 — single LLM call: write issues, summary, action plan only
    client = Groq(api_key=api_key)

    prompt = f"""You have received raw SEO tool data and pre-calculated scores for: {url}

PRE-CALCULATED SCORES (use these EXACTLY — do not change any number):
{json.dumps(scores, indent=2)}

RAW DATA:
{json.dumps(raw_data, indent=2, default=str)}

Using ONLY the data above, produce a JSON SEO audit report matching this exact structure:
{json.dumps(REPORT_SCHEMA, indent=2)}

Rules:
- Copy overall_score, grade, and all sub-scores EXACTLY from PRE-CALCULATED SCORES above — never change them
- status: "good" = score>=80, "warning" = 50-79, "critical" = <50
- List only real issues supported by the raw data — do not invent
- action_plan: minimum 5 items, ordered high → medium → low priority

For the full_summary field, write a thorough markdown report in this format:
# SEO Audit: [url]
**Score: [score]/100 | Grade: [grade]**

## Overview
[2-3 sentences]

## Critical Issues
[numbered list — every critical issue with exact fix]

## Warnings
[numbered list — every warning with exact fix]

## Performance
[bullet list of scores and Core Web Vitals with context]

## Technical SEO
[bullet list — canonical, robots, sitemap, structured data status]

## On-Page SEO
[bullet list — title, meta description, headings, content, images, links]

## Competitors Found
[numbered list]

## Full Action Plan
[numbered list — all actions, priority labelled, with expected impact]

## How to Use This Report
Paste this entire summary into any AI assistant (Claude, ChatGPT, etc.) along with your website's code or CMS access, and ask it to implement the fixes in the action plan above.

Return ONLY the JSON object."""

    errors = {}
    for model in MODELS_TO_TRY:
        try:
            print(f"[SEO Agent] Trying model: {model}")
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=4096,
            )
            raw = completion.choices[0].message.content.strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                match = re.search(r"\{.*\}", raw, re.DOTALL)
                if match:
                    return json.loads(match.group())
                raise ValueError(f"Model returned invalid JSON: {raw[:300]}")

        except Exception as e:
            errors[model] = str(e)
            print(f"[SEO Agent] {model} failed: {e}")
            continue

    summary = " | ".join(f"{m}: {e[:100]}" for m, e in errors.items())
    raise ValueError(f"All Groq models failed — {summary}")
