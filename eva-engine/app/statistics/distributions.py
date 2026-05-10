"""
distributions.py
----------------
Gumbel and GEV distribution PDF, CDF, and parameter estimation.
"""
import numpy as np
from scipy import stats
from typing import Tuple

EPSILON = 1e-10


# ─── Method of Moments (MoM) Initialization ────────────────────────────────────

def gumbel_mom(data: np.ndarray) -> Tuple[float, float]:
    """
    MoM estimates for Gumbel(μ, β):
      β = σ * sqrt(6) / π
      μ = x̄ - γ * β    where γ = Euler-Mascheroni ≈ 0.5772
    """
    x_mean = np.mean(data)
    x_std  = np.std(data, ddof=1)
    beta   = x_std * np.sqrt(6) / np.pi
    mu     = x_mean - 0.5772156649 * beta
    return float(mu), float(beta)


# ─── Gumbel Negative Log-Likelihood ────────────────────────────────────────────

def gumbel_nll(params: np.ndarray, data: np.ndarray) -> float:
    """
    Negative log-likelihood of Gumbel distribution.
    Numerically stabilised with np.clip to avoid overflow.
    """
    mu, beta = params
    if beta <= EPSILON:
        return 1e10

    z = (data - mu) / beta
    z = np.clip(z, -500, 500)       # prevent exp overflow

    nll = len(data) * np.log(beta) + np.sum(z + np.exp(-z))
    return float(nll)


# ─── Gumbel PDF / CDF ──────────────────────────────────────────────────────────

def gumbel_cdf(x: np.ndarray, mu: float, beta: float) -> np.ndarray:
    """F(x) = exp(-exp(-(x-μ)/β))"""
    z = (x - mu) / np.clip(beta, EPSILON, None)
    return np.exp(-np.exp(-z))


def gumbel_pdf(x: np.ndarray, mu: float, beta: float) -> np.ndarray:
    """f(x) = (1/β) * exp(-z - exp(-z))  where z = (x-μ)/β"""
    beta = np.clip(beta, EPSILON, None)
    z = (x - mu) / beta
    return (1.0 / beta) * np.exp(-z - np.exp(-z))


# ─── GEV (Generalised Extreme Value) via SciPy ─────────────────────────────────

def gev_fit(data: np.ndarray) -> Tuple[float, float, float]:
    """
    Fit GEV distribution using SciPy MLE.
    Returns (xi, mu, beta) — shape, location, scale.
    xi < 0 → Weibull type
    xi = 0 → Gumbel
    xi > 0 → Fréchet type
    """
    xi, mu, beta = stats.genextreme.fit(data)
    return float(xi), float(mu), float(beta)


def gev_cdf(x: np.ndarray, xi: float, mu: float, beta: float) -> np.ndarray:
    return stats.genextreme.cdf(x, xi, loc=mu, scale=beta)
