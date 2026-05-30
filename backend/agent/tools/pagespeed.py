import requests
import os


def check_pagespeed(url: str, strategy: str = "mobile") -> dict:
    """
    Analyze page speed and Core Web Vitals using Google PageSpeed Insights API.
    Returns Lighthouse scores for performance, accessibility, best-practices, and SEO,
    plus Core Web Vitals (LCP, CLS, FCP, TBT).

    Args:
        url: The full URL to analyze
        strategy: Either 'mobile' or 'desktop'

    Returns:
        A dictionary with Lighthouse scores, Core Web Vitals, and top opportunities.
    """
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    params = {
        "url": url,
        "strategy": strategy,
        "category": ["performance", "accessibility", "best-practices", "seo"],
    }
    if api_key:
        params["key"] = api_key

    try:
        resp = requests.get(
            "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
            params=params,
            timeout=60,
        )
        data = resp.json()

        # Surface API-level errors clearly
        if "error" in data:
            err = data["error"]
            return {
                "error": f"PageSpeed API error {err.get('code')}: {err.get('message', 'unknown')}",
                "strategy": strategy,
                "scores": {"performance": 0, "accessibility": 0, "best_practices": 0, "seo": 0},
                "core_web_vitals": {},
                "opportunities": [],
            }

        lighthouse = data.get("lighthouseResult")
        if not lighthouse:
            return {
                "error": "PageSpeed API returned no Lighthouse data — site may be unreachable or the API is rate-limited. Add a GOOGLE_API_KEY to .env for reliable access.",
                "strategy": strategy,
                "scores": {"performance": 0, "accessibility": 0, "best_practices": 0, "seo": 0},
                "core_web_vitals": {},
                "opportunities": [],
            }

        categories = lighthouse.get("categories", {})
        audits = lighthouse.get("audits", {})

        def pct(key):
            val = categories.get(key, {}).get("score")
            return round((val or 0) * 100)

        def score(key):
            val = audits.get(key, {}).get("score", 0) or 0
            return round(val * 100)

        def display(key):
            return audits.get(key, {}).get("displayValue", "N/A")

        opportunities = [
            {"id": k, "title": v.get("title", ""), "savings": v.get("displayValue", "")}
            for k, v in audits.items()
            if v.get("details", {}).get("type") == "opportunity" and (v.get("score") or 1) < 0.9
        ][:8]

        return {
            "strategy": strategy,
            "scores": {
                "performance": pct("performance"),
                "accessibility": pct("accessibility"),
                "best_practices": pct("best-practices"),
                "seo": pct("seo"),
            },
            "core_web_vitals": {
                "lcp": {"value": display("largest-contentful-paint"), "score": score("largest-contentful-paint")},
                "cls": {"value": display("cumulative-layout-shift"), "score": score("cumulative-layout-shift")},
                "fcp": {"value": display("first-contentful-paint"), "score": score("first-contentful-paint")},
                "tbt": {"value": display("total-blocking-time"), "score": score("total-blocking-time")},
            },
            "opportunities": opportunities,
        }
    except Exception as e:
        return {
            "error": str(e),
            "strategy": strategy,
            "scores": {"performance": 0, "accessibility": 0, "best_practices": 0, "seo": 0},
            "core_web_vitals": {},
            "opportunities": [],
        }
