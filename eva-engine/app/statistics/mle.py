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


def fit_gumbel_mle_batch(
    X: np.ndarray, max_iter: int = 60, tol: float = 1e-10
) -> tuple:
    """
    Fit Gumbel(lambda, delta) to every ROW of X at once.

    Calling scipy's minimize once per sample is the single most expensive thing
    the engine does: a Monte Carlo p-value needs one fit per trial, and 10,000
    L-BFGS-B calls take ~30 s. The score equations collapse to a one-dimensional
    fixed point in delta, which vectorises across all rows:

        delta = xbar - sum(x * exp(-x/delta)) / sum(exp(-x/delta))
        lambda = -delta * log(mean(exp(-x/delta)))

    Exponents are centred per row before exponentiating. The ratio above is
    invariant to a shift in the exponent, so this changes nothing numerically
    but stops exp() overflowing when delta is small.

    Agreement with the scalar L-BFGS-B path is ~1e-8 on both parameters.

    Args:
        X: 2-D array, one sample per row.

    Returns:
        (mu, beta) as 1-D arrays, one entry per row.
    """
    X = np.asarray(X, dtype=np.float64)
    xbar = X.mean(axis=1)
    sd = X.std(axis=1, ddof=1)

    # Method of Moments warm start, same as the scalar path.
    beta = np.maximum(sd * np.sqrt(6.0) / np.pi, 1e-12)
    centre = xbar[:, None]

    for _ in range(max_iter):
        U = -(X - centre) / beta[:, None]
        U -= U.max(axis=1, keepdims=True)
        W = np.exp(U)
        updated = xbar - (X * W).sum(axis=1) / W.sum(axis=1)
        updated = np.maximum(updated, 1e-12)
        converged = np.max(np.abs(updated - beta)) < tol
        beta = updated
        if converged:
            break

    U = -(X - centre) / beta[:, None]
    shift = U.max(axis=1, keepdims=True)
    log_mean_exp = shift[:, 0] + np.log(np.exp(U - shift).mean(axis=1))
    mu = xbar - beta * log_mean_exp
    return mu, beta
