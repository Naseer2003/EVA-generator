"""
diagnostics.py
--------------
Anderson-Darling and Kolmogorov-Smirnov goodness-of-fit tests.
"""
import numpy as np
from scipy import stats
from app.statistics.distributions import gumbel_cdf


def anderson_darling_gumbel(data: np.ndarray, mu: float, beta: float) -> dict:
    """
    Compute the Anderson-Darling (AD) statistic for Gumbel fit.

    Formula:
      A² = -n - (1/n) * Σ (2i-1) * [ln F(x_i) + ln(1 - F(x_{n+1-i}))]

    Critical value at α=0.05 for Gumbel ≈ 0.757 (Stephens 1977).
    """
    n = len(data)
    # Must be sorted ascending for AD formula
    x_sorted = np.sort(data)

    # Theoretical CDF values
    F = gumbel_cdf(x_sorted, mu, beta)
    # Clip to avoid log(0)
    F = np.clip(F, 1e-10, 1 - 1e-10)

    i = np.arange(1, n + 1)
    ad_sum = np.sum((2 * i - 1) * (np.log(F) + np.log(1 - F[::-1])))
    A2 = -n - (1.0 / n) * ad_sum

    # Critical value at 5% significance for Gumbel (Stephens 1977)
    critical_value = 0.757
    passed = A2 < critical_value

    return {
        "ad_statistic": float(A2),
        "ad_critical_value": critical_value,
        "ad_passed": bool(passed),
    }


def ks_test_gumbel(data: np.ndarray, mu: float, beta: float) -> dict:
    """
    Kolmogorov-Smirnov test against fitted Gumbel CDF.
    """
    # Use SciPy's ks_1samp with our CDF
    result = stats.ks_1samp(
        data,
        cdf=lambda x: gumbel_cdf(np.atleast_1d(x), mu, beta),
    )
    return {
        "ks_statistic": float(result.statistic),
        "ks_p_value": float(result.pvalue),
    }
