import sys
from pathlib import Path

def check_venv():
    import os
    venv_path = Path(__file__).parent / "venv"
    if not venv_path.exists():
        print("WARNING: venv not found. Run 'python -m venv venv' first.")
        print("See README.md for setup instructions.")
    elif "VIRTUAL_ENV" not in os.environ:
        print("INFO: venv exists but not activated. Activate with:")
        print("  Windows: .\\venv\\Scripts\\activate")
        print("  Unix/Mac: source venv/bin/activate")

check_venv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, analyze, ad_test
from app.config import settings

app = FastAPI(
    title="EVA Statistical Engine",
    description="Extreme Value Analysis engine for corrosion & reliability engineering",
    version="1.0.0",
)

# NOTE: gzip is deliberately NOT enabled here. The only caller is the backend,
# and that hop is always local — same Docker network under compose, plain
# localhost inside the ECS task. Measured at n=1140: compressing the ~400 KB
# response cuts it to ~86 KB but takes the call from 53 ms to 87 ms, because
# the CPU spent compressing exceeds the transfer time saved on loopback.
# Compression belongs on the backend -> browser hop, where it is a real win.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(ad_test.router, prefix="/ad-test", tags=["ad-test"])

@app.get("/")
def root():
    return {"service": "EVA Engine", "status": "running", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
