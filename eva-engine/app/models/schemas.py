from pydantic import BaseModel
from typing import List, Optional, Literal, Any, Dict

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
    # Anderson-Darling test (Gumbel-specific, sample-size-dependent CVs)
    ad_statistic: float                          # Raw A² statistic
    ad_p_value: Optional[float] = None           # Monte Carlo p-value
    ad_critical_value: float                     # CV at primary α (sample-size-adjusted)
    ad_critical_values: Optional[dict] = None    # CVs at all α levels {"0.20": cv, ...}
    ad_passed: bool                              # AD < CV at primary α
    ad_significance_level: float = 0.05          # Primary α used for pass/fail
    ad_interpretation: Optional[str] = None      # Human-readable assessment
    n_sample: Optional[int] = None               # Sample size used in test

    # Kolmogorov-Smirnov test
    ks_statistic: float
    ks_p_value: float


class EVAResponse(BaseModel):
    method: str              # "mle" or "mom"
    n_observations: int      # sample size n used in CI formula
    parameters: Parameters
    return_levels: List[ReturnLevel]
    goodness_of_fit: GoodnessOfFit
    plot_data: PlotData


# ─── AD Multi-Distribution Test ────────────────────────────────────────────────

class ADTestRequest(BaseModel):
    """Request for multi-distribution Anderson-Darling GOF testing."""
    data: List[float]
    significance_level: float = 0.05
    # Engineering metadata (optional — passed through from backend)
    total_population: Optional[int] = None       # N total tubes in exchanger
    nominal_thickness: Optional[float] = None    # nominal wall thickness (mm)
    report_name: Optional[str] = None            # e.g. "1E-3012"


class DistributionResult(BaseModel):
    """Result of an AD test for a single candidate distribution."""
    distribution: str
    ad_statistic: float
    ad_modified: Optional[float] = None
    critical_value: float
    p_value: Optional[float] = None
    passed: bool
    parameters: Dict[str, Any] = {}
    engineering_parameters: Optional[Dict[str, Any]] = None   # human-readable engineering params
    rank: Optional[int] = None
    h0: Optional[str] = None
    decision: Optional[str] = None
    formula: Optional[str] = None
    cv_formula: Optional[str] = None
    critical_values_all: Optional[Dict[str, float]] = None
    interpretation: Optional[str] = None


class ADTestResponse(BaseModel):
    """Response from multi-distribution AD GOF testing."""
    results: List[DistributionResult]
    recommended: str              # Best-fit distribution name
    n_observations: int           # n_tested = number of inspected tubes
    n_total: Optional[int] = None            # N_total = total tubes in exchanger
    nominal_thickness: Optional[float] = None  # nominal wall thickness (mm)
    report_name: Optional[str] = None          # report/exchanger ID
    significance_level: float
    is_discretized: Optional[bool] = False
    n_unique: Optional[int] = None
    discretization_note: Optional[str] = None
