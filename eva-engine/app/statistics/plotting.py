"""
plotting.py
-----------
Generate plot data arrays for probability plots and return level plots.
All output is JSON-serialisable (no matplotlib figures sent over the wire).
"""
import numpy as np
from typing import List
from app.statistics.preprocessing import plotting_positions, reduced_variates
from app.statistics.distributions import gumbel_cdf
from app.statistics.return_levels import gumbel_return_level


def build_probability_plot_data(
    data: np.ndarray, mu: float, beta: float
) -> dict:
    """
    Probability (QQ) plot data.
    x = theoretical Gumbel quantiles, y = observed sorted values.
    """
    n = len(data)
    x_sorted = np.sort(data)

    probs = plotting_positions(n)
    reduced = reduced_variates(probs)

    # Theoretical quantiles from fitted Gumbel
    theoretical = mu + beta * reduced

    return {
        "observed": x_sorted.tolist(),
        "theoretical": theoretical.tolist(),
        "reduced_variates": reduced.tolist(),
        "probabilities": probs.tolist(),
    }


def build_return_level_plot_data(
    mu: float,
    beta: float,
    return_periods: List[int],
    ci_map: dict,
) -> dict:
    """
    Return level plot data with CI bands.

    ci_map format (from bootstrap.py):
        { T: { "ci_lower": float, "ci_upper": float, "all": { "95": float, ... } } }

    Returns a dict with:
      - curve_periods / curve_values     → smooth fitted line (200-pt log grid)
      - curve_ci_lower / curve_ci_upper  → CI band interpolated on same grid
      - periods / values                 → scatter points at exact return periods
      - ci_lower / ci_upper              → CI at those exact periods
    """
    # ── Smooth curve grid ──────────────────────────────────────────────────────
    t_grid = np.logspace(np.log10(1.01), np.log10(max(return_periods) * 2), 200)
    rl_grid = [gumbel_return_level(mu, beta, float(T)) for T in t_grid]

    # ── Exact period points ────────────────────────────────────────────────────
    periods_list = sorted(return_periods)
    values_list  = [gumbel_return_level(mu, beta, T) for T in periods_list]

    # ── FIX: ci_map[T] is a dict, NOT a tuple ─────────────────────────────────
    ci_lower = [ci_map[T]["ci_lower"] for T in periods_list]
    ci_upper = [ci_map[T]["ci_upper"] for T in periods_list]

    # ── Interpolate CI bands onto smooth grid ──────────────────────────────────
    if len(periods_list) >= 2:
        grid_ci_lower = np.interp(t_grid, periods_list, ci_lower).tolist()
        grid_ci_upper = np.interp(t_grid, periods_list, ci_upper).tolist()
    else:
        grid_ci_lower = rl_grid[:]
        grid_ci_upper = rl_grid[:]

    return {
        "curve_periods":   t_grid.tolist(),
        "curve_values":    rl_grid,
        "curve_ci_lower":  grid_ci_lower,
        "curve_ci_upper":  grid_ci_upper,
        "periods":         periods_list,
        "values":          values_list,
        "ci_lower":        ci_lower,
        "ci_upper":        ci_upper,
    }
