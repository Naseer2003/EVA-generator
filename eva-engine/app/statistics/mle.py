"""
mle.py
------
Maximum Likelihood Estimation with L-BFGS-B optimizer.
"""
import numpy as np
from scipy.optimize import minimize
from typing import Tuple
from app.statistics.distributions import gumbel_nll, gumbel_mom

BOUNDS = [(None, None), (1e-6, None)]   # mu unbounded, beta > 0


def fit_gumbel_mle(data: np.ndarray) -> Tuple[float, float, float]:
    """
    Fit Gumbel(μ, β) via MLE using L-BFGS-B.
    Returns (mu, beta, nll_value).
    
    MoM is used for initial parameter estimates to ensure optimizer convergence.
    """
    # Warm-start from Method of Moments
    mu0, beta0 = gumbel_mom(data)
    x0 = np.array([mu0, beta0])

    result = minimize(
        fun=gumbel_nll,
        x0=x0,
        args=(data,),
        method="L-BFGS-B",
        bounds=BOUNDS,
        options={"maxiter": 1000, "ftol": 1e-12, "gtol": 1e-8},
    )

    if not result.success:
        # Fallback: try Nelder-Mead
        result = minimize(
            fun=gumbel_nll,
            x0=x0,
            args=(data,),
            method="Nelder-Mead",
            options={"maxiter": 5000, "xatol": 1e-8, "fatol": 1e-8},
        )

    mu, beta = result.x
    beta = max(beta, 1e-6)   # enforce positivity
    return float(mu), float(beta), float(result.fun)


def fit_gumbel_mom(data: np.ndarray) -> Tuple[float, float]:
    """
    Quick MoM parameter estimation (no optimization).
    """
    from app.statistics.distributions import gumbel_mom
    return gumbel_mom(data)
