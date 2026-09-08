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
import numpy as np
from scipy import stats
from app.statistics.distributions import gumbel_cdf
from app.statistics.mle import fit_gumbel_mle


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


def _monte_carlo_p_value(
    ad_observed: float,
    n: int,
    mu: float,
    beta: float,
    n_simulations: int = 10000,
    seed: int = 42,
) -> float:
    """
    Compute the Monte Carlo p-value for the AD statistic under H₀: Gumbel.

    Procedure:
      1. Generate n_simulations synthetic samples of size n from Gumbel(μ, β)
      2. For each sample: re-estimate parameters via MLE, compute AD statistic
      3. p-value = proportion of simulated AD statistics ≥ ad_observed

    This gives the exact (simulation-based) probability of observing an AD
    statistic as extreme as the one computed from the real data, assuming
    the Gumbel distribution is correct.

    The re-estimation step is critical: since we estimated parameters from
    data, the null distribution of AD depends on the estimation procedure.
    Simply generating from known parameters would give the wrong distribution
    (the "known parameter" case from Anderson 1954/2010, which has much
    larger critical values).
    """
    rng = np.random.default_rng(seed)
    count_exceed = 0

    for _ in range(n_simulations):
        # Generate synthetic Gumbel sample
        # Gumbel CDF: F(x) = exp(-exp(-(x-μ)/β))
        # Inverse CDF (quantile function): x = μ - β * ln(-ln(u))
        u = rng.uniform(0, 1, size=n)
        u = np.clip(u, 1e-10, 1 - 1e-10)
        synthetic = mu - beta * np.log(-np.log(u))
        synthetic = np.sort(synthetic)

        # Re-estimate parameters via MLE
        try:
            mu_sim, beta_sim, _ = fit_gumbel_mle(synthetic)
        except Exception:
            continue  # skip failed fits

        # Compute AD statistic for the synthetic sample
        ad_sim = _compute_ad_statistic(synthetic, mu_sim, beta_sim)
        if ad_sim >= ad_observed:
            count_exceed += 1

    return count_exceed / n_simulations


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
        if p_value >= 0.15:
            parts.append(
                f"The p-value ({p_value:.3f}) indicates strong evidence "
                f"supporting the Gumbel fit."
            )
        elif p_value >= 0.05:
            parts.append(
                f"The p-value ({p_value:.3f}) indicates the Gumbel fit is "
                f"acceptable but marginal. Consider increasing the sample size "
                f"for more reliable validation."
            )
        else:
            parts.append(
                f"The p-value ({p_value:.3f}) indicates the Gumbel distribution "
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
