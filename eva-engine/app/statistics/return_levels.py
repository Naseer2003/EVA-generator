"""
return_levels.py
----------------
Compute Gumbel extreme value and confidence interval lower bounds.

PVP2006 methodology:
  - Eq. 10:  x_N = lambda + delta * y_N
             where y_N = -ln(-ln(1 - 1/N))  — reduced variate for population N
  - Eq. 15:  SE(x_N) = delta * sqrt((1.109 + 0.514*y_N + 0.608*y_N^2) / n)
  - Eq. 16:  CI(x_N) = x_N ± t * SE(x_N)
  - For mechanical integrity: use LOWER BOUND = x_N - t * SE(x_N)

The "return period" T is the total population N (all tubes in heat exchanger).
"""
import numpy as np
from typing import List
from app.statistics.distributions import calculate_gumbel_se, calculate_t_value


def gumbel_reduced_variate(N: float) -> float:
    """
    Gumbel reduced variate for a population of size N — PVP2006 Eq. 19 / combined from Eq. 6-9:
      y_N = -ln(-ln(1 - 1/N))

    This is the return level point for P = (N-1)/N.

    Args:
        N: Total population size (e.g. 2000 tubes)

    Returns:
        Reduced variate y_N
    """
    if N <= 1:
        raise ValueError(f"Population size N={N} must be > 1.")
    p = 1.0 - 1.0 / N
    return float(-np.log(-np.log(p)))


def gumbel_return_level(mu: float, beta: float, N: float) -> float:
    """
    Estimated extreme wall loss for a population of N units — PVP2006 Eq. 10:
      x_N = lambda + delta * y_N

    Args:
        mu:   Gumbel location parameter (lambda)
        beta: Gumbel scale parameter (delta)
        N:    Total population size

    Returns:
        x_N — the estimated maximum wall loss in the population
    """
    y_N = gumbel_reduced_variate(N)
    return float(mu + beta * y_N)


def compute_return_levels(
    mu: float,
    beta: float,
    n_sample: int,
    return_periods: List[int],
    confidence_levels: List[float] = [0.80, 0.90, 0.95, 0.99],
) -> List[dict]:
    """
    Compute extreme value estimates and their analytical confidence intervals
    for each population size N in return_periods.

    For each N:
      - x_N = lambda + delta * y_N                     (PVP2006 Eq. 10)
      - SE(x_N) = delta * sqrt((1.109 + 0.514*y + 0.608*y^2) / n)  (Eq. 15)
      - CI lower = x_N - t * SE(x_N)                   (Eq. 16, lower bound)
      - CI upper = x_N + t * SE(x_N)                   (Eq. 16, upper bound)

    The lower bound is the CONSERVATIVE estimate for mechanical integrity.

    Args:
        mu:               MLE location parameter
        beta:             MLE scale parameter
        n_sample:         Number of inspected units (sample size)
        return_periods:   List of population sizes N to compute
        confidence_levels: e.g. [0.80, 0.90, 0.95, 0.99]

    Returns:
        List of dicts, one per N:
        {
            "period":          N,
            "value":           x_N  (best estimate),
            "ci_lower":        x_N - t*SE  (conservative, use this for integrity),
            "ci_upper":        x_N + t*SE,
            "se":              SE(x_N),
            "all_confidences": {
                "80": {"lower": ..., "upper": ..., "t_value": ..., "se": ...},
                "90": {...},
                "95": {...},
                "99": {...},
            }
        }
    """
    results = []

    for N in return_periods:
        if N < 2:
            raise ValueError(
                f"Population size N={N} is invalid. Must be >= 2. "
                f"The minimum practical return period is N=2."
            )

        y_N = gumbel_reduced_variate(N)
        x_N = mu + beta * y_N
        se  = calculate_gumbel_se(beta, n_sample, y_N)

        # Build confidence interval data for each requested level
        ci_data = {}
        for cl in confidence_levels:
            t = calculate_t_value(n_sample, cl)
            width = t * se
            label = str(int(round(cl * 100)))
            ci_data[label] = {
                "lower":   float(x_N - width),   # conservative — use for integrity
                "upper":   float(x_N + width),
                "t_value": float(t),
                "se":      float(se),
            }

        # Use the first confidence level as the "primary" for top-level fields
        main_cl  = str(int(round(confidence_levels[0] * 100)))
        ci_lower = ci_data[main_cl]["lower"]
        ci_upper = ci_data[main_cl]["upper"]

        results.append({
            "period":          N,
            "value":           float(x_N),
            "ci_lower":        ci_lower,
            "ci_upper":        ci_upper,
            "se":              float(se),
            "all_confidences": ci_data,
        })

    return results
