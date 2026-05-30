"""Fixes SEO issues in Next.js projects (App Router and Pages Router)."""
import re
import json


def fix_app_router_layout(content: str, fixes: dict, url: str) -> str:
    """
    Update the metadata export in app/layout.tsx (Next.js 13+ App Router).
    Handles both existing and missing metadata exports.
    """
    ctx = fixes.get("content", {})
    title = ctx.get("improved_title", "")
    desc = ctx.get("improved_meta_description", "")

    if not title and not desc:
        return content

    # Does a metadata export already exist?
    if "export const metadata" in content or "export const metadata:" in content:
        if title:
            content = re.sub(
                r"(title\s*:\s*)['\"`].*?['\"`]",
                f'\\1"{title}"',
                content,
                count=1,
            )
        if desc:
            content = re.sub(
                r"(description\s*:\s*)['\"`].*?['\"`]",
                f'\\1"{desc}"',
                content,
                count=1,
            )
    else:
        # Inject a metadata export before the default export
        metadata_block = f"""
export const metadata = {{
  title: "{title}",
  description: "{desc}",
  alternates: {{ canonical: "{url}" }},
  openGraph: {{
    title: "{title}",
    description: "{desc}",
    url: "{url}",
    type: "website",
  }},
}};

"""
        content = re.sub(r"(export default )", metadata_block + r"\1", content, count=1)

    return content


def fix_pages_router_document(content: str, fixes: dict, url: str) -> str:
    """
    Update _document.tsx / _document.js (Next.js Pages Router).
    """
    ctx = fixes.get("content", {})
    title = ctx.get("improved_title", "")
    desc = ctx.get("improved_meta_description", "")

    if title:
        content = re.sub(
            r"(<title>).*?(</title>)",
            f"\\g<1>{title}\\g<2>",
            content,
            flags=re.DOTALL,
        )
    if desc:
        content = re.sub(
            r'(<meta\s+name=["\']description["\']\s+content=["\']).*?(["\'])',
            f'\\g<1>{desc}\\g<2>',
            content,
        )
    return content


def fix_nextjs_index(content: str, fixes: dict, url: str) -> str:
    """
    Update a pages/index.tsx that uses next/head <Head> component.
    """
    ctx = fixes.get("content", {})
    title = ctx.get("improved_title", "")
    desc = ctx.get("improved_meta_description", "")

    if title:
        content = re.sub(
            r"(<title>).*?(</title>)",
            f"\\g<1>{title}\\g<2>",
            content,
            flags=re.DOTALL,
        )
    if desc:
        content = re.sub(
            r'(name=["\']description["\']\s+content=["\']).*?(["\'])',
            f'\\g<1>{desc}\\g<2>',
            content,
        )
    return content
