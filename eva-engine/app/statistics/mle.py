"""
mle.py
------
Maximum Likelihood Estimation (MLE) for Gumbel distribution.

Per PVP2006, MLE maximizes:
  sum_i [ -ln(delta) - z_i - exp(-z_i) ]  where z_i = (x_i - lambda) / delta

We minimize the negative log-likelihood using L-BFGS-B.
MoM estimates provide warm-start initial values (Eq. 11-12).
"""
import numpy as np
from scipy.optimize import minimize
from typing import Tuple
from app.statistics.distributions import gumbel_nll, gumbel_mom

BOUNDS = [(None, None), (1e-6, None)]   # lambda unbounded, delta > 0


def fit_gumbel_mle(data: np.ndarray) -> Tuple[float, float, float]:
    """
    Fit Gumbel(lambda, delta) via MLE using L-BFGS-B.

    Returns:
        (lambda, delta, nll_value)
        lambda = location parameter (mu in code)
        delta  = scale parameter (beta in code)
        nll    = negative log-likelihood at optimum

    MoM estimates are used as initial values to ensure convergence.
    """
    # Warm-start from Method of Moments (PVP2006 Eq. 11-12)
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
        # Fallback to Nelder-Mead if L-BFGS-B fails
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
