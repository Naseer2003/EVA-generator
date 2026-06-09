# Extreme Value Analysis (EVA) Implementation Review & Alignment Report

## 1. Executive Summary
This report identifies discrepancies between the current `eva-engine` implementation and the methodologies defined in **"Extreme Value Analysis - Part 1: Fundamentals"** and the **ASME PVP2006-ICPVT11-93702** paper. 

The primary "wrong" approach identified is the reliance on distribution fitting (testing multiple distributions like GEV/Weibull) and bootstrap-based confidence intervals. The documents mandate a specific, analytical approach using the **Gumbel distribution** and **Student's t-test confidence intervals** for mechanical integrity applications.

## 2. Identified Discrepancies

| Feature | Current Implementation (Incorrect) | Document Requirement (Correct) |
| :--- | :--- | :--- |
| **Distribution Selection** | Attempts to find the "best fit" among Gumbel, GEV, and Weibull using AD/KS tests. | **Mandatory Gumbel Distribution.** Fundamentals (p. 3) states Gumbel yields the best results for mechanical integrity. |
| **Confidence Intervals** | Uses Bootstrap resampling (Percentile-based). | **Student's t-test Analytical CI.** Equations 15-17 in PVP2006 provide specific formulas. |
| **Uncertainty Quantification** | Standard error is implicit in bootstrap. | **Explicit Standard Error $S(x)$.** Calculation based on reduced variate $y$ and sample size $n$ (Eq. 15). |
| **Conservative Estimation** | Provides upper and lower bounds. | **Mandatory Lower Bound.** For wall thickness, the lower-bound value must be used to assure integrity. |
| **Fit Testing** | Performs Anderson-Darling and KS tests to validate fit. | **Not Required.** The Gumbel distribution is assumed as the standard for corrosion extremes. |

## 3. Correct Methodology (PVP2006 Alignment)

To align with the documents, the following mathematical framework must be implemented:

### 3.1. Parameter Estimation
Use **Maximum Likelihood Method (MLM)** to determine the location parameter ($\lambda$) and scale parameter ($\delta$). 
*Note: The code uses $\mu$ and $\beta$, which are equivalent but should be mapped clearly to $\lambda$ and $\delta$.*

### 3.2. Return Level Calculation
The estimated extreme value $x_N$ for a population of size $N$ is:
$$x_N = \lambda + \delta \cdot [-\ln(-\ln(1 - 1/N))]$$

### 3.3. Standard Error ($S(x)$)
The standard error for the estimate is calculated analytically using Eq. 15:
$$S(x) = \delta \cdot \sqrt{\frac{1.109 + 0.514y + 0.608y^2}{n}}$$
Where $y = -\ln(-\ln(1 - 1/N))$ and $n$ is the sample size.

### 3.4. Confidence Interval Lower Bound
The conservative estimate for remaining thickness is:
$$C(x)_{lower} = x_N - t \cdot S(x)$$
Where $t$ is the Student’s t-test value, calculated based on sample size $n$ and confidence level (80%, 90%, 95%, 99%).

## 4. Proposed Technical Changes

### 4.1. Statistics Engine (`distributions.py` & `return_levels.py`)
- Implement the analytical **Standard Error** formula (Eq. 15).
- Implement the **Student's t-value** calculation logic (Eq. 17).
- Standardize on Gumbel distribution; remove GEV/Weibull logic.

### 4.2. Service Layer (`eva_service.py`)
- Remove the Bootstrap loop (`bootstrap_confidence_intervals`).
- Remove Goodness-of-Fit tests (`anderson_darling_gumbel`, `ks_test_gumbel`).
- Update the response object to prioritize the **Lower Bound** confidence level.

### 4.3. Preprocessing
- Ensure the input data is correctly identified as **Minimum Thickness** per unit (tube/section) to match the "Unit Minimum Method".

## 5. Conclusion
By switching from a "fitting" approach to the "analytical" approach defined in PVP2006, the tool will provide the statistically rigorous and conservative estimates required for industrial mechanical integrity assessments. This eliminates unnecessary computational overhead (bootstrap) and aligns with industry best practices for heat exchanger and piping inspections.
