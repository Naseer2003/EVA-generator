"""
return_levels.py
----------------
Compute Gumbel return levels for given return periods.
"""
import numpy as np
from typing import List


def gumbel_return_level(mu: float, beta: float, T: int) -> float:
    """
    Return level formula:
      y_T = -ln(-ln(1 - 1/T))   ← reduced variate
      x_T = μ + β * y_T         ← return level
    """
    y_T = -np.log(-np.log(1.0 - 1.0 / T))
    return float(mu + beta * y_T)


def compute_return_levels(
    mu: float,
    beta: float,
    return_periods: List[int],
) -> List[dict]:
    """
    Compute return levels for all requested return periods.
    CIs are added by bootstrap.py after this step.
    """
    results = []
    for T in return_periods:
        if T < 2:
            raise ValueError(f"Return period must be >= 2, got {T}")
        rl = gumbel_return_level(mu, beta, T)
        results.append({"period": T, "value": rl})
    return results
