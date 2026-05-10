from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, analyze
from app.config import settings

app = FastAPI(
    title="EVA Statistical Engine",
    description="Extreme Value Analysis engine for corrosion & reliability engineering",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])

@app.get("/")
def root():
    return {"service": "EVA Engine", "status": "running", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
