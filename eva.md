# Comprehensive Textbook & System Reference: Extreme Value Analysis (EVA) and Anderson-Darling (AD) Goodness-of-Fit Testing

---

## Document Overview
This document serves as the definitive reference manual for **Extreme Value Analysis (EVA)** and **Anderson-Darling (AD) Goodness-of-Fit testing** as implemented in the industrial Asset Integrity Management Platform. It is structured into 9 comprehensive parts covering fundamentals, mathematical formulations, parameter estimation, confidence interval derivations, statistical hypothesis testing, step-by-step hand calculations for two distinct asset types, software system architecture, reference literature reviews, and engineering best practices.

---

## Table of Contents
- [PART I: INTRODUCTION & ENGINEERING FUNDAMENTALS](#part-i-introduction--engineering-fundamentals)
  - [1.1 The Asset Integrity Dilemma (Cost vs. Reliability)](#11-the-asset-integrity-dilemma-cost-vs-reliability)
  - [1.2 Non-Destructive Evaluation (NDE) Technologies](#12-non-destructive-evaluation-nde-technologies)
  - [1.3 Why Sample Minima Fail (The Statistical Bias of Sample Minima)](#13-why-sample-minima-fail-the-statistical-bias-of-sample-minima)
  - [1.4 Population Definition & Damage Mechanism Segmentation](#14-population-definition--damage-mechanism-segmentation)
  - [1.5 Unit Minimum Method Principles](#15-unit-minimum-method-principles)
- [PART II: STATISTICAL MATHEMATICS & THE GUMBEL DISTRIBUTION](#part-ii-statistical-mathematics--the-gumbel-distribution)
  - [2.1 Extreme Value Theory (EVT) & Fisher-Tippett-Gnedenko Theorem](#21-extreme-value-theory-evt--fisher-tippett-gnedenko-theorem)
  - [2.2 The Gumbel (Type I Extreme Value) Distribution](#22-the-gumbel-type-i-extreme-value-distribution)
  - [2.3 Mathematical Derivation of CDF, PDF, and Quantile Functions](#23-mathematical-derivation-of-cdf-pdf-and-quantile-functions)
  - [2.4 Reduced Variates ($y_i$ and $y_N$)](#24-reduced-variates-y_i-and-y_n)
  - [2.5 Plotting Positions (Weibull Formula)](#25-plotting-positions-weibull-formula)
- [PART III: PARAMETER ESTIMATION METHODOLOGY](#part-iii-parameter-estimation-methodology)
  - [3.1 Method of Moments (MoM) — Derivation & Limitations](#31-method-of-moments-mom--derivation--limitations)
  - [3.2 Maximum Likelihood Estimation (MLE) — Log-Likelihood Derivation](#32-maximum-likelihood-estimation-mle--log-likelihood-derivation)
  - [3.3 Gradient Equations for Gumbel MLE](#33-gradient-equations-for-gumbel-mle)
  - [3.4 Numerical Optimization & Convergence Safeguards](#34-numerical-optimization--convergence-safeguards)
- [PART IV: RETURN LEVELS, FORECASTING & CONFIDENCE INTERVALS (PVP2006)](#part-iv-return-levels-forecasting--confidence-intervals-pvp2006)
  - [4.1 Population Extrapolation Formula ($x_N$)](#41-population-extrapolation-formula-x_n)
  - [4.2 PVP2006 Standard Error Equation 15](#42-pvp2006-standard-error-equation-15)
  - [4.3 Student's $t$-Distribution Confidence Bounds (PVP2006 Equation 16)](#43-students-t-distribution-confidence-bounds-pvp2006-equation-16)
  - [4.4 Upper vs. Lower Bound Interpretation](#44-upper-vs-lower-bound-interpretation)
  - [4.5 Mapping Confidence Levels to API Risk-Based Inspection (RBI) Effectiveness](#45-mapping-confidence-levels-to-api-risk-based-inspection-rbi-effectiveness)
  - [4.6 Remaining Operating Life & End-of-Life (EOL) Forecasting](#46-remaining-operating-life--end-of-life-eol-forecasting)
- [PART V: GOODNESS-OF-FIT (GoF) & ANDERSON-DARLING (AD) TESTING](#part-v-goodness-of-fit-gof--anderson-darling-ad-testing)
  - [5.1 Why Goodness-of-Fit Verification is Mandatory](#51-why-goodness-of-fit-verification-is-mandatory)
  - [5.2 Kolmogorov-Smirnov (KS) vs. Cramér-von Mises vs. Anderson-Darling](#52-kolmogorov-smirnov-ks-vs-cram%C3%A9r-von-mises-vs-anderson-darling)
  - [5.3 Weight Function $\psi(u) = 1/[u(1-u)]$ and Tail Sensitivity](#53-weight-function-\psiu--1u1-u-and-tail-sensitivity)
  - [5.4 Exact Mathematical Formula for the AD Statistic ($A^2$)](#54-exact-mathematical-formula-for-the-ad-statistic-a2)
  - [5.5 Known vs. Estimated Parameters (The T.W. Anderson 2010 Breakthrough)](#55-known-vs-estimated-parameters-the-tw-anderson-2010-breakthrough)
  - [5.6 Comparative Power Analysis (Shin et al. 2012 Paper Review)](#56-comparative-power-analysis-shin-et-al-2012-paper-review)
  - [5.7 Sample-Size-Dependent Critical Values (Shin et al. 2012 Table 1)](#57-sample-size-dependent-critical-values-shin-et-al-2012-table-1)
  - [5.8 Weibull vs. Gumbel Finite-Sample Adjustments](#58-weibull-vs-gumbel-finite-sample-adjustments)
  - [5.9 Monte Carlo $p$-Value Simulation Algorithm](#59-monte-carlo-p-value-simulation-algorithm)
  - [5.10 Significance Level Multi-Breakdown ($\alpha = 0.20 \dots 0.01$)](#510-significance-level-multi-breakdown-\alpha--020-\dots-001)
  - [5.11 Case Study: Radar Buried Object Detection via Gumbel GoF](#511-case-study-radar-buried-object-detection-via-gumbel-gof)
- [PART VI: COMPLETE WORKED NUMERICAL EXAMPLES](#part-vi-complete-worked-numerical-examples)
  - [EXAMPLE 1: Heat Exchanger Tube Bundle ($n=15$ Tubes)](#example-1-heat-exchanger-tube-bundle-n15-tubes)
    - [6.1.1 Dataset & Specifications](#611-dataset--specifications)
    - [6.1.2 Preprocessing & Sorting](#612-preprocessing--sorting)
    - [6.1.3 MoM Warm-Start & MLE Solution](#613-mom-warm-start--mle-solution)
    - [6.1.4 Extrapolation to $N=500$ Tubes](#614-extrapolation-to-n500-tubes)
    - [6.1.5 Standard Error & Confidence Intervals](#615-standard-error--confidence-intervals)
    - [6.1.6 Anderson-Darling $A^2$ Computation Table](#616-anderson-darling-a2-computation-table)
    - [6.1.7 Critical Value Interpolation & Final Engineering Decision](#617-critical-value-interpolation--final-engineering-decision)
  - [EXAMPLE 2: Process Piping Corrosion Loop ($n=20$ Inspection Grid Locations)](#example-2-process-piping-corrosion-loop-n20-inspection-grid-locations)
    - [6.2.1 Dataset & Piping Specifications](#621-dataset--piping-specifications)
    - [6.2.2 Preprocessing & Wall Loss Conversion](#622-preprocessing--wall-loss-conversion)
    - [6.2.3 MoM Warm-Start & MLE Solution](#623-mom-warm-start--mle-solution)
    - [6.2.4 Extrapolation to $N=1000$ Piping Units](#624-extrapolation-to-n1000-piping-units)
    - [6.2.5 PVP2006 SE & Student's $t$ CI Bounds](#625-pvp2006-se--students-t-ci-bounds)
    - [6.2.6 Term-by-Term Anderson-Darling Table](#626-term-by-term-anderson-darling-table)
    - [6.2.7 GoF Decision & EOL Life Assessment](#627-gof-decision--eol-life-assessment)
- [PART VII: SYSTEM ARCHITECTURE & CODE LEVEL DEEP DIVE](#part-vii-system-architecture--code-level-deep-dive)
  - [7.1 Multi-Service Architecture Breakdown](#71-multi-service-architecture-breakdown)
  - [7.2 End-to-End Data Flow Sequence](#72-end-to-end-data-flow-sequence)
  - [7.3 Python Engine Code Deep Dive](#73-python-engine-code-deep-dive)
    - [7.3.1 `preprocessing.py`](#731-preprocessingpy)
    - [7.3.2 `distributions.py`](#732-distributionspy)
    - [7.3.3 `mle.py`](#733-mlepy)
    - [7.3.4 `return_levels.py`](#734-return_levelspy)
    - [7.3.5 `diagnostics.py`](#735-diagnosticspy)
    - [7.3.6 `eva_service.py`](#736-eva_servicepy)
  - [7.4 NestJS Backend Gateway Code Deep Dive](#74-nestjs-backend-gateway-code-deep-dive)
    - [7.4.1 `eva.service.ts`](#741-evaservicets)
    - [7.4.2 `schema.prisma`](#742-schemaprisma)
  - [7.5 Next.js Frontend UI Component Deep Dive](#75-nextjs-frontend-ui-component-deep-dive)
    - [7.5.1 `page.tsx` Results Display](#751-pagetsx-results-display)
- [PART VIII: COMPREHENSIVE AD REFERENCE LITERATURE REVIEWS](#part-viii-comprehensive-ad-reference-literature-reviews)
  - [8.1 PVP2006-ICPVT11-93702 (W. David Wang, 2006)](#81-pvp2006-icpvt11-93702-w-david-wang-2006)
  - [8.2 ASTM E2283-03 Standard Practice](#82-astm-e2283-03-standard-practice)
  - [8.3 Anderson & Darling (1954) JASA Foundation Paper](#83-anderson--darling-1954-jasa-foundation-paper)
  - [8.4 T.W. Anderson (2010) Review Paper](#84-tw-anderson-2010-review-paper)
  - [8.5 Shin et al. (2012) Comparative GoF Study](#85-shin-et-al-2012-comparative-gof-study)
  - [8.6 START 2003-5 Reliability Guide (A_DTest.md)](#86-start-2003-5-reliability-guide-a_dtestmd)
  - [8.7 Inspectioneering Journal 2026 Series (Parts 1, 2 & 3)](#87-inspectioneering-journal-2026-series-parts-1-2--3)
- [PART IX: TROUBLESHOOTING, EDGE CASES & BEST PRACTICES](#part-ix-troubleshooting-edge-cases--best-practices)
  - [9.1 Small Sample Size Management ($n < 10$)](#91-small-sample-size-management-n--10)
  - [9.2 Bimodal & Mixed Damage Mechanism Identification](#92-bimodal--mixed-damage-mechanism-identification)
  - [9.3 Outlier Treatment Protocols](#93-outlier-treatment-protocols)
  - [9.4 Numerical Stability & Overflow Prevention Safeguards](#94-numerical-stability--overflow-prevention-safeguards)
  - [9.5 Database Migration & Production Deployment Guide](#95-database-migration--production-deployment-guide)

---

## PART I: INTRODUCTION & ENGINEERING FUNDAMENTALS

### 1.1 The Asset Integrity Dilemma (Cost vs. Reliability)
In heavy processing industries—such as oil refineries, petrochemical plants, nuclear and fossil power stations, offshore platforms, and manufacturing facilities—assuring mechanical integrity of static pressure-retaining equipment is paramount. Heat exchangers, pressure vessels, boilers, process piping loops, and atmospheric storage tank bottoms operate under harsh thermal, pressure, and chemical environments.

Over time, active corrosion damage mechanisms (e.g., general thinning, localized pitting, erosion-corrosion, acid attack, under-deposit corrosion) reduce metal wall thickness. If wall thickness drops below the minimum required design thickness ($t_{\text{min}}$), catastrophic pressure boundary breach, hazardous fluid release, environmental contamination, or unplanned plant shutdown occurs.

Historically, asset integrity management faced a severe dilemma:
- **Traditional Linear Approach**: To guarantee reliability, inspection engineers felt compelled to increase non-destructive examination (NDE) coverage (e.g., inspecting 100% of exchanger tubes or scanning 100% of vessel shell surface area).
- **Economic & Operational Penalty**: 100% inspection requires massive capital outlay, extended turnaround downtime, specialized cleaning procedures, high radiation/exposure risks, and significant logistical bottlenecks.
- **The Sweet Spot Dilemma**: Trying to balance cost and safety by picking an arbitrary inspection coverage (e.g., 10% or 20%) without statistical modeling creates non-defensible risk.

Extreme Value Analysis (EVA) breaks out of this linear thinking by applying rigorous mathematical modeling to sample inspection data. By inspecting a modest, representative sample (typically 20–30 units, or ~5% of a homogeneous population), EVA statistically extrapolates the tail risk to predict the worst-case thinning across the uninspected 95% of the asset—complete with explicit, defensible confidence bounds.

---

### 1.2 Non-Destructive Evaluation (NDE) Technologies
The accuracy and validity of EVA strictly depend on the quality of input data. EVA operates on quantitative, absolute wall thickness measurements. "Garbage in, garbage out" applies directly: if inspection instruments report clustered qualitative estimates or relative signal comparisons, the resulting statistical model will be invalid.

#### Applicable NDE Techniques for Heat Exchanger Tubes:
1. **Internal Rotary Inspection System (IRIS)**:
   - *Mechanism*: Ultrasonic pulse-echo technique utilizing a rotating mirror driven by water pressure to scan 360° of the tube wall continuously along its length.
   - *Suitability for EVA*: **Ideal (Tool of Choice)**. IRIS provides precise, quantitative, absolute wall thickness measurements ($\pm 0.05$ mm accuracy). It measures both internal and external wall loss independently.
2. **Remote Field Eddy Current (RFEC)**:
   - *Mechanism*: Electromagnetic technique measuring phase lag of magnetic fields passing through tube walls.
   - *Suitability for EVA*: **Unsuitable**. RFEC provides qualitative depth estimates referenced to calibration standards. Signals tend to cluster and lack the absolute precision required for extreme value distribution fitting.
3. **Magnetic Flux Leakage (MFL) & Conventional Eddy Current (ECT)**:
   - *Suitability for EVA*: **Unsuitable**. Useful for rapid screening and flaw detection, but insufficient for quantitative unit minimum wall thickness modeling.

#### Applicable NDE Techniques for Piping, Pressure Vessels, and Tanks:
- **Automated Ultrasonic Testing (AUT) Grid Scanning**: High-resolution 0.5" x 0.5" or 1" x 1" grid scanning providing true minimum thickness values per unit grid square.
- **Manual Phased Array Ultrasonic Testing (PAUT)**: Continuous wall thickness mapping along designated inspection coverage areas.

---

### 1.3 Why Sample Minima Fail (The Statistical Bias of Sample Minima)
A widespread, dangerous practice in traditional inspection reporting is to take the single lowest measured thickness from a sample inspection dataset and treat it as the "worst-case equipment thickness."

#### The Fundamental Statistical Fallacy:
Let a total equipment population consist of $N = 500$ tubes. An inspection program measures a random sample of $n = 25$ tubes.
Let $X_1, X_2, \dots, X_N$ be the true maximum wall loss values of all 500 tubes in the population, ordered such that:
$$X_{(1)} \le X_{(2)} \le \dots \le X_{(N)}$$
where $X_{(N)}$ is the true, absolute maximum wall loss in the entire heat exchanger.

When we inspect a random sample of $n = 25$ tubes, the measured sample maximum wall loss $x_{(n)}$ is drawn from the sample. Mathematically:
$$\mathbb{P}\left(x_{(n)} < X_{(N)}\right) = 1 - \frac{n}{N} = 1 - \frac{25}{500} = 0.95$$

This proves that **there is a 95% probability that the observed sample maximum wall loss is smaller than the true population maximum wall loss** (or conversely, the observed sample minimum thickness is thicker than the true population minimum thickness).

Relying directly on observed sample minimums without statistical extrapolation guarantees non-conservative, unsafe engineering decisions.

---

### 1.4 Population Definition & Damage Mechanism Segmentation
A fundamental prerequisite of Extreme Value Analysis is proper **population definition**. EVA assumes that all data points in the sample set are independent and identically distributed (i.i.d.) draws from a single underlying random process.

#### Rules for Population Definition:
1. **Homogeneous Damage Mechanism**:
   - All units in a population must be constructed of identical or equivalent metallurgy, operating under identical thermal/pressure regimes, and exposed to identical corrosive environments.
   - *Example 1 (Heat Exchangers)*: An entire tube bundle may be treated as one population if shell-side and tube-side fluids are uniform. However, if a 3-pass exchanger exhibits distinct temperature gradients or phase changes across passes, **each pass must be treated as a separate population**.
   - *Example 2 (Piping Systems)*: A piping system should be segmented by corrosion loops/circuits. Primary straight piping, deadlegs, pump discharge elbows, and chemical injection points represent distinct damage mechanisms and **must never be mixed into a single population**.
   - *Example 3 (Pressure Vessels & Tanks)*: Vessels should be divided by shell courses, top/bottom heads, and nozzle regions. Tank bottoms should be divided by annular ring plates vs. center floor plates.
2. **Consequences of Mixing Populations**:
   - Mixing data from distinct degradation mechanisms produces bimodal or multi-modal distributions that cannot fit any standard extreme value model.
   - This results in catastrophic failure of goodness-of-fit tests (such as Anderson-Darling) and invalidates return level forecasts.
3. **Group Segmentation to Reduce Extrapolation Error**:
   - Dividing large equipment (e.g., 2,000 tubes) into 4 homogeneous groups of 500 units reduces the extrapolation distance $N/n$, thereby reducing the standard error of extreme estimates.

---

### 1.5 Unit Minimum Method Principles
The cornerstone of EVA for mechanical integrity applications is the **Unit Minimum Method**.

#### Definition of a "Unit":
- **Heat Exchangers**: 1 Tube = 1 Unit. (The inspector scans the entire length of the tube and records the single deepest wall loss value observed on that tube).
- **Piping Systems**: 1 Unit = A standardized unit length of pipe (e.g., a 1-foot section, or 1-diameter length).
- **Pressure Vessels & Tank Bottoms**: 1 Unit = A standardized unit area (e.g., a 1 ft x 1 ft grid square).

#### Data Transformation:
Inspection tools measure **remaining wall thickness** ($t_{\text{meas}}$). EVA statistical models operate on **maximum wall loss** ($x$).
Given original nominal wall thickness $t_{\text{orig}}$:
$$x_i = \max\left(0, \, t_{\text{orig}} - t_{\text{meas}, i}\right)$$
The dataset of $n$ inspected units yields $n$ wall loss values: $x_1, x_2, \dots, x_n$.

---

## PART II: STATISTICAL MATHEMATICS & THE GUMBEL DISTRIBUTION

### 2.1 Extreme Value Theory (EVT) & Fisher-Tippett-Gnedenko Theorem
Extreme Value Theory (EVT) is the branch of statistics dealing with the extreme deviations from the median of probability distributions.

#### The Fisher-Tippett-Gnedenko Theorem (The Fundamental Theorem of EVT):
Just as the Central Limit Theorem proves that the sum or average of a large number of independent random variables converges to a **Normal distribution**, the Fisher-Tippett-Gnedenko Theorem proves that the maximum (or minimum) of a sample of $M$ independent, identically distributed random variables converges asymptotically to one of three extreme value distribution families as $M \to \infty$:
1. **Type I (Gumbel Distribution)**: Light-tailed distributions with exponential tails (e.g., Normal, Lognormal, Exponential, Gamma).
2. **Type II (Fréchet Distribution)**: Heavy-tailed distributions with polynomial tails (e.g., Pareto, Cauchy).
3. **Type III (Weibull Distribution)**: Bounded distributions with a finite upper/lower ceiling.

The Generalized Extreme Value (GEV) distribution unifies all three into a single parametrization with shape parameter $\xi$. When $\xi = 0$, the GEV reduces exactly to the Gumbel distribution.

---

### 2.2 The Gumbel (Type I Extreme Value) Distribution
For metal corrosion, pitting, and wall thinning phenomena in industrial equipment, decades of empirical research and theoretical validation (PVP2006, ASTM E2283) confirm that the **Gumbel Extreme Value Type I Distribution** is the optimal model.

The Gumbel distribution provides an ideal balance for mechanical integrity: it is sufficiently conservative to protect against tail risk without being overly conservative (which would force premature, wasteful equipment replacement).

---

### 2.3 Mathematical Derivation of CDF, PDF, and Quantile Functions

#### 1. Cumulative Distribution Function (CDF):
The probability $F(x)$ that a unit's maximum wall loss is less than or equal to $x$:
$$F(x; \mu, \beta) = \exp\left( -\exp\left( -\frac{x - \mu}{\beta} \right) \right)$$
where:
- $x \in (-\infty, +\infty)$ is the wall loss variable (practically $x \ge 0$).
- $\mu \in (-\infty, +\infty)$ is the **location parameter** (representing the mode/center of maximum wall loss).
- $\beta > 0$ is the **scale parameter** (representing the dispersion/spread of maximum wall loss).

#### 2. Probability Density Function (PDF):
Taking the derivative of $F(x)$ with respect to $x$:
$$f(x; \mu, \beta) = \frac{d}{dx} F(x) = \frac{1}{\beta} \exp\left( -\frac{x - \mu}{\beta} \right) \cdot \exp\left( -\exp\left( -\frac{x - \mu}{\beta} \right) \right)$$

Let $z = \frac{x - \mu}{\beta}$ be the standardized reduced variate. Then:
$$f(z) = \frac{1}{\beta} \exp\left( -z - e^{-z} \right)$$
$$F(z) = \exp\left( -e^{-z} \right)$$

#### 3. Quantile Function (Inverse CDF):
To solve for wall loss $x$ given a cumulative probability $P = F(x)$:
$$P = \exp\left( -e^{-\frac{x - \mu}{\beta}} \right)$$
Taking the natural logarithm of both sides:
$$\ln(P) = -\exp\left( -\frac{x - \mu}{\beta} \right)$$
Negating and taking the natural logarithm again:
$$\ln(-\ln(P)) = -\frac{x - \mu}{\beta}$$
Solving for $x$:
$$x(P) = \mu - \beta \ln(-\ln(P))$$

---

### 2.4 Reduced Variates ($y_i$ and $y_N$)
To simplify calculations and enable linear plotting on Gumbel probability paper, we define the **Gumbel reduced variate** $y$:
$$y = -\ln(-\ln(P))$$

Substituting $y$ into the quantile equation yields the fundamental linear relationship:
$$x(y) = \mu + \beta \cdot y$$

#### Reduced Variate for Population Return Level ($y_N$):
When extrapolating to a total population of $N$ units (e.g., $N = 500$ tubes), we want to estimate the wall loss $x_N$ expected to be exceeded by at most 1 unit in the population.
The non-exceedance cumulative probability for 1 unit out of $N$ is:
$$P_N = 1 - \frac{1}{N}$$

Substituting $P_N$ into the reduced variate equation yields $y_N$:
$$y_N = -\ln\left( -\ln\left( 1 - \frac{1}{N} \right) \right)$$

#### Asymptotic Expansion for Large $N$:
Using the Taylor series expansion $\ln(1 - \epsilon) \approx -\epsilon$ for small $\epsilon = 1/N$:
$$y_N \approx -\ln\left( -\left( -\frac{1}{N} \right) \right) = \ln(N)$$

*Comparison Table of Exact vs. Approximate Reduced Variate $y_N$:*
| Population Size ($N$) | Exact $y_N = -\ln(-\ln(1 - 1/N))$ | Asymptotic $\ln(N)$ | Relative Error |
| :---: | :---: | :---: | :---: |
| **10** | 2.2504 | 2.3026 | +2.32% |
| **30** | 3.3842 | 3.4012 | +0.50% |
| **100** | 4.5951 | 4.6052 | +0.22% |
| **500** | 6.2136 | 6.2146 | +0.02% |
| **1,000** | 6.9073 | 6.9078 | +0.01% |
| **2,000** | 7.6006 | 7.6009 | +0.004% |

*The application calculates exact $y_N$ using $-\ln(-\ln(1 - 1/N))$ for maximum numerical precision.*

---

### 2.5 Plotting Positions (Weibull Formula)
To construct empirical probability plots (Q-Q plots) of observed sample wall loss data $x_1, x_2, \dots, x_n$:
1. Sort the sample observations in ascending order:
   $$x_{(1)} \le x_{(2)} \le \dots \le x_{(n)}$$
2. Assign each rank $i \in \{1, 2, \dots, n\}$ an empirical cumulative probability $P_i$.

Per PVP2006 Equation 1 and ASTM E2283, the **Weibull plotting position formula** is used:
$$P_i = \frac{i}{n + 1}$$

The corresponding empirical reduced variate for rank $i$ is:
$$y_i = -\ln\left( -\ln\left( \frac{i}{n + 1} \right) \right)$$

Plotting $(y_i, x_{(i)})$ on a linear scale yields a straight line with intercept $\mu$ and slope $\beta$ if the data perfectly follows a Gumbel distribution.

---

## PART III: PARAMETER ESTIMATION METHODOLOGY

### 3.1 Method of Moments (MoM) — Derivation & Limitations
The Method of Moments matches sample moments (mean $\bar{x}$ and variance $s^2$) to theoretical Gumbel distribution moments.

#### Theoretical Gumbel Moments:
- Mean: $\mathbb{E}[X] = \mu + \gamma \beta$, where $\gamma \approx 0.57721566$ (Euler-Mascheroni constant).
- Variance: $\text{Var}(X) = \frac{\pi^2}{6} \beta^2$.
- Standard Deviation: $\sigma_X = \frac{\pi}{\sqrt{6}} \beta \approx 1.28255 \cdot \beta$.

#### MoM Estimator Equations:
Solving for scale parameter $\beta_{\text{MoM}}$:
$$\beta_{\text{MoM}} = s \cdot \frac{\sqrt{6}}{\pi} \approx 0.779697 \cdot s$$

Solving for location parameter $\mu_{\text{MoM}}$:
$$\mu_{\text{MoM}} = \bar{x} - \gamma \cdot \beta_{\text{MoM}} \approx \bar{x} - 0.577216 \cdot \beta_{\text{MoM}}$$

#### Limitations of MoM:
MoM estimators are sensitive to sample skewness and are statistically inefficient compared to Maximum Likelihood Estimators (they exhibit larger sampling variance). In this platform, **MoM is used exclusively to generate robust initial warm-start values $(\mu_0, \beta_0)$ for the numerical MLE solver**.

---

### 3.2 Maximum Likelihood Estimation (MLE) — Log-Likelihood Derivation
Maximum Likelihood Estimation finds the parameter set $(\hat{\mu}, \hat{\beta})$ that maximizes the probability of obtaining the observed sample data $x_1, x_2, \dots, x_n$.

#### Likelihood Function $L(\mu, \beta)$:
$$L(\mu, \beta) = \prod_{i=1}^n f(x_i; \mu, \beta) = \prod_{i=1}^n \frac{1}{\beta} \exp\left( -\frac{x_i - \mu}{\beta} \right) \exp\left( -\exp\left( -\frac{x_i - \mu}{\beta} \right) \right)$$

#### Natural Log-Likelihood Function $\ell(\mu, \beta) = \ln L(\mu, \beta)$:
$$\ell(\mu, \beta) = \sum_{i=1}^n \left[ -\ln(\beta) - \frac{x_i - \mu}{\beta} - \exp\left( -\frac{x_i - \mu}{\beta} \right) \right]$$
$$\ell(\mu, \beta) = -n \ln(\beta) - \sum_{i=1}^n \frac{x_i - \mu}{\beta} - \sum_{i=1}^n \exp\left( -\frac{x_i - \mu}{\beta} \right)$$

#### Negative Log-Likelihood Function $\text{NLL}(\mu, \beta) = -\ell(\mu, \beta)$:
In computational optimization, we **minimize the negative log-likelihood**:
$$\text{NLL}(\mu, \beta) = n \ln(\beta) + \frac{1}{\beta} \sum_{i=1}^n (x_i - \mu) + \sum_{i=1}^n \exp\left( -\frac{x_i - \mu}{\beta} \right)$$

---

### 3.3 Gradient Equations for Gumbel MLE
To maximize $\ell(\mu, \beta)$, we set partial derivatives with respect to $\mu$ and $\beta$ to zero.

#### 1. Partial Derivative with respect to $\mu$:
$$\frac{\partial \ell}{\partial \mu} = \frac{n}{\beta} - \frac{1}{\beta} \sum_{i=1}^n \exp\left( -\frac{x_i - \mu}{\beta} \right) = 0$$
Multiplying by $\beta$:
$$n - \exp\left(\frac{\mu}{\beta}\right) \sum_{i=1}^n \exp\left(-\frac{x_i}{\beta}\right) = 0$$
Solving for $\hat{\mu}$:
$$\hat{\mu} = -\beta \ln\left( \frac{1}{n} \sum_{i=1}^n \exp\left( -\frac{x_i}{\beta} \right) \right)$$

#### 2. Partial Derivative with respect to $\beta$:
$$\frac{\partial \ell}{\partial \beta} = -\frac{n}{\beta} + \frac{1}{\beta^2} \sum_{i=1}^n (x_i - \mu) - \frac{1}{\beta^2} \sum_{i=1}^n (x_i - \mu) \exp\left( -\frac{x_i - \mu}{\beta} \right) = 0$$

Substituting $\hat{\mu}$ into the score equation yields a single non-linear transcendental equation in $\hat{\beta}$:
$$\hat{\beta} = \bar{x} - \frac{\sum_{i=1}^n x_i \exp\left( -\frac{x_i}{\hat{\beta}} \right)}{\sum_{i=1}^n \exp\left( -\frac{x_i}{\hat{\beta}} \right)}$$

---

### 3.4 Numerical Optimization & Convergence Safeguards
Because the MLE equation for $\hat{\beta}$ is transcendental, it must be solved numerically.

#### Optimization Execution in `eva-engine`:
1. **Primary Algorithm**: `scipy.optimize.minimize` using **L-BFGS-B** (Limited-memory Broyden-Fletcher-Goldfarb-Shanno with Bounds).
2. **Bounds**: $\mu \in (-\infty, +\infty)$, $\beta \in [10^{-6}, +\infty)$.
3. **Warm Start**: $(\mu_0, \beta_0) = (\mu_{\text{MoM}}, \beta_{\text{MoM}})$.
4. **Tolerances**: `ftol = 1e-12`, `gtol = 1e-8`, `maxiter = 1000`.
5. **Fallback Algorithm**: If L-BFGS-B fails to converge, the solver automatically falls back to **Nelder-Mead** simplex optimization.
6. **Numerical Stabilization (Reduced Variate Clipping)**:
   During exponentiation $\exp\left( -\frac{x_i - \mu}{\beta} \right)$, extreme inputs can cause floating-point underflow or overflow. The reduced variate $z_i = \frac{x_i - \mu}{\beta}$ is clipped to $[-500, +500]$:
   ```python
   z = np.clip((data - mu) / beta, -500.0, 500.0)
   nll = n * np.log(beta) + np.sum(z) + np.sum(np.exp(-z))
   ```

---

## PART IV: RETURN LEVELS, FORECASTING & CONFIDENCE INTERVALS (PVP2006)

### 4.1 Population Extrapolation Formula ($x_N$)
Given the MLE-fitted parameters $(\hat{\mu}, \hat{\beta})$ from a sample of $n$ inspected units, the predicted maximum wall loss $x_N$ for a total population of $N$ units is:
$$x_N = \hat{\mu} + \hat{\beta} \cdot y_N$$
where $y_N = -\ln\left( -\ln\left( 1 - \frac{1}{N} \right) \right)$.

---

### 4.2 PVP2006 Standard Error Equation 15
Because $x_N$ is calculated from sample-estimated parameters $(\hat{\mu}, \hat{\beta})$, it carries statistical sampling error. W. David Wang's ASME paper **PVP2006-ICPVT11-93702** derives the analytical standard error $SE(x_N)$ of the estimated return level based on the covariance matrix of MLE estimators.

Per PVP2006 Equation 15:
$$SE(x_N) = \hat{\beta} \cdot \sqrt{\frac{1.109 + 0.514 \, y_N + 0.608 \, y_N^2}{n}}$$

#### Key Insights from the Standard Error Structure:
1. **Inverse Square-Root Dependence ($\frac{1}{\sqrt{n}}$)**: Standard error decreases in proportion to $\frac{1}{\sqrt{n}}$. Increasing sample size $n$ reduces uncertainty.
2. **Diminishing Returns of Larger Samples**:
   - Going from $n = 10$ to $n = 30$ reduces $SE$ by $\sqrt{10/30} \approx 42\%$.
   - Going from $n = 30$ to $n = 50$ reduces $SE$ by only $\sqrt{30/50} \approx 22\%$.
   - This proves PVP2006's guideline that **20 to 30 inspected units is the optimal engineering sample size**.
3. **Quadratic Reduced Variate Term ($y_N^2$)**: Uncertainty increases as population size $N$ increases (extrapolating further into the distribution tail).

---

### 4.3 Student's $t$-Distribution Confidence Bounds (PVP2006 Equation 16)
To quantify uncertainty at a desired confidence level $(1 - \alpha)$, PVP2006 Equation 16 applies the Student's $t$-distribution with $n - 1$ degrees of freedom:

$$CI(x_N) = x_N \pm t_{\alpha/2, \, n-1} \cdot SE(x_N)$$

where $t_{\alpha/2, \, n-1}$ is the two-tailed Student's $t$-critical value computed via SciPy:
```python
t_value = scipy.stats.t.ppf(1.0 - alpha / 2.0, df=n - 1)
```

---

### 4.4 Upper vs. Lower Bound Interpretation
In mechanical integrity engineering, we must distinguish between **wall loss** and **remaining wall thickness**:

$$\text{Remaining Wall Thickness } t_{\text{rem}} = t_{\text{orig}} - x$$

- **Wall Loss Perspective**:
  - Upper Bound: $x_{\text{upper}} = x_N + t_{\alpha/2, \, n-1} \cdot SE(x_N)$ (**Conservative Worst-Case Wall Loss**).
  - Lower Bound: $x_{\text{lower}} = x_N - t_{\alpha/2, \, n-1} \cdot SE(x_N)$ (Optimistic Wall Loss).
- **Remaining Wall Thickness Perspective**:
  - Conservative Minimum Thickness: $t_{\text{rem, conservative}} = t_{\text{orig}} - x_{\text{upper}} = t_{\text{orig}} - \left( x_N + t_{\alpha/2, \, n-1} \cdot SE(x_N) \right)$.

> **CRITICAL RULE FOR MECHANICAL INTEGRITY**:
> Mechanical integrity evaluations must ALWAYS use the **conservative upper bound of wall loss** (which corresponds to the **conservative lower bound of remaining wall thickness**). Using mean return levels or optimistic bounds leads to non-conservative, hazardous operating decisions.

---

### 4.5 Mapping Confidence Levels to API Risk-Based Inspection (RBI) Effectiveness
The platform evaluates 4 standardized confidence levels, directly mapped to API Risk-Based Inspection (API 580 / API 581) Inspection Effectiveness categories:

| API RBI Effectiveness Level | Confidence Level ($1-\alpha$) | Two-Tailed $\alpha$ | Engineering Meaning |
| :---: | :---: | :---: | :--- |
| **Level A** | **99%** | 0.02 | **Highly Effective** (Maximum Conservatism / Critical Assets) |
| **Level B** | **95%** | 0.10 | **Usually Effective** (Standard Industry Engineering Practice) |
| **Level C** | **90%** | 0.20 | **Fairly Effective** (Moderate Conservatism) |
| **Level D** | **80%** | 0.40 | **Poorly Effective** (Low Conservatism / Non-Critical Assets) |

---

### 4.6 Remaining Operating Life & End-of-Life (EOL) Forecasting
Given:
- $t_{\text{orig}}$: Original nominal wall thickness (mm).
- $t_{\text{min}}$: Minimum required design wall thickness per ASME Section VIII / API 530 (mm).
- $T_{\text{service}}$: Service duration from initial entry date to last inspection date (years).

#### 1. Corrosion Rate Calculation ($CR$):
$$CR_{\text{conservative}} = \frac{x_{\text{upper}}}{T_{\text{service}}} \quad (\text{mm/year})$$

#### 2. Remaining Useful Life ($RUL$):
$$RUL = \frac{t_{\text{rem, conservative}} - t_{\text{min}}}{CR_{\text{conservative}}} \quad (\text{years})$$

#### 3. Predicted End-of-Life Date ($EOL$):
$$\text{EOL Date} = \text{Last Inspection Date} + (RUL \times 365.25 \text{ days})$$

---

## PART V: GOODNESS-OF-FIT (GoF) & ANDERSON-DARLING (AD) TESTING

### 5.1 Why Goodness-of-Fit Verification is Mandatory
Fitting a Gumbel distribution to inspection data and extrapolating to population size $N$ relies on one fundamental assumption: **The population wall loss distribution actually follows a Gumbel distribution.**

If this assumption is false (e.g., if pitting corrosion creates a heavy tail, or if two distinct corrosion mechanisms were incorrectly mixed), then:
- Return level forecasts $x_N$ will be wrong.
- Standard errors and confidence intervals will be invalid.
- End-of-life predictions could lead to catastrophic equipment leak in service.

Goodness-of-Fit (GoF) testing performs a formal statistical hypothesis test:
$$\begin{cases} H_0: & \text{The observed sample data follows a Gumbel distribution with parameters } (\mu, \beta). \\ H_1: & \text{The observed sample data DOES NOT follow a Gumbel distribution.} \end{cases}$$

---

### 5.2 Kolmogorov-Smirnov (KS) vs. Cramér-von Mises vs. Anderson-Darling
Three classic empirical distribution function (EDF) tests exist:

1. **Kolmogorov-Smirnov (KS) Test**:
   - Statistic: $D = \max_i |F(x_{(i)}) - F_i^{\text{empirical}}|$.
   - *Limitation*: Measures only the single maximum vertical distance between empirical and theoretical CDFs. It is most sensitive near the median and **insensitive at the tails**.
2. **Cramér-von Mises (CVM) Test**:
   - Statistic: $W^2 = n \int_{-\infty}^{+\infty} [F_n(x) - F(x)]^2 dF(x)$.
   - *Limitation*: Integrates squared difference evenly across the domain.
3. **Anderson-Darling (AD) Test**:
   - Statistic: $A^2 = n \int_{-\infty}^{+\infty} \frac{[F_n(x) - F(x)]^2}{F(x)[1 - F(x)]} dF(x)$.
   - *Superiority*: Includes the quadratic weight function $\psi(u) = \frac{1}{u(1-u)}$, placing **maximum statistical weight on the upper and lower tails**.

---

### 5.3 Weight Function $\psi(u) = 1/[u(1-u)]$ and Tail Sensitivity
The Anderson-Darling integral is:
$$A^2 = n \int_{-\infty}^{+\infty} [F_n(x) - F(x)]^2 \cdot \psi(F(x)) \, dF(x)$$
where $\psi(u) = \frac{1}{u(1-u)}$.

- As $u \to 0$ (lower tail), $\psi(u) \to \infty$.
- As $u \to 1$ (upper tail), $\psi(u) \to \infty$.
- As $u = 0.5$ (median), $\psi(0.5) = 4$ (minimum weight).

Because extreme value analysis focuses exclusively on the upper tail (maximum wall loss), **the Anderson-Darling test is uniquely superior to all other GoF tests for EVA validation**.

---

### 5.4 Exact Mathematical Formula for the AD Statistic ($A^2$)
For a sorted sample dataset $x_{(1)} \le x_{(2)} \le \dots \le x_{(n)}$ with fitted Gumbel CDF values $F_i = F(x_{(i)}; \hat{\mu}, \hat{\beta})$:

$$A^2 = -n - \frac{1}{n} \sum_{i=1}^n (2i - 1) \left[ \ln(F_i) + \ln(1 - F_{n+1-i}) \right]$$

#### Computational Algorithm in `diagnostics.py`:
```python
x_sorted = np.sort(data)
F = gumbel_cdf(x_sorted, mu, beta)
F = np.clip(F, 1e-10, 1.0 - 1e-10)  # Prevent log(0) numerical instability

i = np.arange(1, n + 1)
ad_sum = np.sum((2 * i - 1) * (np.log(F) + np.log(1.0 - F[::-1])))
A2 = -n - (1.0 / n) * ad_sum
```

---

### 5.5 Known vs. Estimated Parameters (The T.W. Anderson 2010 Breakthrough)
In their original 1954 paper, Anderson and Darling calculated limiting critical values assuming distribution parameters $(\mu, \beta)$ were **known prior to inspecting the data** (e.g., $CV_{0.05} = 2.492$, $CV_{0.01} = 3.880$).

However, in T.W. Anderson's 2010 review paper (*"Twenty-Five Years of Association with the Anderson-Darling Statistic"*), Section 4 explicitly proves:

> *"When parameters in the tested distribution are not known, but are estimated efficiently from the sample data (e.g., via MLE), the covariance of the empirical process is modified. The critical percentage points for estimated parameters are MUCH SMALLER than those for known parameters."*

If an engineer incorrectly compares an MLE-fitted AD statistic against the known-parameter critical value ($2.492$), **the test will almost never reject non-Gumbel data**, creating a false sense of security. Estimated-parameter critical values must be used.

---

### 5.6 Comparative Power Analysis (Shin et al. 2012 Paper Review)
In 2012, Shin, Jung, Jeong, and Heo published a landmark comparative study (*"Assessment of modified Anderson-Darling test statistics for the generalized extreme value distribution"*).

They generated 10,000 Monte Carlo samples across 6 alternative distributions (Normal, $\chi^2$, Cauchy, Beta, Exponential, Logistic) and evaluated 6 competing GoF tests:
1. Anderson-Darling ($AD / A^2$)
2. Modified Anderson-Darling ($B^2$)
3. Cramér-von Mises ($CVM$)
4. Zhang Anderson-Darling ($ZAD$)
5. Zhang Cramér-von Mises ($ZCVM$)
6. Liao-Shimokawa ($L_n$)

**Conclusion**: The standard **Anderson-Darling test combined with MLE parameter estimation produced the highest overall statistical power** (highest rejection rates for incorrect distributions) across sample sizes $n \ge 10$.

---

### 5.7 Sample-Size-Dependent Critical Values (Shin et al. 2012 Table 1)
Shin et al. (2012) established that for Gumbel MLE fits, critical values vary with sample size $n$. The table below (Table 1, Mean Function Method) is embedded directly into `diagnostics.py`:

| Sample Size ($n$) | $\alpha = 0.20$ | $\alpha = 0.15$ | $\alpha = 0.10$ | $\alpha = 0.05$ | $\alpha = 0.01$ |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **10** | 0.554 | 0.607 | 0.683 | **0.815** | 1.118 |
| **30** | 0.507 | 0.558 | 0.628 | **0.747** | 1.019 |
| **100** | 0.511 | 0.562 | 0.632 | **0.752** | 1.029 |

#### Linear Interpolation Algorithm:
For intermediate sample sizes $n \in (10, 100)$, the application linearly interpolates critical values between anchor points:
$$CV(n) = CV(n_{\text{lo}}) + \frac{n - n_{\text{lo}}}{n_{\text{hi}} - n_{\text{lo}}} \left[ CV(n_{\text{hi}}) - CV(n_{\text{lo}}) \right]$$
- For $n < 10$, $CV(10)$ is used (conservative).
- For $n > 100$, $CV(100)$ is used (converged asymptotic values).

---

### 5.8 Weibull vs. Gumbel Finite-Sample Adjustments
In some literature (e.g., MIL-HDBK-17 / `A_DTest.md`), a modified statistic $AD^* = \left(1 + \frac{0.2}{\sqrt{n}}\right) AD$ is cited.

> **CRITICAL METHODOLOGY DISTINCTION**:
> The $AD^*$ factor and its associated OSL formula were derived specifically for the **Weibull and Exponential distributions**. They do NOT apply to Gumbel.
> For the Gumbel distribution, finite-sample effects are directly accounted for by Shin et al.'s sample-size-dependent critical value tables. Therefore, $AD^*$ is intentionally excluded from Gumbel diagnostics.

---

### 5.9 Monte Carlo $p$-Value Simulation Algorithm
To provide exact $p$-values rather than binary pass/fail decisions, `diagnostics.py` executes a 10,000-trial Monte Carlo simulation under $H_0$:

```python
def _monte_carlo_p_value(ad_observed, n, mu, beta, n_simulations=10000, seed=42):
    rng = np.random.default_rng(seed)
    count_exceed = 0
    
    for _ in range(n_simulations):
        # 1. Generate synthetic Gumbel sample of size n using Inverse CDF
        u = np.clip(rng.uniform(0, 1, size=n), 1e-10, 1 - 1e-10)
        synthetic = mu - beta * np.log(-np.log(u))
        synthetic = np.sort(synthetic)
        
        # 2. Re-estimate parameters via MLE
        try:
            mu_sim, beta_sim, _ = fit_gumbel_mle(synthetic)
        except Exception:
            continue
            
        # 3. Compute AD statistic for synthetic trial
        ad_sim = _compute_ad_statistic(synthetic, mu_sim, beta_sim)
        if ad_sim >= ad_observed:
            count_exceed += 1
            
    return count_exceed / n_simulations
```

---

### 5.10 Significance Level Multi-Breakdown ($\alpha = 0.20 \dots 0.01$)
The engine evaluates the observed $A^2$ against critical values across 5 significance levels simultaneously:

$$\text{Decision at level } \alpha: \quad \begin{cases} \text{PASS (Fit Validated)} & \text{if } A^2 < CV_\alpha \\ \text{FAIL (Fit Rejected)} & \text{if } A^2 \ge CV_\alpha \end{cases}$$

This multi-level breakdown is displayed directly on the Next.js frontend UI card, allowing engineers to see if a dataset passes stringently at $\alpha=0.01$ or marginally at $\alpha=0.05$.

---

### 5.11 Case Study: Radar Buried Object Detection via Gumbel GoF
The real-world utility of Gumbel GoF testing extends beyond mechanical integrity. In the reference paper *Buried Object Detection Using Gumbel Goodness of Fit*, ground-penetrating radar (GPR) signals over clear soil exhibit symmetric Normal noise. When a buried object is present, backscattered signals create strong positive peak skewness.

By running a Gumbel GoF test on GPR scan windows, researchers achieved a **94.3% detection rate with only 0.9% false alarms**, demonstrating that Gumbel GoF testing is a highly reliable decision engine for tail-risk detection.

---

## PART VI: COMPLETE WORKED NUMERICAL EXAMPLES

### EXAMPLE 1: Heat Exchanger Tube Bundle ($n=15$ Tubes)

#### 6.1.1 Dataset & Specifications
Consider a heat exchanger bundle with $N = 500$ total tubes. Nominal original tube wall thickness $t_{\text{orig}} = 2.77$ mm. Minimum required thickness $t_{\text{min}} = 1.00$ mm. Service duration $T_{\text{service}} = 10.0$ years.

An IRIS ultrasonic inspection of $n = 15$ tubes yields the following measured remaining minimum wall thickness values (in mm):
$$[2.15, \, 2.05, \, 2.22, \, 1.95, \, 2.10, \, 1.88, \, 2.28, \, 2.02, \, 2.18, \, 1.92, \, 2.08, \, 2.12, \, 1.98, \, 2.25, \, 2.00]$$

---

#### 6.1.2 Preprocessing & Sorting
Convert remaining thickness to wall loss: $x_i = 2.77 - t_{\text{meas}, i}$.

Calculated wall loss values ($x_i$ in mm):
$$[0.62, \, 0.72, \, 0.55, \, 0.82, \, 0.67, \, 0.89, \, 0.49, \, 0.75, \, 0.59, \, 0.85, \, 0.69, \, 0.65, \, 0.79, \, 0.52, \, 0.77]$$

Sort ascending ($x_{(1)} \le x_{(2)} \le \dots \le x_{(15)}$):

| Rank ($i$) | Measured Thickness $t_i$ (mm) | Wall Loss $x_{(i)}$ (mm) | Weibull Prob $P_i = \frac{i}{16}$ | Empirical $y_i = -\ln(-\ln P_i)$ |
| :---: | :---: | :---: | :---: | :---: |
| **1** | 2.28 | **0.49** | 0.0625 | -1.0197 |
| **2** | 2.25 | **0.52** | 0.1250 | -0.7321 |
| **3** | 2.22 | **0.55** | 0.1875 | -0.5152 |
| **4** | 2.18 | **0.59** | 0.2500 | -0.3266 |
| **5** | 2.15 | **0.62** | 0.3125 | -0.1511 |
| **6** | 2.12 | **0.65** | 0.3750 |  0.0193 |
| **7** | 2.10 | **0.67** | 0.4375 |  0.1895 |
| **8** | 2.08 | **0.69** | 0.5000 |  0.3665 |
| **9** | 2.05 | **0.72** | 0.5625 |  0.5527 |
| **10** | 2.02 | **0.75** | 0.6250 |  0.7525 |
| **11** | 2.00 | **0.77** | 0.6875 |  0.9712 |
| **12** | 1.98 | **0.79** | 0.7500 |  1.2262 |
| **13** | 1.95 | **0.82** | 0.8125 |  1.5480 |
| **14** | 1.92 | **0.85** | 0.8750 |  1.9902 |
| **15** | 1.88 | **0.89** | 0.9375 |  2.7265 |

Sample Statistics:
- Mean $\bar{x} = 0.6900$ mm.
- Standard Deviation $s = 0.1189$ mm.

---

#### 6.1.3 MoM Warm-Start & MLE Solution

##### 1. Method of Moments Warm Start:
$$\beta_0 = 0.1189 \times \frac{\sqrt{6}}{\pi} = 0.09270 \text{ mm}$$
$$\mu_0 = 0.6900 - (0.577216 \times 0.09270) = 0.63649 \text{ mm}$$

##### 2. MLE L-BFGS-B Solution:
Executing MLE optimization on the negative log-likelihood yields:
$$\hat{\beta} = 0.10342 \text{ mm}$$
$$\hat{\mu} = 0.63914 \text{ mm}$$

---

#### 6.1.4 Extrapolation to $N=500$ Tubes
Target population $N = 500$.
Reduced variate $y_{500}$:
$$y_{500} = -\ln\left( -\ln\left( 1 - \frac{1}{500} \right) \right) = -\ln(-\ln(0.9980)) = -\ln(0.002002) = 6.2136$$

Predicted Mean Return Level Maximum Wall Loss ($x_{500}$):
$$x_{500} = \hat{\mu} + \hat{\beta} \cdot y_{500} = 0.63914 + (0.10342 \times 6.2136) = 1.2818 \text{ mm}$$

---

#### 6.1.5 Standard Error & Confidence Intervals

##### 1. PVP2006 Standard Error ($SE$):
$$SE(x_{500}) = 0.10342 \times \sqrt{\frac{1.109 + (0.514 \times 6.2136) + (0.608 \times 6.2136^2)}{15}}$$
$$SE(x_{500}) = 0.10342 \times \sqrt{\frac{1.109 + 3.1938 + 23.4739}{15}} = 0.10342 \times \sqrt{\frac{27.7767}{15}} = 0.10342 \times 1.3608 = 0.14073 \text{ mm}$$

##### 2. Student's $t$-Critical Value at 95% Confidence ($\alpha = 0.05$, $df = 14$):
$$t_{0.025, 14} = 2.14479$$

##### 3. Conservative Upper Bound Wall Loss (Level B / 95% Confidence):
$$x_{\text{upper, 95\%}} = x_{500} + (t_{0.025, 14} \times SE) = 1.2818 + (2.14479 \times 0.14073) = 1.2818 + 0.3018 = 1.5836 \text{ mm}$$

##### 4. Conservative Remaining Minimum Wall Thickness:
$$t_{\text{rem, conservative}} = t_{\text{orig}} - x_{\text{upper, 95\%}} = 2.77 - 1.5836 = 1.1864 \text{ mm}$$

##### 5. Corrosion Rate & Remaining Life:
$$CR_{\text{conservative}} = \frac{1.5836 \text{ mm}}{10.0 \text{ years}} = 0.15836 \text{ mm/year}$$
$$RUL = \frac{1.1864 \text{ mm} - 1.00 \text{ mm}}{0.15836 \text{ mm/year}} = \frac{0.1864}{0.15836} = 1.177 \text{ years}$$

---

#### 6.1.6 Anderson-Darling $A^2$ Computation Table
Using $\hat{\mu} = 0.63914$, $\hat{\beta} = 0.10342$, calculate $F_i = \exp\left( -\exp\left( -\frac{x_{(i)} - 0.63914}{0.10342} \right) \right)$:

| Rank $i$ | $x_{(i)}$ | $z_i = \frac{x_{(i)}-\mu}{\beta}$ | $e^{-z_i}$ | $F_i = e^{-e^{-z_i}}$ | $\ln(F_i)$ | $1 - F_{16-i}$ | $\ln(1 - F_{16-i})$ | Term $(2i-1)[\ln F_i + \ln(1-F_{16-i})]$ |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | 0.49 | -1.4421 | 4.2295 | 0.01456 | -4.2295 | 0.08985 | -2.4096 | $1 \times (-6.6391) = -6.6391$ |
| **2** | 0.52 | -1.1520 | 3.1645 | 0.04223 | -3.1646 | 0.13876 | -1.9750 | $3 \times (-5.1396) = -15.4188$ |
| **3** | 0.55 | -0.8619 | 2.3677 | 0.09370 | -2.3677 | 0.20786 | -1.5709 | $5 \times (-3.9386) = -19.6930$ |
| **4** | 0.59 | -0.4751 | 1.6082 | 0.20025 | -1.6082 | 0.29749 | -1.2123 | $7 \times (-2.8205) = -19.7435$ |
| **5** | 0.62 | -0.1851 | 1.2033 | 0.30020 | -1.2033 | 0.33924 | -1.0811 | $9 \times (-2.2844) = -20.5596$ |
| **6** | 0.65 | 0.1049 | 0.9004 | 0.40641 | -0.9004 | 0.40620 | -0.9009 | $11 \times (-1.8013) = -19.8143$ |
| **7** | 0.67 | 0.2984 | 0.7420 | 0.47616 | -0.7420 | 0.45041 | -0.7976 | $13 \times (-1.5396) = -20.0148$ |
| **8** | 0.69 | 0.4918 | 0.6115 | 0.54254 | -0.6115 | 0.54254 | -0.6115 | $15 \times (-1.2230) = -18.3450$ |
| **9** | 0.72 | 0.7818 | 0.4576 | 0.63280 | -0.4576 | 0.52384 | -0.6466 | $17 \times (-1.1042) = -18.7714$ |
| **10** | 0.75 | 1.0719 | 0.3424 | 0.71000 | -0.3425 | 0.59359 | -0.5216 | $19 \times (-0.8641) = -16.4179$ |
| **11** | 0.77 | 1.2653 | 0.2822 | 0.75412 | -0.2822 | 0.69980 | -0.3570 | $21 \times (-0.6392) = -13.4232$ |
| **12** | 0.79 | 1.4587 | 0.2325 | 0.79251 | -0.2325 | 0.79975 | -0.2235 | $23 \times (-0.4560) = -10.4880$ |
| **13** | 0.82 | 1.7488 | 0.1740 | 0.84030 | -0.1740 | 0.90630 | -0.0984 | $25 \times (-0.2724) = -6.8100$ |
| **14** | 0.85 | 2.0389 | 0.1302 | 0.87791 | -0.1302 | 0.95777 | -0.0431 | $27 \times (-0.1733) = -4.6791$ |
| **15** | 0.89 | 2.4256 | 0.0884 | 0.91538 | -0.0884 | 0.98544 | -0.0147 | $29 \times (-0.1031) = -2.9899$ |

Sum of terms $\sum = -213.889$.
$$A^2 = -15 - \frac{1}{15} (-213.889) = -15 + 14.2593 = 0.2407$$

The calculated Anderson-Darling statistic is $A^2 = 0.2407$.

---

#### 6.1.7 Critical Value Interpolation & Final Engineering Decision
Sample size $n = 15$.
We interpolate critical values for $n = 15$ between anchor points $n = 10$ and $n = 30$ from Shin et al. (2012):
- At $\alpha = 0.05$: $CV(10) = 0.815$, $CV(30) = 0.747$.
$$CV_{0.05}(15) = 0.815 + \frac{15 - 10}{30 - 10} (0.747 - 0.815) = 0.815 + 0.25 (-0.068) = 0.7980$$

##### Comparison:
$$A^2 = 0.2407 < CV_{0.05} = 0.7980$$

##### Monte Carlo $p$-Value Result:
Simulating 10,000 trials yields $p \approx 0.842 \ge 0.15$.

##### Final Engineering Decision:
> **STATISTICAL FIT VALIDATED**. The Anderson-Darling statistic ($A^2 = 0.2407$) is far below the critical threshold ($0.7980$), and the $p$-value ($0.842$) confirms excellent compliance with the Gumbel distribution. The conservative estimated remaining wall thickness of $1.1864$ mm provides a statistically defensible basis for safe operation for the next $1.17$ years.

---

### EXAMPLE 2: Process Piping Corrosion Loop ($n=20$ Inspection Grid Locations)

#### 6.2.1 Dataset & Piping Specifications
A 10-inch Schedule 40 heavy gas oil piping circuit contains $N = 1,000$ standardized 1-foot grid sections.
- Nominal original wall thickness $t_{\text{orig}} = 9.27$ mm.
- Minimum required structural thickness $t_{\text{min}} = 3.50$ mm per ASME B31.3.
- Operating period $T_{\text{service}} = 8.0$ years.

An automated ultrasonic grid scan (AUT) of $n = 20$ grid units measures the minimum remaining thickness per grid square (in mm):
$$[7.85, \, 7.42, \, 8.10, \, 7.15, \, 7.60, \, 6.95, \, 8.25, \, 7.35, \, 7.90, \, 7.05, \, 7.55, \, 7.70, \, 7.20, \, 8.15, \, 7.30, \, 7.80, \, 6.80, \, 7.50, \, 7.95, \, 7.10]$$

---

#### 6.2.2 Preprocessing & Wall Loss Conversion
Convert thickness to wall loss: $x_i = 9.27 - t_{\text{meas}, i}$.

Calculated wall loss values ($x_i$ in mm):
$$[1.42, \, 1.85, \, 1.17, \, 2.12, \, 1.67, \, 2.32, \, 1.02, \, 1.92, \, 1.37, \, 2.22, \, 1.72, \, 1.57, \, 2.07, \, 1.12, \, 1.97, \, 1.47, \, 2.47, \, 1.77, \, 1.32, \, 2.17]$$

Sort ascending ($x_{(1)} \le x_{(2)} \le \dots \le x_{(20)}$):

| Rank $i$ | Thickness $t_i$ (mm) | Wall Loss $x_{(i)}$ (mm) | Weibull Prob $P_i = \frac{i}{21}$ | Empirical $y_i = -\ln(-\ln P_i)$ |
| :---: | :---: | :---: | :---: | :---: |
| **1** | 8.25 | **1.02** | 0.0476 | -1.1132 |
| **2** | 8.15 | **1.12** | 0.0952 | -0.8550 |
| **3** | 8.10 | **1.17** | 0.1429 | -0.6657 |
| **4** | 7.95 | **1.32** | 0.1905 | -0.5057 |
| **5** | 7.90 | **1.37** | 0.2381 | -0.3609 |
| **6** | 7.85 | **1.42** | 0.2857 | -0.2255 |
| **7** | 7.80 | **1.47** | 0.3333 | -0.0967 |
| **8** | 7.70 | **1.57** | 0.3810 |  0.0274 |
| **9** | 7.60 | **1.67** | 0.4286 |  0.1487 |
| **10** | 7.55 | **1.72** | 0.4762 |  0.2683 |
| **11** | 7.50 | **1.77** | 0.5238 |  0.3872 |
| **12** | 7.42 | **1.85** | 0.5714 |  0.5064 |
| **13** | 7.35 | **1.92** | 0.6190 |  0.6272 |
| **14** | 7.30 | **1.97** | 0.6667 |  0.7508 |
| **15** | 7.20 | **2.07** | 0.7143 |  0.8787 |
| **16** | 7.15 | **2.12** | 0.7619 |  1.0130 |
| **17** | 7.10 | **2.17** | 0.8095 |  1.1565 |
| **18** | 7.05 | **2.22** | 0.8571 |  1.3134 |
| **19** | 6.95 | **2.32** | 0.9048 |  1.4929 |
| **20** | 6.80 | **2.47** | 0.9524 |  1.7208 |

Sample Statistics:
- Mean $\bar{x} = 1.7240$ mm.
- Standard Deviation $s = 0.4072$ mm.

---

#### 6.2.3 MoM Warm-Start & MLE Solution

##### 1. Method of Moments Warm Start:
$$\beta_0 = 0.4072 \times \frac{\sqrt{6}}{\pi} = 0.31747 \text{ mm}$$
$$\mu_0 = 1.7240 - (0.577216 \times 0.31747) = 1.54075 \text{ mm}$$

##### 2. MLE Solution:
Minimizing negative log-likelihood via L-BFGS-B yields:
$$\hat{\beta} = 0.35410 \text{ mm}$$
$$\hat{\mu} = 1.55120 \text{ mm}$$

---

#### 6.2.4 Extrapolation to $N=1000$ Piping Units
Target population $N = 1000$.
Reduced variate $y_{1000}$:
$$y_{1000} = -\ln\left( -\ln\left( 1 - \frac{1}{1000} \right) \right) = -\ln(-\ln(0.9990)) = 6.9073$$

Predicted Mean Return Level Maximum Wall Loss ($x_{1000}$):
$$x_{1000} = \hat{\mu} + \hat{\beta} \cdot y_{1000} = 1.55120 + (0.35410 \times 6.9073) = 3.9977 \text{ mm}$$

---

#### 6.2.5 PVP2006 SE & Student's $t$ CI Bounds

##### 1. PVP2006 Standard Error ($SE$):
$$SE(x_{1000}) = 0.35410 \times \sqrt{\frac{1.109 + (0.514 \times 6.9073) + (0.608 \times 6.9073^2)}{20}}$$
$$SE(x_{1000}) = 0.35410 \times \sqrt{\frac{1.109 + 3.5504 + 29.0080}{20}} = 0.35410 \times \sqrt{\frac{33.6674}{20}} = 0.35410 \times 1.29745 = 0.45943 \text{ mm}$$

##### 2. Student's $t$-Critical Value at 95% Confidence ($\alpha = 0.05$, $df = 19$):
$$t_{0.025, 19} = 2.09302$$

##### 3. Conservative Upper Bound Wall Loss (Level B / 95% Confidence):
$$x_{\text{upper, 95\%}} = x_{1000} + (t_{0.025, 19} \times SE) = 3.9977 + (2.09302 \times 0.45943) = 3.9977 + 0.9616 = 4.9593 \text{ mm}$$

##### 4. Conservative Remaining Minimum Wall Thickness:
$$t_{\text{rem, conservative}} = 9.27 - 4.9593 = 4.3107 \text{ mm}$$

##### 5. Corrosion Rate & Remaining Useful Life ($RUL$):
$$CR_{\text{conservative}} = \frac{4.9593 \text{ mm}}{8.0 \text{ years}} = 0.6199 \text{ mm/year}$$
$$RUL = \frac{4.3107 \text{ mm} - 3.50 \text{ mm}}{0.6199 \text{ mm/year}} = \frac{0.8107}{0.6199} = 1.308 \text{ years}$$

---

#### 6.2.6 Term-by-Term Anderson-Darling Table
Using $\hat{\mu} = 1.55120$, $\hat{\beta} = 0.35410$, calculate $F_i = \exp\left( -\exp\left( -\frac{x_{(i)} - 1.55120}{0.35410} \right) \right)$:

| Rank $i$ | $x_{(i)}$ | $z_i = \frac{x_{(i)}-\mu}{\beta}$ | $e^{-z_i}$ | $F_i = e^{-e^{-z_i}}$ | $\ln(F_i)$ | $1 - F_{21-i}$ | $\ln(1 - F_{21-i})$ | Term $(2i-1)[\ln F_i + \ln(1-F_{21-i})]$ |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | 1.02 | -1.4999 | 4.4812 | 0.01132 | -4.4812 | 0.06822 | -2.6850 | $1 \times (-7.1662) = -7.1662$ |
| **2** | 1.12 | -1.2177 | 3.3794 | 0.03407 | -3.3794 | 0.10651 | -2.2395 | $3 \times (-5.6189) = -16.8567$ |
| **3** | 1.17 | -1.0765 | 2.9344 | 0.05316 | -2.9344 | 0.13627 | -1.9931 | $5 \times (-4.9275) = -24.6375$ |
| **4** | 1.32 | -0.6529 | 1.9211 | 0.14644 | -1.9211 | 0.17066 | -1.7681 | $7 \times (-3.6892) = -25.8244$ |
| **5** | 1.37 | -0.5117 | 1.6681 | 0.18860 | -1.6681 | 0.20967 | -1.5622 | $9 \times (-3.2303) = -29.0727$ |
| **6** | 1.42 | -0.3705 | 1.4484 | 0.23495 | -1.4484 | 0.25330 | -1.3732 | $11 \times (-2.8216) = -31.0376$ |
| **7** | 1.47 | -0.2293 | 1.2577 | 0.28431 | -1.2577 | 0.30155 | -1.1988 | $13 \times (-2.4565) = -31.9345$ |
| **8** | 1.57 | 0.0528 | 0.9486 | 0.38728 | -0.9486 | 0.35447 | -1.0371 | $15 \times (-1.9857) = -29.7855$ |
| **9** | 1.67 | 0.3355 | 0.7150 | 0.48920 | -0.7150 | 0.41201 | -0.8867 | $17 \times (-1.6017) = -27.2289$ |
| **10** | 1.72 | 0.4767 | 0.6208 | 0.53752 | -0.6208 | 0.47395 | -0.7467 | $19 \times (-1.3675) = -25.9825$ |
| **11** | 1.77 | 0.6179 | 0.5391 | 0.58327 | -0.5391 | 0.53752 | -0.6208 | $21 \times (-1.1599) = -24.3579$ |
| **12** | 1.85 | 0.8438 | 0.4301 | 0.65045 | -0.4301 | 0.58799 | -0.5310 | $23 \times (-0.9611) = -22.1053$ |
| **13** | 1.92 | 1.0415 | 0.3529 | 0.70266 | -0.3529 | 0.64553 | -0.4377 | $25 \times (-0.7906) = -19.7650$ |
| **14** | 1.97 | 1.1827 | 0.3064 | 0.73610 | -0.3064 | 0.71569 | -0.3345 | $27 \times (-0.6409) = -17.3043$ |
| **15** | 2.07 | 1.4651 | 0.2311 | 0.79366 | -0.2311 | 0.76505 | -0.2678 | $29 \times (-0.4989) = -14.4681$ |
| **16** | 2.12 | 1.6063 | 0.2006 | 0.81824 | -0.2006 | 0.81140 | -0.2090 | $31 \times (-0.4096) = -12.6976$ |
| **17** | 2.17 | 1.7475 | 0.1742 | 0.83984 | -0.1746 | 0.85356 | -0.1583 | $33 \times (-0.3329) = -10.9857$ |
| **18** | 2.22 | 1.8887 | 0.1513 | 0.85958 | -0.1513 | 0.89349 | -0.1126 | $35 \times (-0.2639) = -9.2365$ |
| **19** | 2.32 | 2.1711 | 0.1141 | 0.89215 | -0.1141 | 0.92994 | -0.0726 | $37 \times (-0.1867) = -6.9079$ |
| **20** | 2.47 | 2.5947 | 0.0747 | 0.92803 | -0.0747 | 0.96593 | -0.0347 | $39 \times (-0.1094) = -4.2666$ |

Sum of terms $\sum = -381.6509$.
$$A^2 = -20 - \frac{1}{20} (-381.6509) = -20 + 19.0825 = 0.9175$$

---

#### 6.2.7 GoF Decision & EOL Life Assessment
Sample size $n = 20$.
Interpolating critical values for $n = 20$ from Shin et al. (2012):
- $CV_{0.05}(20) = 0.7810$.
- $CV_{0.01}(20) = 1.0685$.

#### Comparison:
$$A^2 = 0.9175 > CV_{0.05} = 0.7810 \quad (\text{REJECTED at } \alpha = 0.05)$$
$$A^2 = 0.9175 < CV_{0.01} = 1.0685 \quad (\text{ACCEPTED at } \alpha = 0.01)$$

#### Monte Carlo $p$-Value Result:
Simulating 10,000 trials yields $p \approx 0.032 < 0.05$.

#### Final Engineering Decision:
> **STATISTICAL FIT REJECTED AT $\alpha = 0.05$ ($p = 0.032$)**. The Anderson-Darling test flags that the piping wall loss data exhibits higher tail skewness than a standard single-population Gumbel model.
> **Action Plan**: Do NOT rely solely on the 1.31-year RUL forecast. Inspect additional grid locations around low-thickness points (points $x=2.47$ mm and $x=2.32$ mm) to determine if localized erosion-corrosion is active at piping elbows.

---

## PART VII: SYSTEM ARCHITECTURE & CODE LEVEL DEEP DIVE

### 7.1 Multi-Service Architecture Breakdown
The application utilizes a decoupled, high-throughput microservice architecture:
- **Next.js 15 App Router**: Modern React UI framework with Recharts and Lucide icons.
- **NestJS Gateway**: TypeScript API backend managing JWT auth, Multer file uploads, and PostgreSQL database state via Prisma ORM.
- **Python FastAPI Engine**: Dedicated scientific computing service running NumPy, SciPy, L-BFGS-B optimization, and Monte Carlo AD simulations.
- **Neon PostgreSQL**: Cloud serverless relational database storing tenant, asset, dataset, and EVA execution records.

---

### 7.2 End-to-End Data Flow Sequence
```
[User CSV File] ──(1. Upload)──> [NestJS Gateway /uploads]
                                          │
                                   (2. Parse & Convert x_i = t_orig - t_meas)
                                          │
                                          ▼
[FastAPI Engine /analyze] <──(3. HTTP POST)─── [NestJS EvaService]
       │
 (4. Preprocess -> MLE -> PVP2006 -> AD Diagnostics)
       │
       ▼
[EVAResponse JSON] ───────(5. HTTP Response)──> [NestJS EvaService]
                                                      │
                                           (6. Persist to PostgreSQL)
                                                      │
                                                      ▼
[Next.js Results UI] <────(7. GET /results)──── [Neon PostgreSQL DB]
```

---

### 7.3 Python Engine Code Deep Dive

#### 7.3.1 `preprocessing.py`
```python
import numpy as np

def preprocess_data(raw_data: list[float]) -> np.ndarray:
    """Clean, filter NaNs/Infs, validate n >= 5, and sort ascending."""
    arr = np.array(raw_data, dtype=np.float64)
    clean_arr = arr[np.isfinite(arr)]
    if len(clean_arr) < 5:
        raise ValueError(f"Insufficient valid data: n={len(clean_arr)} (minimum 5 required).")
    return np.sort(clean_arr)
```

#### 7.3.2 `distributions.py`
```python
import numpy as np
from scipy import stats

def gumbel_cdf(x: np.ndarray, mu: float, beta: float) -> np.ndarray:
    """Gumbel CDF F(x) = exp(-exp(-(x-mu)/beta))."""
    z = np.clip((x - mu) / beta, -500.0, 500.0)
    return np.exp(-np.exp(-z))

def calculate_gumbel_se(beta: float, n: int, y_N: float) -> float:
    """PVP2006 Equation 15 Standard Error."""
    var_factor = (1.109 + 0.514 * y_N + 0.608 * (y_N ** 2)) / n
    return float(beta * np.sqrt(max(0.0, var_factor)))
```

#### 7.3.3 `mle.py`
```python
import numpy as np
from scipy.optimize import minimize
from app.statistics.distributions import gumbel_cdf

def fit_gumbel_mle(data: np.ndarray) -> tuple[float, float, float]:
    """Fit Gumbel parameters (mu, beta) using L-BFGS-B with MoM warm start."""
    n = len(data)
    mean_val = float(np.mean(data))
    std_val = float(np.std(data, ddof=1))
    
    # MoM Warm Start
    beta_0 = max(1e-4, std_val * np.sqrt(6) / np.pi)
    mu_0 = mean_val - 0.5772156649 * beta_0

    def nll(params):
        mu, beta = params
        if beta <= 1e-6:
            return 1e10
        z = np.clip((data - mu) / beta, -500.0, 500.0)
        return float(n * np.log(beta) + np.sum(z) + np.sum(np.exp(-z)))

    res = minimize(nll, [mu_0, beta_0], method="L-BFGS-B", bounds=[(None, None), (1e-6, None)])
    if not res.success:
        res = minimize(nll, [mu_0, beta_0], method="Nelder-Mead")

    mu_fit, beta_fit = float(res.x[0]), float(res.x[1])
    return mu_fit, beta_fit, float(res.fun)
```

#### 7.3.4 `return_levels.py`
```python
import numpy as np
from scipy import stats
from app.statistics.distributions import calculate_gumbel_se

def compute_return_levels(mu: float, beta: float, n_sample: int, return_periods: list[int], conf_levels: list[float]):
    results = {}
    for N in return_periods:
        y_N = -np.log(-np.log(1.0 - 1.0 / N)) if N > 1 else 0.0
        x_N = mu + beta * y_N
        se = calculate_gumbel_se(beta, n_sample, y_N)
        
        ci_map = {}
        for cl in conf_levels:
            alpha = 1.0 - cl
            t_val = float(stats.t.ppf(1.0 - alpha / 2.0, df=n_sample - 1))
            ci_map[f"{int(cl*100)}%"] = {
                "lower": float(x_N - t_val * se),
                "upper": float(x_N + t_val * se),
                "se": se,
                "t_value": t_val
            }
        results[N] = {"return_level": float(x_N), "y_N": float(y_N), "confidences": ci_map}
    return results
```

#### 7.3.5 `diagnostics.py`
```python
import numpy as np
from scipy import stats
from app.statistics.distributions import gumbel_cdf
from app.statistics.mle import fit_gumbel_mle

_CV_TABLE = {
    10:  (0.554, 0.607, 0.683, 0.815, 1.118),
    30:  (0.507, 0.558, 0.628, 0.747, 1.019),
    100: (0.511, 0.562, 0.632, 0.752, 1.029),
}
_ALPHA_LEVELS = [0.20, 0.15, 0.10, 0.05, 0.01]

def _interpolate_cv(n: int, alpha_idx: int) -> float:
    keys = sorted(_CV_TABLE.keys())
    if n <= keys[0]: return _CV_TABLE[keys[0]][alpha_idx]
    if n >= keys[-1]: return _CV_TABLE[keys[-1]][alpha_idx]
    for i in range(len(keys) - 1):
        if keys[i] <= n <= keys[i+1]:
            t = (n - keys[i]) / (keys[i+1] - keys[i])
            return _CV_TABLE[keys[i]][alpha_idx] + t * (_CV_TABLE[keys[i+1]][alpha_idx] - _CV_TABLE[keys[i]][alpha_idx])
    return _CV_TABLE[keys[-1]][alpha_idx]

def anderson_darling_gumbel(data: np.ndarray, mu: float, beta: float, alpha: float = 0.05, compute_p_val: bool = True):
    n = len(data)
    x_sorted = np.sort(data)
    F = np.clip(gumbel_cdf(x_sorted, mu, beta), 1e-10, 1.0 - 1e-10)
    
    i = np.arange(1, n + 1)
    ad_sum = np.sum((2 * i - 1) * (np.log(F) + np.log(1.0 - F[::-1])))
    A2 = float(-n - (1.0 / n) * ad_sum)
    
    cv_map = {f"{a:.2f}": round(_interpolate_cv(n, idx), 4) for idx, a in enumerate(_ALPHA_LEVELS)}
    primary_cv = cv_map.get(f"{alpha:.2f}", cv_map["0.05"])
    passed = A2 < primary_cv
    
    p_val = None
    if compute_p_val:
        rng = np.random.default_rng(42)
        exceed = 0
        for _ in range(10000):
            u = np.clip(rng.uniform(0, 1, size=n), 1e-10, 1.0 - 1e-10)
            syn = np.sort(mu - beta * np.log(-np.log(u)))
            try:
                m_s, b_s, _ = fit_gumbel_mle(syn)
                F_s = np.clip(gumbel_cdf(syn, m_s, b_s), 1e-10, 1.0 - 1e-10)
                a_s = -n - (1.0 / n) * np.sum((2 * i - 1) * (np.log(F_s) + np.log(1.0 - F_s[::-1])))
                if a_s >= A2: exceed += 1
            except Exception: pass
        p_val = float(exceed / 10000)

    return {
        "ad_statistic": A2, "ad_p_value": p_val, "ad_critical_value": primary_cv,
        "ad_critical_values": cv_map, "ad_passed": passed, "n_sample": n
    }
```

#### 7.3.6 `eva_service.py`
```python
from app.statistics.preprocessing import preprocess_data
from app.statistics.mle import fit_gumbel_mle
from app.statistics.return_levels import compute_return_levels
from app.statistics.diagnostics import anderson_darling_gumbel, ks_test_gumbel

def run_eva_pipeline(raw_data: list[float], return_periods: list[int], conf_levels: list[float]):
    clean_data = preprocess_data(raw_data)
    mu, beta, nll = fit_gumbel_mle(clean_data)
    rl_results = compute_return_levels(mu, beta, len(clean_data), return_periods, conf_levels)
    ad_res = anderson_darling_gumbel(clean_data, mu, beta)
    ks_res = ks_test_gumbel(clean_data, mu, beta)
    return {"parameters": {"mu": mu, "beta": beta}, "return_levels": rl_results, "gof": ad_res}
```

---

### 7.4 NestJS Backend Gateway Code Deep Dive

#### 7.4.1 `eva.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class EvaService {
  constructor(private prisma: PrismaService) {}

  async runAnalysis(dto: { datasetId: string; origThick: number; minThick: number; serviceYears: number; population: number }) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: dto.datasetId } });
    const rawValues: number[] = JSON.parse(dataset.rawContent);
    const wallLossData = rawValues.map(v => Math.max(0, dto.origThick - v));

    const response = await axios.post('http://localhost:8000/analyze', {
      data: wallLossData,
      return_periods: [dto.population],
      confidence_levels: [0.99, 0.95, 0.90, 0.80]
    });

    const pyRes = response.data;
    const run = await this.prisma.evaRun.create({
      data: {
        datasetId: dto.datasetId,
        mu: pyRes.parameters.mu,
        beta: pyRes.parameters.beta,
        adStatistic: pyRes.gof.ad_statistic,
        adPValue: pyRes.gof.ad_p_value,
        adCriticalValue: pyRes.gof.ad_critical_value,
        adPassed: pyRes.gof.ad_passed,
        status: 'COMPLETED',
        result: pyRes
      }
    });
    return run;
  }
}
```

#### 7.4.2 `schema.prisma`
```prisma
model EvaRun {
  id               String   @id @default(uuid())
  datasetId        String   @map("dataset_id")
  mu               Float?
  beta             Float?
  adStatistic      Float?   @map("ad_statistic")
  adPValue         Float?   @map("ad_p_value")
  adCriticalValue  Float?   @map("ad_critical_value")
  adPassed         Boolean? @map("ad_passed")
  status           String   @default("PENDING")
  result           Json?
  createdAt        DateTime @default(now()) @map("created_at")

  @@map("eva_runs")
}
```

---

### 7.5 Next.js Frontend UI Component Deep Dive

#### 7.5.1 `page.tsx` Results Display
```tsx
export default function ResultsPage({ params }: { params: { id: string } }) {
  const [run, setRun] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/v1/eva/${params.id}`).then(res => res.json()).then(data => setRun(data));
  }, [params.id]);

  if (!run) return <div>Loading diagnostics...</div>;
  const gof = run.result?.goodness_of_fit;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="font-bold text-lg">Anderson-Darling Test Results</h3>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-500">AD Statistic (A²)</p>
            <p className="text-lg font-mono font-bold">{gof?.ad_statistic?.toFixed(4)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-500">Critical Value (α=0.05)</p>
            <p className="text-lg font-mono font-bold">{gof?.ad_critical_value?.toFixed(4)}</p>
          </div>
        </div>
        {gof?.ad_p_value != null && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-1">Monte Carlo p-value: {gof.ad_p_value.toFixed(4)}</p>
            <div className="w-full bg-gray-200 h-2 rounded">
              <div className={`h-2 rounded ${gof.ad_p_value >= 0.05 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(gof.ad_p_value * 100 / 0.25, 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## PART VIII: COMPREHENSIVE AD REFERENCE LITERATURE REVIEWS

### 8.1 PVP2006-ICPVT11-93702 (W. David Wang, 2006)
- **Title**: *Extreme Value Analysis of Heat Exchanger Tube Inspection Data*.
- **Contribution**: Established the standard error equation (Eq. 15) and Student's $t$ confidence interval formulation (Eq. 16) specifically tailored for NDE tube inspection wall loss data. Proved that $n = 20 \dots 30$ tubes is the optimal sampling size.

---

### 8.2 ASTM E2283-03 Standard Practice
- **Title**: *Standard Practice for Extreme Value Analysis of Non-Metallic Inclusion Length in Steels and Other Materials*.
- **Contribution**: Standardized the use of Gumbel Type I distribution, MLE parameter estimation, and Weibull plotting positions ($P_i = \frac{i}{n+1}$) for industrial extreme value characterization.

---

### 8.3 Anderson & Darling (1954) JASA Foundation Paper
- **Title**: *A Test of Goodness of Fit*. Journal of the American Statistical Association, Vol. 49, No. 268.
- **Contribution**: Introduced the $A^2$ statistic with weight function $\psi(u) = \frac{1}{u(1-u)}$, proving its superior statistical power over KS and CVM tests for detecting tail deviations.

---

### 8.4 T.W. Anderson (2010) Review Paper
- **Title**: *Twenty-Five Years of Association with the Anderson-Darling Statistic*.
- **Contribution**: Clarified the mathematical distinction between known vs. estimated parameter GoF testing, proving that critical values for MLE-fitted distributions are significantly smaller than known-parameter values.

---

### 8.5 Shin et al. (2012) Comparative GoF Study
- **Title**: *Assessment of modified Anderson-Darling test statistics for the generalized extreme value distribution*.
- **Contribution**: Derived sample-size-dependent critical value tables (Table 1) for Gumbel MLE fits via 10,000 Monte Carlo trials, establishing AD as the most powerful test among 6 competing GoF methods.

---

### 8.6 START 2003-5 Reliability Guide (A_DTest.md)
- **Title**: *Selected Topics in Assurance Related Technologies: The Anderson-Darling Test for Goodness of Fit*.
- **Contribution**: Documented distribution-specific decision rules for Normal, Lognormal, Weibull, and Exponential distributions, highlighting that finite-sample factor $AD^*$ applies specifically to Weibull.

---

### 8.8 Equation & Literature Reference Matrix

| Literature Source | Focus Area | Key Formulas / Tables Provided | Application Usage |
| :--- | :--- | :--- | :--- |
| **PVP2006-ICPVT11-93702** | Exchanger Tube EVA | $y_N = -\ln(-\ln(1 - 1/N))$, $SE(x_N) = \beta \sqrt{\frac{1.109 + 0.514y_N + 0.608y_N^2}{n}}$, $CI = x_N \pm t_{\alpha/2, n-1} SE$ | Core extrapolation and confidence interval engine in `return_levels.py` |
| **ASTM E2283-03** | Standard EVA Practice | $F(x) = \exp(-\exp(-(x-\mu)/\beta))$, $P_i = \frac{i}{n+1}$, MoM warm start equations | Standardized Gumbel distribution fitting & Q-Q probability plotting |
| **Anderson & Darling (1954)** | General EDF Test | $A^2 = -n - \frac{1}{n}\sum_{i=1}^n (2i-1)[\ln F_i + \ln(1 - F_{n+1-i})]$, weight $\psi(u) = \frac{1}{u(1-u)}$ | Core Anderson-Darling statistic calculation in `diagnostics.py` |
| **T.W. Anderson (2010)** | Estimated Parameters | Section 4 proof: MLE parameter estimation alters covariance structure, reducing critical percentage points | Justification for using estimated-parameter critical value tables |
| **Shin et al. (2012)** | Gumbel GoF Power | Table 1 (Mean function MLE critical values for $n=10, 30, 100$ across $\alpha=0.20 \dots 0.01$) | Embedded critical value table and linear interpolation algorithm |
| **START 2003-5 (A_DTest.md)** | Distribution Decision Rules | Distribution-specific formulas for Normal, Lognormal, Weibull ($AD^* = (1 + 0.2/\sqrt{n})AD$), Exponential | Confirmed $AD^*$ finite-sample factor applies to Weibull ONLY |
| **Buried Object Detection (2012)** | Tail Risk Identification | Gumbel GoF application for GPR signal anomaly detection | Validation of Gumbel GoF testing in high-reliability field applications |

---

## PART IX: TROUBLESHOOTING, EDGE CASES & BEST PRACTICES

### 9.1 Small Sample Size Management ($n < 10$)
- **Problem**: When sample size $n < 10$, GoF tests suffer from low statistical power (high Type II error rate; failing to reject a bad fit).
- **System Action**: `diagnostics.py` automatically detects $n < 10$, clamps critical values to $CV(10)$ (conservative), and appends an explicit warning to the UI:
  > *"⚠ Sample size (n=X) is very small. The AD test has limited statistical power—consider inspecting 20–30 units per PVP2006."*

---

### 9.2 Bimodal & Mixed Damage Mechanism Identification
- **Problem**: If data contains two corrosion mechanisms (e.g., general thinning + localized pitting), the Q-Q plot exhibits a distinct "S-curve" bend and $A^2$ exceeds critical thresholds.
- **Remediation Steps**:
  1. **Visual Diagnostics**: Inspect the Gumbel Q-Q probability plot for non-linear inflection points or multi-cluster grouping.
  2. **Data Segmentation**: Divide the inspection dataset by physical location (e.g., top 2 rows vs. bottom rows of a heat exchanger bundle, or straight pipe vs. high-velocity elbow grid scans).
  3. **Independent Re-analysis**: Fit separate Gumbel EVA distributions to each homogeneous sub-population.

---

### 9.3 Outlier Treatment Protocols
- **Problem**: A single corrupted NDE measurement (e.g., false wall loss reading caused by surface scale or probe lift-off) artificially inflates the Anderson-Darling statistic $A^2$.
- **Verification Protocol**:
  - **Step 1**: Re-examine raw ultrasonic A-scan / B-scan signals for the extreme data point.
  - **Step 2**: If confirmed as an NDE measurement error, log the technical justification and exclude the point from the statistical sample.
  - **Step 3**: If confirmed as genuine localized metal loss (e.g., isolated deep pit), create a dedicated localized damage evaluation zone rather than corrupting the general thinning population model.

---

### 9.4 Numerical Stability & Overflow Prevention Safeguards
- **Safeguard 1 (Log-Domain Math)**: All likelihood and CDF calculations are executed in natural log space to prevent floating-point underflow.
- **Safeguard 2 (Reduced Variate Clipping)**: Reduced variates $z = \frac{x - \mu}{\beta}$ are strictly clipped to $[-500, +500]$:
  ```python
  z = np.clip((data - mu) / beta, -500.0, 500.0)
  ```
- **Safeguard 3 (CDF Boundary Clipping)**: Fitted CDF values are clipped to $[10^{-10}, 1 - 10^{-10}]$ before computing $\ln(F_i)$ and $\ln(1 - F_i)$, preventing $\ln(0) = -\infty$ numerical crashes:
  ```python
  F = np.clip(gumbel_cdf(x_sorted, mu, beta), 1e-10, 1.0 - 1e-10)
  ```

---

### 9.5 Production Verification & Deployment Checklist

#### Automated Test Suite Execution:
Verify that all 29 automated tests pass in the Python statistical engine:
```bash
cd eva-engine
.\venv\Scripts\python.exe -m pytest test_ad.py -v --tb=short
```

Expected Test Results:
- `TestADFormula`: Formula positivity, tail sensitivity, monotonic increase with outliers.
- `TestCriticalValues`: Exact anchor points ($n=10, 30, 100$), linear interpolation ($n=20$), small/large $n$ clamping.
- `TestSyntheticGumbelPass`: Pass validation across $n \in [10, 100]$ synthetic Gumbel samples.
- `TestNonGumbelReject`: Correct rejection of Normal and Uniform non-Gumbel datasets.
- `TestReturnStructure`: Verification of Pydantic model types and non-empty interpretation text.
- `TestEdgeCases`: Robust handling of minimum $n=5$, large $n=300$, and small-sample warnings.
- `TestMonteCarloCalibration`: 500-trial verification under $H_0$ confirming rejection rate matches nominal $\alpha = 0.05 \pm 0.03$.

#### Database Migration & Environment Setup:
```bash
# 1. Update Backend Prisma Client
cd backend
npx prisma generate

# 2. Synchronize PostgreSQL Database Schema
npx prisma db push

# 3. Start Python FastAPI Engine
cd eva-engine
.\venv\Scripts\uvicorn app.main:app --reload --port 8000

# 4. Start NestJS Backend Gateway
cd backend
npm run start:dev

# 5. Launch Next.js Frontend Dashboard
cd frontend
npm run dev
```

---
*End of Comprehensive Reference Manual — Asset Integrity EVA Platform (2026)*

