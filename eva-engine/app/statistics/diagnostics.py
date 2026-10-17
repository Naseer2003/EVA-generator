"""
diagnostics.py
--------------
Anderson-Darling and Kolmogorov-Smirnov goodness-of-fit tests for Gumbel.

AD critical values are sample-size-dependent, sourced from:
  Shin, H., Jung, Y., Jeong, C., & Heo, J.-H. (2012).
  "Assessment of modified Anderson-Darling test statistics for the
   generalized extreme value and generalized logistic distributions."
  — Table 1, mean function method with MLE parameters.

The AD* = (1 + 0.2/√n)·AD correction is Weibull-specific (MIL-HDBK-17)
and is NOT applied here. For Gumbel, the sample-size-dependent CV tables
already account for finite-sample effects.
"""
from functools import lru_cache

import numpy as np
from scipy import stats
from app.statistics.distributions import gumbel_cdf
from app.statistics.mle import fit_gumbel_mle, fit_gumbel_mle_batch


# ─── Gumbel AD Critical Values (2012 Paper, Table 1, Mean Function, MLE) ────
#
# Columns: α=0.20, α=0.15, α=0.10, α=0.05, α=0.01
# Rows keyed by sample size n.
# For intermediate n, we linearly interpolate.
# For n > 100, use n=100 values (converged).
# For n < 10, use n=10 values (most conservative).
#
_CV_TABLE = {
    # n:  (α=0.20, α=0.15, α=0.10, α=0.05, α=0.01)
    10:   (0.554,  0.607,  0.683,  0.815,  1.118),
    30:   (0.507,  0.558,  0.628,  0.747,  1.019),
    100:  (0.511,  0.562,  0.632,  0.752,  1.029),
}

_ALPHA_LEVELS = [0.20, 0.15, 0.10, 0.05, 0.01]
_CV_N_VALUES = sorted(_CV_TABLE.keys())  # [10, 30, 100]


def _interpolate_cv(n: int, alpha_index: int) -> float:
    """
    Linearly interpolate the critical value for a given sample size n
    at the specified alpha level (by column index into _CV_TABLE).

    - n < 10:  use n=10 values (conservative — larger CV, harder to reject)
    - n > 100: use n=100 values (converged)
    - 10 ≤ n ≤ 100: linear interpolation between anchor points
    """
    if n <= _CV_N_VALUES[0]:
        return _CV_TABLE[_CV_N_VALUES[0]][alpha_index]
    if n >= _CV_N_VALUES[-1]:
        return _CV_TABLE[_CV_N_VALUES[-1]][alpha_index]

    # Find the two bracketing anchor points
    for i in range(len(_CV_N_VALUES) - 1):
        n_lo = _CV_N_VALUES[i]
        n_hi = _CV_N_VALUES[i + 1]
        if n_lo <= n <= n_hi:
            cv_lo = _CV_TABLE[n_lo][alpha_index]
            cv_hi = _CV_TABLE[n_hi][alpha_index]
            # Linear interpolation
            t = (n - n_lo) / (n_hi - n_lo)
            return cv_lo + t * (cv_hi - cv_lo)

    # Fallback (should not reach here)
    return _CV_TABLE[_CV_N_VALUES[-1]][alpha_index]


def _get_critical_values(n: int) -> dict:
    """
    Return a dict of critical values for all supported significance levels,
    interpolated for the given sample size n.

    Returns: {"0.20": cv, "0.15": cv, "0.10": cv, "0.05": cv, "0.01": cv}
    """
    result = {}
    for idx, alpha in enumerate(_ALPHA_LEVELS):
        key = f"{alpha:.2f}"
        result[key] = round(_interpolate_cv(n, idx), 4)
    return result


def _compute_ad_statistic(data_sorted: np.ndarray, mu: float, beta: float) -> float:
    """
    Compute the raw Anderson-Darling statistic for a Gumbel fit.

    Formula (Anderson & Darling, 1954):
      A² = -n - (1/n) * Σ_{i=1}^{n} (2i-1) * [ln F(x_(i)) + ln(1 - F(x_(n+1-i)))]

    where F(x) = exp(-exp(-(x-μ)/β)) is the Gumbel CDF with estimated
    parameters (μ̂, β̂), and x_(1) ≤ x_(2) ≤ ... ≤ x_(n) is the sorted sample.

    The weight function ψ(u) = 1/[u(1-u)] embedded in this formula gives
    extra sensitivity to tail discrepancies — critical for extreme value analysis.
    """
    n = len(data_sorted)
    F = gumbel_cdf(data_sorted, mu, beta)
    F = np.clip(F, 1e-10, 1 - 1e-10)

    i = np.arange(1, n + 1)
    ad_sum = np.sum((2 * i - 1) * (np.log(F) + np.log(1 - F[::-1])))
    A2 = -n - (1.0 / n) * ad_sum
    return float(A2)


def _batch_ad_statistic(sorted_rows: np.ndarray, mu: np.ndarray, beta: np.ndarray) -> np.ndarray:
    """A² for every sorted row, vectorised. Mirrors _compute_ad_statistic."""
    n = sorted_rows.shape[1]
    z = (sorted_rows - mu[:, None]) / beta[:, None]
    F = np.clip(np.exp(-np.exp(-z)), 1e-10, 1 - 1e-10)
    i = np.arange(1, n + 1)
    total = ((2 * i - 1) * (np.log(F) + np.log(1.0 - F[:, ::-1]))).sum(axis=1)
    return -n - total / n


@lru_cache(maxsize=32)
def _null_a2_distribution(n: int, n_simulations: int = 10000, seed: int = 42) -> tuple:
    """
    Sorted null distribution of A² for a Gumbel fit with BOTH parameters
    estimated by MLE, at sample size n.

    Cached, and simulated from Gumbel(0, 1) rather than from the caller's
    (μ, β). Gumbel is a location-scale family and both parameters are
    estimated, so A² is parameter-free under H₀ — verified to 1e-13 across μ
    and β spanning five orders of magnitude. That makes the null a function of
    n alone, so it is computed once per sample size instead of once per
    request. Previously this ran 10,000 scipy optimisations on every single
    analysis, which was essentially the entire response time.

    Returned as a tuple so lru_cache can hold it (arrays are unhashable).
    """
    rng = np.random.default_rng(seed)
    out = []
    # Simulate in blocks: at n = 1140 a single 10,000-row array is ~90 MB.
    block = max(1, min(n_simulations, 2_000_000 // max(n, 1)))
    remaining = n_simulations
    while remaining > 0:
        size = min(block, remaining)
        u = np.clip(rng.uniform(0, 1, size=(size, n)), 1e-10, 1 - 1e-10)
        samples = np.sort(-np.log(-np.log(u)), axis=1)      # Gumbel(0, 1)
        mu_s, beta_s = fit_gumbel_mle_batch(samples)
        out.append(_batch_ad_statistic(samples, mu_s, beta_s))
        remaining -= size
    return tuple(np.sort(np.concatenate(out)).tolist())


def _monte_carlo_p_value(
    ad_observed: float,
    n: int,
    mu: float,
    beta: float,
    n_simulations: int = 10000,
    seed: int = 42,
) -> float:
    """
    Monte Carlo p-value for the AD statistic under H₀: Gumbel.

    p = (b + 1) / (m + 1) where b is the count of simulated statistics at or
    above the observed one. The naive b/m returns exactly 0 when none exceed,
    and a p-value of 0 is impossible — North, Curtis & Sham (2002),
    Am J Hum Genet 71:439.

    mu and beta are accepted for API compatibility but are not used: the null
    is parameter-free (see _null_a2_distribution).
    """
    null = np.asarray(_null_a2_distribution(int(n), int(n_simulations), int(seed)))
    exceed = null.size - int(np.searchsorted(null, ad_observed, side="left"))
    return (exceed + 1) / (null.size + 1)


def _generate_interpretation(
    ad_statistic: float,
    critical_value: float,
    p_value: float | None,
    n: int,
    alpha: float,
) -> str:
    """
    Generate a human-readable interpretation of the AD test result.
    """
    passed = ad_statistic < critical_value
    parts = []

    if passed:
        parts.append(
            f"The Gumbel distribution is NOT rejected at α={alpha:.2f} "
            f"(AD={ad_statistic:.4f} < CV={critical_value:.4f})."
        )
    else:
        parts.append(
            f"The Gumbel distribution IS REJECTED at α={alpha:.2f} "
            f"(AD={ad_statistic:.4f} ≥ CV={critical_value:.4f})."
        )

    if p_value is not None:
        # '%.3f' would print 1.9e-04 as '0.000'; keep the magnitude visible.
        shown = f"{p_value:.3f}" if p_value >= 1e-3 else f"{p_value:.2e}"
        if p_value >= 0.15:
            parts.append(
                f"The p-value ({shown}) indicates strong evidence "
                f"supporting the Gumbel fit."
            )
        elif p_value >= 0.05:
            parts.append(
                f"The p-value ({shown}) indicates the Gumbel fit is "
                f"acceptable but marginal. Consider increasing the sample size "
                f"for more reliable validation."
            )
        else:
            parts.append(
                f"The p-value ({shown}) indicates the Gumbel distribution "
                f"does not adequately model this data. Investigate possible causes: "
                f"outliers, mixed degradation populations, or non-stationary corrosion."
            )

    if n < 10:
        parts.append(
            f"⚠ Sample size (n={n}) is very small. The AD test has limited "
            f"statistical power at this size — it may fail to detect a poor fit. "
            f"Consider inspecting more units (PVP2006 recommends 20–30)."
        )

    return " ".join(parts)


def anderson_darling_gumbel(
    data: np.ndarray,
    mu: float,
    beta: float,
    significance_level: float = 0.05,
    compute_p_value: bool = True,
    n_simulations: int = 10000,
) -> dict:
    """
    Comprehensive Anderson-Darling goodness-of-fit test for Gumbel distribution.

    Uses sample-size-dependent critical values from:
      Shin et al. (2012), Table 1 — mean function method with MLE parameters.

    Parameters:
        data:               Observed data (will be sorted internally)
        mu:                 Gumbel location parameter (MLE estimate)
        beta:               Gumbel scale parameter (MLE estimate)
        significance_level: Primary α for pass/fail decision (default 0.05)
        compute_p_value:    If True, compute Monte Carlo p-value (adds ~2-5s)
        n_simulations:      Number of Monte Carlo simulations for p-value

    Returns dict with:
        ad_statistic:         Raw A² statistic
        ad_p_value:           Monte Carlo p-value (None if not computed)
        ad_critical_value:    CV at primary significance level (sample-size-adjusted)
        ad_critical_values:   CVs at all levels {"0.20": cv, ..., "0.01": cv}
        ad_passed:            True if AD < CV at primary α
        ad_significance_level: The α used for pass/fail
        ad_interpretation:    Human-readable assessment
        n_sample:             Sample size used
    """
    n = len(data)
    x_sorted = np.sort(data)

    # 1. Compute raw AD statistic
    ad_stat = _compute_ad_statistic(x_sorted, mu, beta)

    # 2. Get sample-size-dependent critical values (all levels)
    all_cvs = _get_critical_values(n)

    # 3. Get the CV at the primary significance level
    alpha_key = f"{significance_level:.2f}"
    if alpha_key not in all_cvs:
        # Fallback to α=0.05 if requested level not in table
        alpha_key = "0.05"
        significance_level = 0.05
    primary_cv = all_cvs[alpha_key]

    # 4. Pass/fail decision
    passed = ad_stat < primary_cv

    # 5. Monte Carlo p-value (optional — adds computation time)
    p_value = None
    if compute_p_value:
        p_value = _monte_carlo_p_value(
            ad_observed=ad_stat,
            n=n,
            mu=mu,
            beta=beta,
            n_simulations=n_simulations,
        )

    # 6. Human-readable interpretation
    interpretation = _generate_interpretation(
        ad_statistic=ad_stat,
        critical_value=primary_cv,
        p_value=p_value,
        n=n,
        alpha=significance_level,
    )

    return {
        "ad_statistic": float(ad_stat),
        "ad_p_value": float(p_value) if p_value is not None else None,
        "ad_critical_value": float(primary_cv),
        "ad_critical_values": all_cvs,
        "ad_passed": bool(passed),
        "ad_significance_level": float(significance_level),
        "ad_interpretation": interpretation,
        "n_sample": n,
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
