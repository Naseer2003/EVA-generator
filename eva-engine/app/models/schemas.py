from pydantic import BaseModel
from typing import List, Optional, Literal

# ─── Request ───────────────────────────────────────────────────────────────────

class EVARequest(BaseModel):
    """
    EVA Request — PVP2006 analytical methodology.

    data:              List of maximum wall loss values (one per inspected tube).
    method:            "mle" (default, recommended) or "mom".
    confidence_levels: Confidence levels for CI — [0.80, 0.90, 0.95, 0.99].
    return_periods:    Total population sizes N to compute extreme values for.
    """
    data: List[float]
    method: Literal["mle", "mom"] = "mle"
    confidence_levels: List[float] = [0.80, 0.90, 0.95, 0.99]
    return_periods: List[int] = [2, 5, 10, 25, 50, 100]
    override_n: Optional[int] = None  # When set, use this as n for SE & t-value (e.g. total tubes measured)
    override_mu: Optional[float] = None
    override_beta: Optional[float] = None


# ─── Response Models ───────────────────────────────────────────────────────────

class Parameters(BaseModel):
    mu: float          # location parameter (lambda in PVP2006)
    beta: float        # scale parameter (delta in PVP2006)
    xi: Optional[float] = None  # shape parameter (not used — Gumbel only)


class ReturnLevel(BaseModel):
    period: int        # Population size N
    value: float       # x_N = mu + beta * y_N  (best estimate)
    ci_lower: float    # x_N - t*SE  (CONSERVATIVE — use for mechanical integrity)
    ci_upper: float    # x_N + t*SE  (upper bound)
    se: float          # Standard error SE(x_N)  per PVP2006 Eq. 15
    all_confidences: Optional[dict] = None  # {level: {"lower": ..., "upper": ..., "t_value": ..., "se": ...}}


class PlotData(BaseModel):
    probability_plot: dict   # observed, theoretical, reduced_variates, probabilities
    return_level_plot: dict  # curve data + exact period points with CI


class GoodnessOfFit(BaseModel):
    ad_statistic: float
    ad_critical_value: float
    ad_passed: bool
    ks_statistic: float
    ks_p_value: float


class EVAResponse(BaseModel):
    method: str              # "mle" or "mom"
    n_observations: int      # sample size n used in CI formula
    parameters: Parameters
    return_levels: List[ReturnLevel]
    goodness_of_fit: GoodnessOfFit
    plot_data: PlotData
