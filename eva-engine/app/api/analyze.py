from fastapi import APIRouter, HTTPException
from app.models.schemas import EVARequest, EVAResponse
from app.services.eva_service import run_eva_analysis

router = APIRouter()

@router.post("/", response_model=EVAResponse)
async def analyze(request: EVARequest):
    """
    Run EVA analysis on provided data.
    Steps: preprocess → MoM init → MLE → return levels → AD test → bootstrap CI → plots
    """
    try:
        result = run_eva_analysis(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
