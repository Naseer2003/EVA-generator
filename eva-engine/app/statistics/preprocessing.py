"""
preprocessing.py
----------------
Data cleaning, validation, sorting, and maxima extraction.
"""
import numpy as np
from typing import List

MIN_SAMPLE_SIZE = 5


def preprocess(data: List[float]) -> np.ndarray:
    """
    Full preprocessing pipeline:
      1. Convert to numpy array
      2. Remove NaN / Inf
      3. Validate sample size
      4. Sort descending
      5. Return clean array
    """
    arr = np.array(data, dtype=np.float64)

    # Remove NaN and Inf
    arr = arr[np.isfinite(arr)]

    if len(arr) < MIN_SAMPLE_SIZE:
        raise ValueError(
            f"Insufficient data: need at least {MIN_SAMPLE_SIZE} valid observations, got {len(arr)}."
        )

    # Sort descending (largest first for EVA)
    arr = np.sort(arr)[::-1]

    return arr


def extract_maxima(arr: np.ndarray) -> np.ndarray:
    """
    For annual maxima method: currently returns the full array.
    Future: support block maxima / POT extraction.
    """
    return arr


def plotting_positions(n: int) -> np.ndarray:
    """
    Weibull plotting positions: P_i = i / (n + 1)
    Returns array of non-exceedance probabilities.
    """
    ranks = np.arange(1, n + 1)
    return ranks / (n + 1)


def reduced_variates(probs: np.ndarray) -> np.ndarray:
    """
    Gumbel reduced variate: y_i = -ln(-ln(P_i))
    """
    return -np.log(-np.log(probs))
