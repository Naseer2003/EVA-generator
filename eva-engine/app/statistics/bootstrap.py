"""
bootstrap.py
------------
Bootstrap resampling to compute confidence intervals for return levels.
"""
import numpy as np
from typing import List, Tuple
from app.statistics.mle import fit_gumbel_mle
from app.statistics.return_levels import gumbel_return_level


def bootstrap_confidence_intervals(
    data: np.ndarray,
    return_periods: List[int],
    n_iterations: int = 1000,
    confidence_levels: List[float] = [0.95],
) -> dict:
    """
    Bootstrap CI for each return period.

    Workflow:
      1. Resample with replacement
      2. Refit Gumbel MLE
      3. Compute return levels
      4. Repeat n_iterations times
      5. Extract percentile-based CIs

    Returns dict: {period → (ci_lower, ci_upper)}
    """
    n = len(data)
    
    # Calculate all requested percentiles
    percentile_map = {}
    for cl in confidence_levels:
        alpha = 1.0 - cl
        percentile_map[cl] = ( (alpha / 2) * 100, (1 - alpha / 2) * 100 )

    # Bootstrap samples: shape (n_iterations, n_periods)
    boot_levels = {T: [] for T in return_periods}

    rng = np.random.default_rng(seed=42)

    for _ in range(n_iterations):
        sample = rng.choice(data, size=n, replace=True)
        try:
            mu_b, beta_b, _ = fit_gumbel_mle(sample)
            for T in return_periods:
                rl = gumbel_return_level(mu_b, beta_b, T)
                boot_levels[T].append(rl)
        except Exception:
            continue  # skip failed iterations

    ci_map = {} # { period: { "ci_lower": v, "ci_upper": v, "all": { level: upper_bound } } }
    for T in return_periods:
        vals = np.array(boot_levels[T])
        if len(vals) == 0:
            ci_map[T] = {"ci_lower": float("nan"), "ci_upper": float("nan"), "all": {}}
        else:
            # default to the first confidence level for primary bounds
            main_l, main_u = percentile_map[confidence_levels[0]]
            
            all_upper = {}
            for cl in confidence_levels:
                _, u_p = percentile_map[cl]
                all_upper[str(int(cl * 100))] = float(np.percentile(vals, u_p))

            ci_map[T] = {
                "ci_lower": float(np.percentile(vals, main_l)),
                "ci_upper": float(np.percentile(vals, main_u)),
                "all": all_upper
            }

    return ci_map
