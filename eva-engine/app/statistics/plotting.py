"""
plotting.py
-----------
Generate plot data arrays for probability plots and return level plots.
All output is JSON-serialisable (no matplotlib figures sent over the wire).

PVP2006 methodology:
  - Probability plot: observed vs. theoretical Gumbel quantiles
    x-axis = reduced variate y_i = -ln(-ln(Pi))
    y-axis = observed x_i (ascending wall loss values)
    fitted line = lambda + delta * y_i
  - Return level plot: x_N vs. N with CI bands
"""
import numpy as np
from typing import List
from app.statistics.preprocessing import plotting_positions, reduced_variates
from app.statistics.distributions import calculate_gumbel_se, calculate_t_value


def build_probability_plot_data(
    data: np.ndarray, mu: float, beta: float
) -> dict:
    """
    Probability (Gumbel paper / Q-Q) plot data.

    Data must already be sorted ascending (preprocessed).
    x-axis: theoretical Gumbel quantiles (reduced variate y_i)
    y-axis: observed wall loss values x_i

    Returns:
        {
            "observed":        [x_1, ..., x_n]  (ascending wall loss),
            "theoretical":     [fitted_x_1, ..., fitted_x_n],
            "reduced_variates":[y_1, ..., y_n],
            "probabilities":   [P_1, ..., P_n],
            "tabular_data":     List of dicts containing columns for each rank
        }
    """
    n = len(data)
    # data is already sorted ascending from preprocess()
    x_sorted = data

    probs    = plotting_positions(n)        # Pi = i/(n+1)
    reduced  = reduced_variates(probs)       # yi = -ln(-ln(Pi))

    # Theoretical quantiles from fitted Gumbel: x = lambda + delta * y
    theoretical = mu + beta * reduced

    # Calculate t-values for all confidence levels
    t_80 = calculate_t_value(n, 0.80)
    t_90 = calculate_t_value(n, 0.90)
    t_95 = calculate_t_value(n, 0.95)
    t_99 = calculate_t_value(n, 0.99)

    tabular_data = []
    for i in range(n):
        x = x_sorted[i]
        p = probs[i]
        y = reduced[i]
        
        # ln_pdf = -ln(beta) - z - exp(-z)
        z = (x - mu) / beta
        ln_pdf = float(-np.log(beta) - z - np.exp(-z))
        
        best_fit = float(mu + beta * y)
        se = float(calculate_gumbel_se(beta, n, y))
        
        tabular_data.append({
            "rank": int(i + 1),
            "observed": float(x),
            "probability": float(p),
            "reduced_variate": float(y),
            "ln_pdf": ln_pdf,
            "best_fit": best_fit,
            "se": se,
            "ci_80_lower": float(best_fit - t_80 * se),
            "ci_80_upper": float(best_fit + t_80 * se),
            "ci_90_lower": float(best_fit - t_90 * se),
            "ci_90_upper": float(best_fit + t_90 * se),
            "ci_95_lower": float(best_fit - t_95 * se),
            "ci_95_upper": float(best_fit + t_95 * se),
            "ci_99_lower": float(best_fit - t_99 * se),
            "ci_99_upper": float(best_fit + t_99 * se),
        })

    return {
        "observed":         x_sorted.tolist(),
        "theoretical":      theoretical.tolist(),
        "reduced_variates": reduced.tolist(),
        "probabilities":    probs.tolist(),
        "tabular_data":     tabular_data,
    }


def build_return_level_plot_data(
    mu: float,
    beta: float,
    n_sample: int,
    return_periods: List[int],
    confidence_level: float = 0.95,
) -> dict:
    """
    Return level plot data with smooth analytical CI bands.

    For each point on the curve (population N):
      x_N    = mu + beta * y_N                          (PVP2006 Eq. 10)
      SE     = beta * sqrt((1.109+0.514*y+0.608*y^2)/n) (Eq. 15)
      lower  = x_N - t * SE                             (Eq. 16, lower bound)
      upper  = x_N + t * SE                             (Eq. 16, upper bound)

    Returns:
        {
            "curve_periods":  [...],   smooth log-spaced N grid
            "curve_values":   [...],   x_N estimates
            "curve_ci_lower": [...],   lower bound (conservative)
            "curve_ci_upper": [...],   upper bound
            "periods":        [...],   exact requested N values
            "values":         [...],
            "ci_lower":       [...],
            "ci_upper":       [...],
        }
    """
    t_val = calculate_t_value(n_sample, confidence_level)
    max_N = max(return_periods) if return_periods else 1000

    # Smooth curve grid (log-spaced N from 2 to max_N * 5)
    n_grid = np.logspace(np.log10(2.01), np.log10(max_N * 5), 200)

    curve_values   = []
    curve_ci_lower = []
    curve_ci_upper = []

    for N in n_grid:
        y_N  = -np.log(-np.log(1.0 - 1.0 / N))
        x_N  = mu + beta * y_N
        se   = calculate_gumbel_se(beta, n_sample, y_N)
        w    = t_val * se
        curve_values.append(float(x_N))
        curve_ci_lower.append(float(x_N - w))
        curve_ci_upper.append(float(x_N + w))

    # Exact period points
    periods_list = sorted(return_periods)
    values_list  = []
    ci_lower     = []
    ci_upper     = []

    for N in periods_list:
        y_N  = -np.log(-np.log(1.0 - 1.0 / N))
        x_N  = mu + beta * y_N
        se   = calculate_gumbel_se(beta, n_sample, y_N)
        w    = t_val * se
        values_list.append(float(x_N))
        ci_lower.append(float(x_N - w))
        ci_upper.append(float(x_N + w))

    return {
        "curve_periods":   n_grid.tolist(),
        "curve_values":    curve_values,
        "curve_ci_lower":  curve_ci_lower,
        "curve_ci_upper":  curve_ci_upper,
        "periods":         periods_list,
        "values":          values_list,
        "ci_lower":        ci_lower,
        "ci_upper":        ci_upper,
    }
