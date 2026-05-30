"""
Deploy Agent — orchestrates auto-fixing and deploying SEO fixes.

Flow:
  1. Connect to code source (GitHub / FTP / SSH)
  2. Detect stack (Next.js / React / HTML)
  3. Find SEO-relevant files
  4. Apply targeted fixes
  5. Deploy (commit+push / upload / SSH deploy command)
  6. Return a deployment report
"""
import json
from datetime import datetime
from typing import Optional

from .fix_agent import generate_fixes
from .fixers.html_fixer import fix_html
from .fixers.nextjs_fixer import (
    fix_app_router_layout,
    fix_pages_router_document,
    fix_nextjs_index,
)


# ── Helpers ────────────────────────────────────────────────────────────────

def _branch_name() -> str:
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"seo-auto-fix-{ts}"


# ── GitHub flow ────────────────────────────────────────────────────────────

def _find_html_files_github(deployer, branch: str) -> list[str]:
    """Walk repo root + src/ for HTML files."""
    candidates = []
    for root in ["", "src", "public"]:
        for item in deployer.list_files(root, branch):
            if item["type"] == "file" and item["name"].endswith((".html", ".htm")):
                candidates.append(item["path"])
    return candidates


def _apply_github(deployer, fixes: dict, url: str,
                  branch: str, auto_merge: bool) -> dict:
    stack = deployer.detect_stack()
    changed_files = []
    report_lines = [f"Stack detected: **{stack}**\n"]

    # ── robots.txt ─────────────────────────────────────────────────────────
    robots_content = fixes.get("robots_txt", "")
    if robots_content:
        sha = None
        if deployer.file_exists("robots.txt"):
            _, sha = deployer.get_file("robots.txt", branch)
        deployer.commit_file("robots.txt", robots_content, "seo: update robots.txt", branch, sha)
        changed_files.append("robots.txt")
        report_lines.append("✓ robots.txt updated")

    # ── Stack-specific fixes ───────────────────────────────────────────────
    if stack == "nextjs":
        router = deployer.detect_nextjs_router()
        report_lines.append(f"Next.js router: **{router}**")

        if router == "app":
            # Try app/layout.tsx then src/app/layout.tsx
            for path in ["app/layout.tsx", "app/layout.js",
                         "src/app/layout.tsx", "src/app/layout.js"]:
                if deployer.file_exists(path, branch):
                    content, sha = deployer.get_file(path, branch)
                    patched = fix_app_router_layout(content, fixes, url)
                    if patched != content:
                        deployer.commit_file(path, patched, "seo: update metadata in layout", branch, sha)
                        changed_files.append(path)
                        report_lines.append(f"✓ {path} — metadata export updated")
                    break
        else:
            # Pages router — _document or index
            for path in ["pages/_document.tsx", "pages/_document.js",
                         "src/pages/_document.tsx"]:
                if deployer.file_exists(path, branch):
                    content, sha = deployer.get_file(path, branch)
                    patched = fix_pages_router_document(content, fixes, url)
                    if patched != content:
                        deployer.commit_file(path, patched, "seo: update head in _document", branch, sha)
                        changed_files.append(path)
                        report_lines.append(f"✓ {path} updated")
                    break

            # Also try pages/index
            for path in ["pages/index.tsx", "pages/index.js", "src/pages/index.tsx"]:
                if deployer.file_exists(path, branch):
                    content, sha = deployer.get_file(path, branch)
                    patched = fix_nextjs_index(content, fixes, url)
                    if patched != content:
                        deployer.commit_file(path, patched, "seo: update Head in index page", branch, sha)
                        changed_files.append(path)
                        report_lines.append(f"✓ {path} updated")
                    break

    else:
        # HTML / React / other — patch index.html
        html_files = _find_html_files_github(deployer, branch)
        if not html_files:
            html_files = ["index.html"]

        for path in html_files[:3]:  # cap at 3 files
            try:
                content, sha = deployer.get_file(path, branch)
                patched = fix_html(content, fixes, url)
                if patched != content:
                    deployer.commit_file(path, patched, f"seo: fix meta tags in {path}", branch, sha)
                    changed_files.append(path)
                    report_lines.append(f"✓ {path} — title, meta, canonical, OG, schema updated")
            except Exception as e:
                report_lines.append(f"⚠ Could not patch {path}: {e}")

    # ── Merge or PR ────────────────────────────────────────────────────────
    if not changed_files:
        return {
            "status": "no_changes",
            "message": "No files needed updating — SEO fixes may already be present.",
            "changed_files": [],
            "branch": branch,
        }

    if auto_merge:
        deployer.merge_branch(branch)
        report_lines.append(f"\n✅ Merged `{branch}` → `{deployer.base_branch}`. Your deployment pipeline will trigger automatically.")
        status = "deployed"
        pr_url = None
    else:
        pr_url = deployer.create_pr(
            branch,
            title=f"SEO Auto-Fix — {datetime.now().strftime('%b %d, %Y')}",
            body="\n".join(report_lines) + "\n\n_Generated by SEO Agent_",
        )
        report_lines.append(f"\n📋 Pull request created: {pr_url}")
        status = "pr_created"

    return {
        "status": status,
        "message": "\n".join(report_lines),
        "changed_files": changed_files,
        "branch": branch,
        "pr_url": pr_url,
    }


# ── FTP flow ───────────────────────────────────────────────────────────────

def _apply_ftp(deployer, fixes: dict, url: str) -> dict:
    changed_files = []
    report_lines = []

    # robots.txt
    deployer.write_file("robots.txt", fixes.get("robots_txt", ""))
    changed_files.append("robots.txt")
    report_lines.append("✓ robots.txt uploaded")

    # index.html
    try:
        content = deployer.read_file("index.html")
        patched = fix_html(content, fixes, url)
        deployer.write_file("index.html", patched)
        changed_files.append("index.html")
        report_lines.append("✓ index.html updated (title, meta, canonical, OG, schema)")
    except Exception as e:
        report_lines.append(f"⚠ Could not patch index.html: {e}")

    return {
        "status": "deployed",
        "message": "\n".join(report_lines),
        "changed_files": changed_files,
    }


# ── SSH flow ───────────────────────────────────────────────────────────────

def _apply_ssh(deployer, fixes: dict, url: str) -> dict:
    changed_files = []
    report_lines = []

    # robots.txt
    deployer.write_file("robots.txt", fixes.get("robots_txt", ""))
    changed_files.append("robots.txt")
    report_lines.append("✓ robots.txt uploaded")

    # index.html
    try:
        content = deployer.read_file("index.html")
        patched = fix_html(content, fixes, url)
        deployer.write_file("index.html", patched)
        changed_files.append("index.html")
        report_lines.append("✓ index.html updated")
    except Exception as e:
        report_lines.append(f"⚠ Could not patch index.html: {e}")

    # Run deploy command if provided
    deploy_output = deployer.deploy()
    report_lines.append(f"\n{deploy_output}")

    return {
        "status": "deployed",
        "message": "\n".join(report_lines),
        "changed_files": changed_files,
    }


# ── Public entry point ─────────────────────────────────────────────────────

def run_deploy(config: dict, audit_report: dict) -> dict:
    """
    config keys:
      source        : "github" | "ftp" | "ssh"
      url           : target site URL

      # GitHub
      github_token  : PAT with repo write access
      repo          : "owner/repo"
      branch        : base branch (default "main")
      auto_merge    : bool (default False — creates PR instead)

      # FTP
      ftp_host, ftp_user, ftp_password, ftp_root

      # SSH
      ssh_host, ssh_user, ssh_password, ssh_key, ssh_port
      ssh_site_root, ssh_deploy_command
    """
    url    = config["url"]
    source = config.get("source", "github")

    # Step 1 — generate fixes (re-uses fix_agent logic)
    fixes = generate_fixes(url, audit_report)

    # Step 2 — deploy by source
    if source == "github":
        from .deployers.github import GitHubDeployer
        deployer = GitHubDeployer(
            token=config["github_token"],
            repo=config["repo"],
            base_branch=config.get("branch", "main"),
        )
        branch = _branch_name()
        deployer.create_branch(branch)
        result = _apply_github(
            deployer, fixes, url, branch,
            auto_merge=config.get("auto_merge", False),
        )

    elif source == "ftp":
        from .deployers.ftp import FTPDeployer
        deployer = FTPDeployer(
            host=config["ftp_host"],
            user=config["ftp_user"],
            password=config["ftp_password"],
            remote_root=config.get("ftp_root", "/public_html"),
        )
        deployer.connect()
        try:
            result = _apply_ftp(deployer, fixes, url)
        finally:
            deployer.disconnect()

    elif source == "ssh":
        from .deployers.ssh import SSHDeployer
        deployer = SSHDeployer(
            host=config["ssh_host"],
            user=config["ssh_user"],
            password=config.get("ssh_password", ""),
            private_key=config.get("ssh_key", ""),
            port=int(config.get("ssh_port", 22)),
            site_root=config.get("ssh_site_root", "/var/www/html"),
            deploy_command=config.get("ssh_deploy_command", ""),
        )
        deployer.connect()
        try:
            result = _apply_ssh(deployer, fixes, url)
        finally:
            deployer.disconnect()

    else:
        raise ValueError(f"Unknown source: {source}. Must be github, ftp, or ssh.")

    result["url"] = url
    result["source"] = source
    return result
