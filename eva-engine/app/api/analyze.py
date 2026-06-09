from fastapi import APIRouter, HTTPException
from app.models.schemas import EVARequest, EVAResponse
from app.services.eva_service import run_eva_analysis

router = APIRouter()

@router.post("/", response_model=EVAResponse)
async def analyze(request: EVARequest):
    """
    Run EVA analysis on provided wall loss data.

    Pipeline (PVP2006):
      preprocess (sort ascending) → MLE → return levels (Eq.10) →
      analytical CI (Eq.15-16) → build plots

    Input:  EVARequest with wall loss data (one max per inspected unit).
    Output: EVAResponse with x_N estimates and lower-bound CI values.
    """
    try:
        result = run_eva_analysis(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
