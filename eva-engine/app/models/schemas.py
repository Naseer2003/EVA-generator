from pydantic import BaseModel
from typing import List, Optional, Literal

# ─── Request ───────────────────────────────────────────────────────────────────

class EVARequest(BaseModel):
    data: List[float]
    distribution: Literal["gumbel", "gev", "weibull"] = "gumbel"
    method: Literal["mle", "mom"] = "mle"
    confidence_levels: List[float] = [0.95]
    return_periods: List[int] = [2, 5, 10, 25, 50, 100]
    n_bootstrap: int = 1000

# ─── Response Models ───────────────────────────────────────────────────────────

class Parameters(BaseModel):
    mu: float        # location parameter
    beta: float      # scale parameter
    xi: Optional[float] = None  # shape parameter (GEV only)

class ReturnLevel(BaseModel):
    period: int
    value: float
    ci_lower: float
    ci_upper: float
    all_confidences: Optional[dict] = None # Map of level -> upper_bound

class GoodnessOfFit(BaseModel):
    ad_statistic: float
    ad_critical_value: float
    ad_passed: bool
    ks_statistic: float
    ks_p_value: float

class PlotData(BaseModel):
    probability_plot: dict   # x, y, fitted_x, fitted_y
    return_level_plot: dict  # periods, values, ci_lower, ci_upper

class EVAResponse(BaseModel):
    distribution: str
    method: str
    n_observations: int
    parameters: Parameters
    return_levels: List[ReturnLevel]
    goodness_of_fit: GoodnessOfFit
    plot_data: PlotData
