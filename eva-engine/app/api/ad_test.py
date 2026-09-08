from fastapi import APIRouter, HTTPException
from app.models.schemas import ADTestRequest, ADTestResponse
from app.statistics.ad_multi import run_multi_distribution_ad_test

router = APIRouter()

@router.post("/", response_model=ADTestResponse)
async def ad_test(request: ADTestRequest):
    """
    Run Anderson-Darling GOF tests against all 5 candidate distributions:
      Normal, Lognormal, Weibull, Exponential, Gumbel.

    Returns ranked results with a recommended best-fit distribution.
    The distribution with the lowest AD statistic (among those that pass)
    is recommended.

    Engineering metadata (report_name, nominal_thickness, total_population) are
    optional — when provided they enrich the response with per-distribution
    engineering parameter labels and context.

    References:
      - Romeu (2003), START 2003-5: A_DTest.md
      - Zainal Abidin et al. (2012): Gumbel_GOF_2012.md
      - Anderson & Darling (1954)
    """
    try:
        result = run_multi_distribution_ad_test(
            data=request.data,
            significance_level=request.significance_level,
            total_population=request.total_population,
            nominal_thickness=request.nominal_thickness,
            report_name=request.report_name,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AD test failed: {str(e)}")
