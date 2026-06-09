"""
eva_service.py
--------------
Orchestrates the full EVA pipeline per PVP2006 / ASTM E2283:

  1. Preprocess (sort ascending, validate)
  2. MLE parameter estimation (Gumbel lambda, delta)
  3. Return levels x_N for each population size N
  4. Analytical confidence intervals (Eq. 15-16)
  5. Build plot data

The output prioritises the LOWER BOUND of the confidence interval
(x_N - t*SE) as the conservative estimate for mechanical integrity.

No bootstrap, no GEV, no goodness-of-fit tests (not required per PVP2006).
"""
import numpy as np
from app.models.schemas import (
    EVARequest, EVAResponse, Parameters, ReturnLevel, PlotData, GoodnessOfFit
)
from app.statistics.preprocessing import preprocess
from app.statistics.mle import fit_gumbel_mle
from app.statistics.distributions import gumbel_mom
from app.statistics.return_levels import compute_return_levels
from app.statistics.plotting import build_probability_plot_data, build_return_level_plot_data
from app.statistics.diagnostics import anderson_darling_gumbel, ks_test_gumbel


def run_eva_analysis(request: EVARequest) -> EVAResponse:
    """
    Run the full PVP2006 EVA pipeline.

    Input: EVARequest with:
      - data:              list of maximum wall loss values (one per inspected tube)
      - method:            "mle" (recommended) or "mom"
      - confidence_levels: e.g. [0.80, 0.90, 0.95, 0.99]
      - return_periods:    list of population sizes N (e.g. [100, 500, 2000])

    Output: EVAResponse with return levels and confidence interval lower bounds.
    """
    # ── Step 1: Preprocess ──────────────────────────────────────────────────
    # Sorts ascending per PVP2006 Eq.1: x1 <= x2 <= ... <= xn
    data = preprocess(request.data)
    n = len(data)

    # ── Step 2: Parameter Estimation ────────────────────────────────────────
    # Only Gumbel — mandatory for mechanical integrity per PVP2006.
    if request.method == "mle":
        mu, beta, _ = fit_gumbel_mle(data)
    else:
        # MoM: quick estimate — less accurate than MLE
        mu, beta = gumbel_mom(data)

    # ── Step 3: Return Levels & Analytical CI ────────────────────────────────
    # PVP2006 Eq. 10, 15, 16 — analytical SE and Student's t-test CIs.
    # confidence_levels are sorted descending so "primary" is the most
    # conservative (99% if present).
    sorted_cls = sorted(request.confidence_levels, reverse=True)
    return_levels_data = compute_return_levels(
        mu=mu,
        beta=beta,
        n_sample=n,
        return_periods=request.return_periods,
        confidence_levels=sorted_cls,
    )

    # ── Step 4: Plot Data ────────────────────────────────────────────────────
    prob_plot = build_probability_plot_data(data, mu, beta)

    # Use the HIGHEST confidence level for the primary CI band on the chart
    primary_cl = max(request.confidence_levels)
    rl_plot = build_return_level_plot_data(
        mu=mu,
        beta=beta,
        n_sample=n,
        return_periods=request.return_periods,
        confidence_level=primary_cl,
    )

    # ── Step 5: Goodness-of-Fit Tests ────────────────────────────────────────
    ad_res = anderson_darling_gumbel(data, mu, beta)
    ks_res = ks_test_gumbel(data, mu, beta)

    gof = GoodnessOfFit(
        ad_statistic=ad_res["ad_statistic"],
        ad_critical_value=ad_res["ad_critical_value"],
        ad_passed=ad_res["ad_passed"],
        ks_statistic=ks_res["ks_statistic"],
        ks_p_value=ks_res["ks_p_value"],
    )

    # ── Step 6: Assemble Response ────────────────────────────────────────────
    # ci_lower = x_N - t*SE  → CONSERVATIVE estimate (use this for integrity)
    # ci_upper = x_N + t*SE  → non-conservative upper bound
    return_levels = []
    for rl in return_levels_data:
        return_levels.append(
            ReturnLevel(
                period=rl["period"],
                value=rl["value"],
                ci_lower=rl["ci_lower"],      # conservative lower bound
                ci_upper=rl["ci_upper"],      # upper bound
                se=rl["se"],
                all_confidences=rl["all_confidences"],
            )
        )

    return EVAResponse(
        method=request.method,
        n_observations=n,
        parameters=Parameters(mu=mu, beta=beta, xi=None),
        return_levels=return_levels,
        goodness_of_fit=gof,
        plot_data=PlotData(
            probability_plot=prob_plot,
            return_level_plot=rl_plot,
        ),
    )
