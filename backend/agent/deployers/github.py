"""
GitHub deployer — reads files, applies patches, commits to a branch.
Vercel / Netlify / GitHub Pages auto-deploys on push automatically.
"""
import json
import base64
from datetime import datetime
from typing import Optional
import requests


class GitHubDeployer:
    def __init__(self, token: str, repo: str, base_branch: str = "main"):
        self.token = token
        self.repo = repo          # "owner/repo-name"
        self.base_branch = base_branch
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        self.api = "https://api.github.com"

    def _get(self, path: str) -> dict:
        resp = requests.get(f"{self.api}{path}", headers=self.headers, timeout=15)
        resp.raise_for_status()
        return resp.json()

    def _put(self, path: str, body: dict) -> dict:
        resp = requests.put(f"{self.api}{path}", headers=self.headers, json=body, timeout=15)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, body: dict) -> dict:
        resp = requests.post(f"{self.api}{path}", headers=self.headers, json=body, timeout=15)
        resp.raise_for_status()
        return resp.json()

    def get_file(self, path: str, branch: Optional[str] = None) -> tuple[str, str]:
        """Returns (decoded_content, sha)."""
        ref = branch or self.base_branch
        data = self._get(f"/repos/{self.repo}/contents/{path}?ref={ref}")
        content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
        return content, data["sha"]

    def list_files(self, path: str = "", branch: Optional[str] = None) -> list[dict]:
        """List files/dirs at a path."""
        ref = branch or self.base_branch
        try:
            data = self._get(f"/repos/{self.repo}/contents/{path}?ref={ref}")
            return data if isinstance(data, list) else []
        except Exception:
            return []

    def file_exists(self, path: str, branch: Optional[str] = None) -> bool:
        try:
            self.get_file(path, branch)
            return True
        except Exception:
            return False

    def read_json(self, path: str, branch: Optional[str] = None) -> dict:
        try:
            content, _ = self.get_file(path, branch)
            return json.loads(content)
        except Exception:
            return {}

    def create_branch(self, branch_name: str) -> str:
        """Create a new branch off base_branch. Returns branch name."""
        # Get base branch SHA
        ref_data = self._get(f"/repos/{self.repo}/git/ref/heads/{self.base_branch}")
        sha = ref_data["object"]["sha"]
        try:
            self._post(f"/repos/{self.repo}/git/refs", {
                "ref": f"refs/heads/{branch_name}",
                "sha": sha,
            })
        except requests.HTTPError as e:
            if "422" in str(e):
                pass  # branch already exists
            else:
                raise
        return branch_name

    def commit_file(self, path: str, content: str, message: str,
                    branch: str, sha: Optional[str] = None) -> dict:
        """Create or update a file on a branch."""
        body: dict = {
            "message": message,
            "content": base64.b64encode(content.encode()).decode(),
            "branch": branch,
        }
        if sha:
            body["sha"] = sha
        return self._put(f"/repos/{self.repo}/contents/{path}", body)

    def create_pr(self, branch: str, title: str, body: str) -> str:
        """Create a pull request. Returns the PR URL."""
        data = self._post(f"/repos/{self.repo}/pulls", {
            "title": title,
            "body": body,
            "head": branch,
            "base": self.base_branch,
        })
        return data["html_url"]

    def merge_branch(self, branch: str) -> None:
        """Merge branch into base_branch (fast-forward)."""
        self._post(f"/repos/{self.repo}/merges", {
            "base": self.base_branch,
            "head": branch,
            "commit_message": f"Merge SEO fixes from {branch}",
        })

    def detect_stack(self) -> str:
        """
        Detect project stack from package.json and file structure.
        Returns: 'nextjs' | 'react' | 'html' | 'unknown'
        """
        pkg = self.read_json("package.json")
        if pkg:
            all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            if "next" in all_deps:
                return "nextjs"
            if "react" in all_deps or "@vitejs/plugin-react" in all_deps:
                return "react"
            return "js"
        # No package.json → likely plain HTML
        return "html"

    def detect_nextjs_router(self) -> str:
        """Detect Next.js router: 'app' or 'pages'."""
        if self.file_exists("app/layout.tsx") or self.file_exists("app/layout.js"):
            return "app"
        if self.file_exists("src/app/layout.tsx") or self.file_exists("src/app/layout.js"):
            return "app"
        return "pages"
