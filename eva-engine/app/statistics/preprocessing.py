"""
preprocessing.py
----------------
Data cleaning, validation, sorting, and maxima extraction.

PVP2006 / ASTM E2283 methodology:
  - Input data is the measured MAXIMUM WALL LOSS per inspected unit
    (one value per tube/section — the "Unit Minimum Method").
  - Data is ranked in ASCENDING order: x1 <= x2 <= ... <= xn
    (Eq. 1 in PVP2006: xi is the ith data point in ascending order).
  - Plotting positions: Pi = i / (n + 1)  (Weibull — Eq. 1 PVP2006)
"""
import numpy as np
from typing import List

MIN_SAMPLE_SIZE = 5


def preprocess(data: List[float]) -> np.ndarray:
    """
    Full preprocessing pipeline:
      1. Convert to numpy array
      2. Remove NaN / Inf
      3. Validate minimum sample size
      4. Sort ASCENDING (required by PVP2006 Eq. 1 — x1 <= x2 <= ... <= xn)
      5. Return clean array
    """
    arr = np.array(data, dtype=np.float64)

    # Remove NaN and Inf
    arr = arr[np.isfinite(arr)]

    if len(arr) < MIN_SAMPLE_SIZE:
        raise ValueError(
            f"Insufficient data: need at least {MIN_SAMPLE_SIZE} valid observations, got {len(arr)}."
        )

    # Sort ASCENDING — PVP2006 Eq.1: x1 <= x2 <= x3 <= ... <= xn
    arr = np.sort(arr)

    return arr


def plotting_positions(n: int) -> np.ndarray:
    """
    Weibull plotting positions per PVP2006 Eq. 1:
      Pi = i / (n + 1)

    Returns array of cumulative probabilities for ranks 1..n.
    """
    ranks = np.arange(1, n + 1)
    return ranks / (n + 1)


def reduced_variates(probs: np.ndarray) -> np.ndarray:
    """
    Gumbel reduced variate from PVP2006 Eq. 7:
      yi = -ln(-ln(Pi))

    Used for the probability plot x-axis.
    """
    return -np.log(-np.log(np.clip(probs, 1e-10, 1 - 1e-10)))
