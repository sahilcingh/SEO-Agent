import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api.routes import router

load_dotenv()

app = FastAPI(title="SEO Agent API", version="1.0.0")

# Build allowed origins: always include localhost for dev,
# plus any production frontend URL set via FRONTEND_URL env var
_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
_frontend_url = os.environ.get("FRONTEND_URL", "").strip()
if _frontend_url:
    _origins.append(_frontend_url)
    # Also allow www variant if applicable
    if _frontend_url.startswith("https://"):
        _origins.append(_frontend_url.replace("https://", "https://www."))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
