"""
eva_service.py
--------------
Orchestrates the full EVA pipeline in the correct order per the blueprint:

  preprocess → MoM init → MLE/MoM → return levels →
  bootstrap CI → AD test → KS test → build plots
"""
import numpy as np
from app.models.schemas import EVARequest, EVAResponse, Parameters, ReturnLevel, GoodnessOfFit, PlotData
from app.statistics.preprocessing import preprocess, extract_maxima
from app.statistics.mle import fit_gumbel_mle, fit_gumbel_mom
from app.statistics.return_levels import compute_return_levels
from app.statistics.bootstrap import bootstrap_confidence_intervals
from app.statistics.diagnostics import anderson_darling_gumbel, ks_test_gumbel
from app.statistics.plotting import build_probability_plot_data, build_return_level_plot_data


def run_eva_analysis(request: EVARequest) -> EVAResponse:
    # ── Step 1: Preprocess ──────────────────────────────────────────────────
    data = preprocess(request.data)
    data = extract_maxima(data)
    n = len(data)

    # ── Step 2: Parameter Estimation ────────────────────────────────────────
    if request.distribution == "gumbel":
        if request.method == "mle":
            mu, beta, _ = fit_gumbel_mle(data)
        else:
            mu, beta = fit_gumbel_mom(data)
        xi = None
    elif request.distribution in ("gev", "weibull"):
        from app.statistics.distributions import gev_fit
        xi, mu, beta = gev_fit(data)
    else:
        raise ValueError(f"Unsupported distribution: {request.distribution}")

    # ── Step 3: Return Levels (point estimates) ──────────────────────────────
    rl_points = compute_return_levels(mu, beta, request.return_periods)

    # ── Step 4: Bootstrap Confidence Intervals ───────────────────────────────
    ci_map = bootstrap_confidence_intervals(
        data=data,
        return_periods=request.return_periods,
        n_iterations=request.n_bootstrap,
        confidence_levels=request.confidence_levels,
    )

    # ── Step 5: Goodness-of-Fit Tests ────────────────────────────────────────
    ad_result = anderson_darling_gumbel(data, mu, beta)
    ks_result = ks_test_gumbel(data, mu, beta)

    # ── Step 6: Plot Data ────────────────────────────────────────────────────
    prob_plot = build_probability_plot_data(data, mu, beta)
    rl_plot   = build_return_level_plot_data(mu, beta, request.return_periods, ci_map)

    # ── Assemble Response ────────────────────────────────────────────────────
    return_levels = [
        ReturnLevel(
            period=rl["period"],
            value=rl["value"],
            ci_lower=ci_map[rl["period"]]["ci_lower"],
            ci_upper=ci_map[rl["period"]]["ci_upper"],
            all_confidences=ci_map[rl["period"]]["all"],
        )
        for rl in rl_points
    ]

    return EVAResponse(
        distribution=request.distribution,
        method=request.method,
        n_observations=n,
        parameters=Parameters(mu=mu, beta=beta, xi=xi),
        return_levels=return_levels,
        goodness_of_fit=GoodnessOfFit(
            ad_statistic=ad_result["ad_statistic"],
            ad_critical_value=ad_result["ad_critical_value"],
            ad_passed=ad_result["ad_passed"],
            ks_statistic=ks_result["ks_statistic"],
            ks_p_value=ks_result["ks_p_value"],
        ),
        plot_data=PlotData(
            probability_plot=prob_plot,
            return_level_plot=rl_plot,
        ),
    )
