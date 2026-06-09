"""
distributions.py
----------------
Gumbel distribution PDF, CDF, and parameter estimation.

PVP2006 / ASTM E2283 methodology — Gumbel only.
Parameters: lambda (location) = mu, delta (scale) = beta.

Standard Error formula (Eq. 15):
  SE(x) = delta * sqrt((1.109 + 0.514*y + 0.608*y^2) / n)

Student's t-value (Table 1 in PVP2006, two-tailed):
  Computed analytically via scipy.stats.t with (n-1) degrees of freedom.
"""
import numpy as np
from scipy import stats
from typing import Tuple

EPSILON = 1e-10


# ─── Method of Moments (MoM) — used only as MLE warm-start ───────────────────

def gumbel_mom(data: np.ndarray) -> Tuple[float, float]:
    """
    MoM estimates for Gumbel(lambda, delta) per PVP2006 Eq. 11-12:
      delta_mom = sigma * sqrt(6) / pi
      lambda_mom = x_bar - 0.5772 * delta_mom

    Used only as the initial guess for MLE optimization.
    """
    x_mean = np.mean(data)
    x_std  = np.std(data, ddof=1)
    delta  = x_std * np.sqrt(6) / np.pi
    lam    = x_mean - 0.5772156649 * delta
    return float(lam), float(delta)


# ─── Gumbel Negative Log-Likelihood ──────────────────────────────────────────

def gumbel_nll(params: np.ndarray, data: np.ndarray) -> float:
    """
    Negative log-likelihood of Gumbel distribution for MLE.
    Numerically stabilised with np.clip to avoid overflow.
    """
    mu, beta = params
    if beta <= EPSILON:
        return 1e10

    z = (data - mu) / beta
    z = np.clip(z, -500, 500)  # prevent exp overflow

    nll = len(data) * np.log(beta) + np.sum(z + np.exp(-z))
    return float(nll)


# ─── Gumbel PDF / CDF ─────────────────────────────────────────────────────────

def gumbel_cdf(x: np.ndarray, mu: float, beta: float) -> np.ndarray:
    """F(x) = exp(-exp(-(x-lambda)/delta))  — PVP2006 Eq. 3"""
    z = (x - mu) / np.clip(beta, EPSILON, None)
    return np.exp(-np.exp(-z))


def gumbel_pdf(x: np.ndarray, mu: float, beta: float) -> np.ndarray:
    """f(x) = (1/delta) * exp(-z - exp(-z))  — PVP2006 Eq. 2"""
    beta = np.clip(beta, EPSILON, None)
    z = (x - mu) / beta
    return (1.0 / beta) * np.exp(-z - np.exp(-z))


# ─── PVP2006 Analytical Standard Error & t-value ─────────────────────────────

def calculate_gumbel_se(delta: float, n: int, y: float) -> float:
    """
    Analytical Standard Error for Gumbel MLE — PVP2006 Eq. 15:

      SE(x) = delta * sqrt((1.109 + 0.514*y + 0.608*y^2) / n)

    where y is the Gumbel reduced variate at the point of interest.

    Args:
        delta: Gumbel scale parameter (beta)
        n:     Sample size
        y:     Reduced variate y = -ln(-ln(1 - 1/N))

    Returns:
        Standard error SE(x)
    """
    if n <= 0:
        return 0.0
    term = (1.109 + 0.514 * y + 0.608 * (y ** 2)) / n
    return float(delta * np.sqrt(max(term, 0.0)))


def calculate_t_value(n: int, confidence_level: float) -> float:
    """
    Student's t-test value matching Table 1 in PVP2006.

    PVP2006 Table 1 uses TWO-TAILED t-values (verified by comparing
    n=2, 80% = 3.078 in the table, which is the two-tailed value).

    Formula: t = ppf(1 - alpha/2, df=n-1)  where alpha = 1 - confidence_level

    Examples from Table 1:
      n=2,  80% → 3.078   n=5,  95% → 2.776   n=24, 95% → 2.069
      n=10, 99% → 3.250   n=30, 90% → 1.699

    Args:
        n:                Sample size
        confidence_level: e.g. 0.95 for 95% CI

    Returns:
        t value (positive scalar, two-tailed)
    """
    if n <= 1:
        return 0.0
    # Two-tailed t-value at confidence_level with (n-1) degrees of freedom
    # alpha = 1 - confidence_level, two-tailed → ppf(1 - alpha/2)
    alpha = 1.0 - confidence_level
    return float(stats.t.ppf(1.0 - alpha / 2.0, n - 1))
