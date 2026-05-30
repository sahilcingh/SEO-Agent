import os
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from agent.seo_agent import run_seo_audit
from agent.fix_agent import generate_fixes
from agent.deploy_agent import run_deploy

load_dotenv()

router = APIRouter()


class AuditRequest(BaseModel):
    url: str


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/models")
async def list_models():
    """Returns all models currently available on your Groq API key."""
    from groq import Groq
    client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
    try:
        models = sorted([m.id for m in client.models.list().data])
        return {"available_models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audit")
async def audit_url(request: AuditRequest):
    url = request.url.strip()
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    try:
        result = run_seo_audit(url)
        return result
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        msg = str(e)
        if "429" in msg or "quota" in msg.lower() or "ResourceExhausted" in type(e).__name__:
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Wait a minute and try again, or check your quota at https://ai.dev/rate-limit",
            )
        raise HTTPException(status_code=500, detail=f"Audit failed: {msg}")


class DeployRequest(BaseModel):
    config: dict       # source, credentials, repo, etc.
    audit_report: dict


@router.post("/deploy")
async def deploy_fixes(request: DeployRequest):
    """Auto-fix SEO issues and deploy to GitHub / FTP / SSH."""
    try:
        result = run_deploy(request.config, request.audit_report)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deploy failed: {str(e)}")


class FixRequest(BaseModel):
    url: str
    audit_report: dict


@router.post("/fix")
async def fix_website(request: FixRequest):
    """Generate all SEO fixes for a URL based on its audit report."""
    url = request.url.strip()
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    try:
        fixes = generate_fixes(url, request.audit_report)
        # Return everything except zip_bytes (sent separately)
        return {
            "head_html":           fixes["head_html"],
            "schema_jsonld":       fixes["schema_jsonld"],
            "robots_txt":          fixes["robots_txt"],
            "content":             fixes["content"],
            "implementation_guide": fixes["implementation_guide"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fix generation failed: {str(e)}")


@router.post("/fix/download")
async def download_fixes(request: FixRequest):
    """Generate fixes and return as a downloadable ZIP file."""
    url = request.url.strip()
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    try:
        fixes = generate_fixes(url, request.audit_report)
        from io import BytesIO
        return StreamingResponse(
            BytesIO(fixes["zip_bytes"]),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=seo-fixes.zip"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fix generation failed: {str(e)}")
