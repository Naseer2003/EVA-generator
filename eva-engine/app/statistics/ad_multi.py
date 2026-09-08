"""
ad_multi.py
-----------
Multi-distribution Anderson-Darling (AD) goodness-of-fit testing.

Tests the input data against 5 candidate distributions:
  1. Normal       -- AD formula from A_DTest.md (START 2003-5) Eq. 1
  2. Lognormal    -- Log-transform then Normal AD test (A_DTest.md Section 2)
  3. Weibull      -- AD formula from A_DTest.md Eq. 2 with OSL p-value
  4. Exponential  -- Weibull special case with beta=1 (A_DTest.md Section 3)
  5. Gumbel       -- From Gumbel_GOF_2012.md with sample-size-dependent CVs

References:
  - Romeu, J.L. (2003). "Anderson-Darling: A Goodness of Fit Test for
    Small Samples Assumptions." START 2003-5, RAC.
  - Zainal Abidin, N. et al. (2012). "The Goodness-of-fit Test for
    Gumbel Distribution: A Comparative Study." MATEMATIKA, 28(1), 35-48.
  - Anderson, T.W. & Darling, D.A. (1954). "A test of goodness-of-fit."
    J. Am. Stat. Assoc., 49, 765-769.
"""

import numpy as np
from scipy import stats
from typing import List, Dict, Optional, Any
from app.statistics.distributions import gumbel_cdf
from app.statistics.mle import fit_gumbel_mle


def _ad_statistic_generic(data_sorted: np.ndarray, cdf_values: np.ndarray) -> float:
    """
    Generic AD statistic computation.

    Formula (Anderson & Darling, 1954):
      A^2 = -n - (1/n) * sum_{i=1}^{n} (2i-1) * [ln F(x_(i)) + ln(1 - F(x_(n+1-i)))]
    """
    n = len(data_sorted)
    F = np.clip(cdf_values, 1e-10, 1 - 1e-10)
    i = np.arange(1, n + 1)
    ad_sum = np.sum((2 * i - 1) * (np.log(F) + np.log(1 - F[::-1])))
    A2 = -n - (1.0 / n) * ad_sum
    return float(max(A2, 0.0))


def ad_test_normal(data: np.ndarray, significance_level: float = 0.05,
                   nominal_thickness: float = None) -> Dict[str, Any]:
    """Anderson-Darling GOF test for Normal distribution."""
    x = np.sort(data)
    n = len(x)

    mu = float(np.mean(x))
    sigma = float(np.std(x, ddof=1))
    if sigma < 1e-10:
        sigma = 1e-10

    z = (x - mu) / sigma
    F = stats.norm.cdf(z)

    ad_stat = _ad_statistic_generic(x, F)
    modifier = 1 + 0.75 / n + 2.25 / (n * n)
    ad_star = ad_stat * modifier
    cv = 0.752 / modifier
    p_value = _normal_ad_pvalue(ad_star)
    passed = ad_stat < cv

    # Engineering parameters with proper labels
    eng_params = {
        "Mean μ (mm)": round(mu, 4),
        "Std Dev σ (mm)": round(sigma, 4),
    }
    if nominal_thickness and nominal_thickness > 0:
        eng_params["Nominal Thickness (mm)"] = round(nominal_thickness, 4)
        eng_params["Mean Wall Loss (mm)"] = round(nominal_thickness - mu, 4)

    return {
        "distribution": "Normal",
        "ad_statistic": round(ad_stat, 6),
        "ad_modified": round(ad_star, 6),
        "critical_value": round(cv, 6),
        "p_value": round(p_value, 6) if p_value is not None else None,
        "passed": passed,
        "h0": "H0: Data follows a Normal distribution",
        "decision": "Fail to Reject H0 (No reason to reject)" if passed else "Reject H0 (Fit is rejected)",
        "parameters": {"mu": round(mu, 6), "sigma": round(sigma, 6)},
        "engineering_parameters": eng_params,
        "formula": "AD = -n - (1/n) sum (2i-1)[ln Phi(z_i) + ln(1-Phi(z_{n+1-i}))]",
        "cv_formula": "CV = 0.752 / (1 + 0.75/n + 2.25/n^2)",
        "interpretation": _build_interpretation("Normal", ad_stat, cv, p_value, passed, n),
    }


def _normal_ad_pvalue(ad_star: float) -> float:
    """Approximate p-value for Normal AD test (D'Agostino & Stephens, 1986)."""
    if ad_star < 0.2:
        p = 1.0 - np.exp(-13.436 + 101.14 * ad_star - 223.73 * ad_star**2)
    elif ad_star < 0.34:
        p = 1.0 - np.exp(-8.318 + 42.796 * ad_star - 59.938 * ad_star**2)
    elif ad_star < 0.6:
        p = np.exp(0.9177 - 4.279 * ad_star - 1.38 * ad_star**2)
    elif ad_star < 10:
        p = np.exp(1.2937 - 5.709 * ad_star + 0.0186 * ad_star**2)
    else:
        p = 0.0
    # Floor to 0.0001 so UI never displays exact '0.0000'
    return float(np.clip(max(p, 0.0001), 0.0001, 1.0))


def ad_test_lognormal(data: np.ndarray, significance_level: float = 0.05,
                      nominal_thickness: float = None) -> Dict[str, Any]:
    """Anderson-Darling GOF test for Lognormal distribution."""
    x_pos = data[data > 0]
    if len(x_pos) < 5:
        return _empty_result("Lognormal", "Insufficient positive data points")

    y = np.log(x_pos)
    result = ad_test_normal(y, significance_level)

    mu_log = float(np.mean(y))
    sigma_log = float(np.std(y, ddof=1))
    median_val = float(np.exp(mu_log))
    result["distribution"] = "Lognormal"
    result["h0"] = "H0: Data follows a Lognormal distribution"
    result["decision"] = "Fail to Reject H0 (No reason to reject)" if result["passed"] else "Reject H0 (Fit is rejected)"
    result["parameters"] = {
        "mu_log": round(mu_log, 6),
        "sigma_log": round(sigma_log, 6),
        "median": round(median_val, 6),
    }
    # Engineering parameters
    eng_params = {
        "Log-Mean μ_log": round(mu_log, 4),
        "Log-Std σ_log": round(sigma_log, 4),
        "Median (mm)": round(median_val, 4),
    }
    if nominal_thickness and nominal_thickness > 0:
        eng_params["Nominal Thickness (mm)"] = round(nominal_thickness, 4)
    result["engineering_parameters"] = eng_params
    result["formula"] = "y = ln(x), then Normal AD test on y"
    result["interpretation"] = _build_interpretation(
        "Lognormal", result["ad_statistic"], result["critical_value"],
        result["p_value"], result["passed"], len(x_pos)
    )
    return result


def ad_test_weibull(data: np.ndarray, significance_level: float = 0.05,
                    nominal_thickness: float = None) -> Dict[str, Any]:
    """Anderson-Darling GOF test for Weibull distribution."""
    x = np.sort(data)
    n = len(x)

    x_pos = x[x > 0]
    if len(x_pos) < 5:
        return _empty_result("Weibull", "Insufficient positive data points")

    try:
        beta_w, loc_w, alpha_w = stats.weibull_min.fit(x_pos, floc=0)
        if beta_w <= 0 or alpha_w <= 0:
            raise ValueError("Invalid Weibull parameters")
    except Exception:
        return _empty_result("Weibull", "Weibull MLE fitting failed")

    x_sorted = np.sort(x_pos)
    n = len(x_sorted)

    F = 1.0 - np.exp(-((x_sorted / alpha_w) ** beta_w))
    ad_stat = _ad_statistic_generic(x_sorted, F)
    ad_star = (1 + 0.2 / np.sqrt(n)) * ad_stat

    if ad_star > 0:
        # Reference: START 2003-5, Romeu (A_DTest.md), Eq. after Table 7.
        # OSL = 1 / (1 + exp[-0.1 + 1.24*ln(AD*) + 4.48*(AD*)])
        # Note: exp argument IS osl_exp itself (NOT -osl_exp).
        # Verified: AD*=2.9227 → osl_exp=14.32 → OSL=6e-7 (matches paper).
        osl_exp = -0.1 + 1.24 * np.log(max(ad_star, 1e-10)) + 4.48 * ad_star
        osl = 1.0 / (1.0 + np.exp(np.clip(osl_exp, -500, 500)))
    else:
        osl = 1.0

    # OSL is the p-value: reject H0 when OSL < alpha (bad fit = large AD, small OSL)
    passed = osl > significance_level
    # Floor p-value to avoid displaying exact 0
    osl = max(osl, 0.0001)
    cv = _weibull_approximate_cv(n, significance_level)

    # Engineering parameters
    eng_params = {
        "Scale α (mm)": round(float(alpha_w), 4),
        "Shape β": round(float(beta_w), 4),
        "Characteristic Life (mm)": round(float(alpha_w), 4),
    }
    if nominal_thickness and nominal_thickness > 0:
        eng_params["Nominal Thickness (mm)"] = round(nominal_thickness, 4)

    return {
        "distribution": "Weibull",
        "ad_statistic": round(ad_stat, 6),
        "ad_modified": round(ad_star, 6),
        "critical_value": round(cv, 6),
        "p_value": round(osl, 6),
        "passed": passed,
        "h0": "H0: Data follows a Weibull distribution",
        "decision": "Fail to Reject H0 (No reason to reject)" if passed else "Reject H0 (Fit is rejected)",
        "parameters": {
            "alpha": round(float(alpha_w), 6),
            "beta": round(float(beta_w), 6),
        },
        "engineering_parameters": eng_params,
        "formula": "A^2 = -n - (1/n) sum (2i-1)[ln F(x_i) + ln(1-F(x_{n+1-i}))]",
        "cv_formula": "OSL = 1/(1+exp[-0.1+1.24*ln(AD*)+4.48*AD*]); reject if OSL < alpha",
        "interpretation": _build_interpretation("Weibull", ad_stat, cv, osl, passed, n),
    }


def _weibull_approximate_cv(n: int, alpha: float = 0.05) -> float:
    """Approximate Weibull AD critical value by inverting the OSL formula."""
    from scipy.optimize import brentq

    target = np.log(1.0 / alpha - 1.0)

    def equation(ad_star):
        return -0.1 + 1.24 * np.log(max(ad_star, 1e-10)) + 4.48 * ad_star - target

    try:
        ad_star_cv = brentq(equation, 0.001, 10.0)
        cv = ad_star_cv / (1 + 0.2 / np.sqrt(n))
        return float(cv)
    except Exception:
        return 0.757


def ad_test_exponential(data: np.ndarray, significance_level: float = 0.05,
                        nominal_thickness: float = None) -> Dict[str, Any]:
    """Anderson-Darling GOF test for Exponential distribution."""
    x = np.sort(data)
    n = len(x)

    x_pos = x[x > 0]
    if len(x_pos) < 5:
        return _empty_result("Exponential", "Insufficient positive data points")

    alpha_exp = float(np.mean(x_pos))
    if alpha_exp <= 0:
        return _empty_result("Exponential", "Invalid scale parameter")

    x_sorted = np.sort(x_pos)
    n = len(x_sorted)

    F = 1.0 - np.exp(-(x_sorted / alpha_exp))
    ad_stat = _ad_statistic_generic(x_sorted, F)
    ad_star = (1 + 0.2 / np.sqrt(n)) * ad_stat

    if ad_star > 0:
        # Same OSL formula as Weibull (Exponential is Weibull with beta=1)
        osl_exp_val = -0.1 + 1.24 * np.log(max(ad_star, 1e-10)) + 4.48 * ad_star
        osl = 1.0 / (1.0 + np.exp(np.clip(osl_exp_val, -500, 500)))
    else:
        osl = 1.0

    # OSL is the p-value: reject H0 when OSL < alpha
    passed = osl > significance_level
    # Floor p-value to avoid displaying exact 0
    osl = max(osl, 0.0001)
    cv = _weibull_approximate_cv(n, significance_level)

    # Engineering parameters
    eng_params = {
        "Mean λ (mm)": round(alpha_exp, 4),
        "Rate 1/λ (1/mm)": round(1.0 / alpha_exp, 6),
        "Shape β (fixed)": 1.0,
    }
    if nominal_thickness and nominal_thickness > 0:
        eng_params["Nominal Thickness (mm)"] = round(nominal_thickness, 4)

    return {
        "distribution": "Exponential",
        "ad_statistic": round(ad_stat, 6),
        "ad_modified": round(ad_star, 6),
        "critical_value": round(cv, 6),
        "p_value": round(osl, 6),
        "passed": passed,
        "h0": "H0: Data follows an Exponential distribution",
        "decision": "Fail to Reject H0 (No reason to reject)" if passed else "Reject H0 (Fit is rejected)",
        "parameters": {"alpha": round(alpha_exp, 6), "beta": 1.0},
        "engineering_parameters": eng_params,
        "formula": "A^2 = -n - (1/n) sum (2i-1)[ln F(x_i) + ln(1-F(x_{n+1-i}))] with F(x)=1-exp(-x/alpha)",
        "cv_formula": "OSL = 1/(1+exp[-0.1+1.24*ln(AD*)+4.48*AD*]); reject if OSL < alpha",
        "interpretation": _build_interpretation("Exponential", ad_stat, cv, osl, passed, n),
    }


_GUMBEL_CV_TABLE = {
    10:   (0.554,  0.607,  0.683,  0.815,  1.118),
    30:   (0.507,  0.558,  0.628,  0.747,  1.019),
    100:  (0.511,  0.562,  0.632,  0.752,  1.029),
}
_ALPHA_LEVELS = [0.20, 0.15, 0.10, 0.05, 0.01]


def _interpolate_gumbel_cv(n: int, alpha_index: int) -> float:
    """Linearly interpolate Gumbel critical value for sample size n."""
    keys = sorted(_GUMBEL_CV_TABLE.keys())
    if n <= keys[0]:
        return _GUMBEL_CV_TABLE[keys[0]][alpha_index]
    if n >= keys[-1]:
        return _GUMBEL_CV_TABLE[keys[-1]][alpha_index]
    for i in range(len(keys) - 1):
        if keys[i] <= n <= keys[i + 1]:
            cv_lo = _GUMBEL_CV_TABLE[keys[i]][alpha_index]
            cv_hi = _GUMBEL_CV_TABLE[keys[i + 1]][alpha_index]
            t = (n - keys[i]) / (keys[i + 1] - keys[i])
            return cv_lo + t * (cv_hi - cv_lo)
    return _GUMBEL_CV_TABLE[keys[-1]][alpha_index]


def ad_test_gumbel(data: np.ndarray, significance_level: float = 0.05,
                   nominal_thickness: float = None) -> Dict[str, Any]:
    """Anderson-Darling GOF test for Gumbel (Extreme Value Type I) distribution."""
    x_sorted = np.sort(data)
    n = len(x_sorted)

    try:
        mu, beta, _ = fit_gumbel_mle(x_sorted)
    except Exception:
        return _empty_result("Gumbel", "Gumbel MLE fitting failed")

    F = gumbel_cdf(x_sorted, mu, beta)
    F = np.clip(F, 1e-10, 1 - 1e-10)

    ad_stat = _ad_statistic_generic(x_sorted, F)

    alpha_idx = 3
    for idx, a in enumerate(_ALPHA_LEVELS):
        if abs(a - significance_level) < 0.001:
            alpha_idx = idx
            break
    cv = _interpolate_gumbel_cv(n, alpha_idx)

    all_cvs = {}
    for idx, a in enumerate(_ALPHA_LEVELS):
        all_cvs[f"{a:.2f}"] = round(_interpolate_gumbel_cv(n, idx), 4)

    p_value = _gumbel_monte_carlo_pvalue(ad_stat, n, mu, beta, n_sim=5000)
    passed = ad_stat < cv

    # Engineering parameters — EV Type I (Gumbel) per PVP2006/ASTM E2283
    gamma = 0.5772156649  # Euler-Mascheroni constant
    mean_val = mu + gamma * beta
    eng_params = {
        "Location μ (mm)": round(mu, 4),
        "Scale β (mm)": round(beta, 4),
        "Mean (mm)": round(mean_val, 4),
        "Std Dev (mm)": round(beta * np.pi / np.sqrt(6), 4),
    }
    if nominal_thickness and nominal_thickness > 0:
        eng_params["Nominal Thickness (mm)"] = round(nominal_thickness, 4)
        eng_params["Mean Wall Loss (mm)"] = round(nominal_thickness - mean_val, 4)

    return {
        "distribution": "Gumbel",
        "ad_statistic": round(ad_stat, 6),
        "ad_modified": None,
        "critical_value": round(cv, 6),
        "critical_values_all": all_cvs,
        "p_value": round(p_value, 6) if p_value is not None else None,
        "passed": passed,
        "h0": "H0: Data follows a Gumbel distribution",
        "decision": "Fail to Reject H0 (No reason to reject)" if passed else "Reject H0 (Fit is rejected)",
        "parameters": {"mu": round(mu, 6), "beta": round(beta, 6)},
        "engineering_parameters": eng_params,
        "formula": "AD = -sum (2i-1)/n * {ln[F(x_i)] + ln[1-F(x_{n+1-i})]} - n",
        "cv_formula": "CV from Shin et al. (2012) Table 1 (Mean Function, MLE)",
        "interpretation": _build_interpretation("Gumbel", ad_stat, cv, p_value, passed, n),
    }


def _gumbel_monte_carlo_pvalue(
    ad_observed: float, n: int, mu: float, beta: float, n_sim: int = 5000
) -> float:
    """Monte Carlo p-value for Gumbel AD test."""
    rng = np.random.default_rng(42)
    count = 0
    for _ in range(n_sim):
        u = rng.uniform(0, 1, size=n)
        u = np.clip(u, 1e-10, 1 - 1e-10)
        synthetic = mu - beta * np.log(-np.log(u))
        synthetic = np.sort(synthetic)
        try:
            mu_s, beta_s, _ = fit_gumbel_mle(synthetic)
        except Exception:
            continue
        F_s = gumbel_cdf(synthetic, mu_s, beta_s)
        F_s = np.clip(F_s, 1e-10, 1 - 1e-10)
        ad_s = _ad_statistic_generic(synthetic, F_s)
        if ad_s >= ad_observed:
            count += 1
    # Floor to 0.0001 so UI never displays exact '0.0000'
    return max(count / n_sim, 0.0001)


def run_multi_distribution_ad_test(
    data: list,
    significance_level: float = 0.05,
    total_population: int = None,
    nominal_thickness: float = None,
    report_name: str = None,
) -> Dict[str, Any]:
    """
    Run Anderson-Darling GOF tests against all 5 candidate distributions.

    Args:
        data:              Raw measurement values (remaining wall thickness or wall loss, mm).
        significance_level: α for pass/fail decision (default 0.05).
        total_population:  N — total tubes in the heat exchanger (for EVA extrapolation).
        nominal_thickness: Nominal wall thickness (mm) for engineering context.
        report_name:       Equipment report ID (e.g. '1E-3012').
    """
    arr = np.array(data, dtype=float)
    arr = arr[~np.isnan(arr)]

    if len(arr) < 5:
        raise ValueError(f"Need at least 5 data points, got {len(arr)}")

    # Detect and remove gross outliers (values > 10x the median — data entry errors)
    median_val = float(np.median(arr))
    if median_val > 0:
        outlier_threshold = median_val * 10.0
        n_before = len(arr)
        arr = arr[arr <= outlier_threshold]
        n_removed = n_before - len(arr)
        if n_removed > 0 and len(arr) >= 5:
            import warnings
            warnings.warn(
                f"Removed {n_removed} gross outlier(s) (>{outlier_threshold:.2f}mm, "
                f"10x median={median_val:.4f}mm) before AD testing."
            )

    if len(arr) < 5:
        raise ValueError(f"After outlier removal, need at least 5 data points, got {len(arr)}")

    # Check for measurement discretization / ties
    u_vals = np.unique(arr)
    n_unique = int(len(u_vals))
    is_discretized = n_unique < 15 and len(arr) >= 20
    disc_note = None
    if is_discretized:
        disc_note = (
            f"Inspection measurements exhibit discrete step resolution ({n_unique} unique values across {len(arr)} readings). "
            f"Heavy measurement ties cause continuous AD statistics to be elevated. "
            f"Distributions are ranked by lowest relative AD statistic (best fit)."
        )

    results = []
    results.append(ad_test_normal(arr, significance_level, nominal_thickness))
    results.append(ad_test_lognormal(arr, significance_level, nominal_thickness))
    results.append(ad_test_weibull(arr, significance_level, nominal_thickness))
    results.append(ad_test_exponential(arr, significance_level, nominal_thickness))
    results.append(ad_test_gumbel(arr, significance_level, nominal_thickness))

    passed_results = [r for r in results if r["passed"]]
    failed_results = [r for r in results if not r["passed"]]

    passed_results.sort(key=lambda r: (r["ad_statistic"], -(r.get("p_value") or 0)))
    failed_results.sort(key=lambda r: (r["ad_statistic"], -(r.get("p_value") or 0)))

    ranked = passed_results + failed_results
    for idx, r in enumerate(ranked):
        r["rank"] = idx + 1

    recommended = ranked[0]["distribution"] if ranked else "Gumbel"

    return {
        "results": ranked,
        "recommended": recommended,
        "n_observations": int(len(arr)),
        "n_total": total_population,
        "nominal_thickness": nominal_thickness,
        "report_name": report_name,
        "significance_level": significance_level,
        "is_discretized": is_discretized,
        "n_unique": n_unique,
        "discretization_note": disc_note,
    }


def _build_interpretation(
    dist_name: str, ad_stat: float, cv: float,
    p_value: float | None, passed: bool, n: int
) -> str:
    """Generate human-readable interpretation for an AD test result."""
    parts = []
    parts.append(f"H0: Data follows the {dist_name} distribution.")
    
    if passed:
        parts.append(
            f"Decision: Fail to reject H0 (p-value >= 0.05, AD={ad_stat:.4f} < CV={cv:.4f}). "
            f"There is no reason to reject the {dist_name} distribution."
        )
    else:
        parts.append(
            f"Decision: Reject H0 (p-value < 0.05, AD={ad_stat:.4f} >= CV={cv:.4f}). "
            f"The fit is rejected; {dist_name} distribution does not adequately model this data."
        )
        
    if p_value is not None:
        if p_value >= 0.15:
            parts.append(f"(p-value={p_value:.4f}: strong evidence supporting the fit).")
        elif p_value >= 0.05:
            parts.append(f"(p-value={p_value:.4f}: acceptable fit).")
        else:
            parts.append(f"(p-value={p_value:.4f}: statistically significant deviation).")
            
    if n < 10:
        parts.append(f"Note: Sample size n={n} is very small; AD test power is limited.")
    return " ".join(parts)


def _empty_result(dist_name: str, reason: str) -> Dict[str, Any]:
    """Return a default failed result for distributions that couldn't be tested."""
    return {
        "distribution": dist_name,
        "ad_statistic": float("inf"),
        "ad_modified": None,
        "critical_value": 0.0,
        "p_value": 0.0,
        "passed": False,
        "h0": f"H0: Data follows a {dist_name} distribution",
        "decision": "Skipped (Insufficient data)",
        "parameters": {},
        "formula": "N/A",
        "cv_formula": "N/A",
        "interpretation": f"{dist_name} test skipped: {reason}",
    }
