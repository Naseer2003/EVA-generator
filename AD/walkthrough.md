# EVA Platform — Complete System Documentation

## The Extreme Value Analysis Platform for Industrial Mechanical Integrity

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Real-World Problem](#2-the-real-world-problem)
3. [Scientific Foundation — The Mathematics Behind EVA](#3-scientific-foundation)
4. [System Architecture](#4-system-architecture)
5. [Python Statistical Engine — Module by Module](#5-python-statistical-engine)
6. [Backend Gateway — NestJS](#6-backend-gateway)
7. [Frontend Dashboard — Next.js](#7-frontend-dashboard)
8. [Anderson-Darling Goodness-of-Fit Testing — The Complete Picture](#8-anderson-darling-goodness-of-fit-testing)
9. [Current AD Implementation and Identified Gaps](#9-current-ad-implementation-and-gaps)
10. [Planned AD Enhancements — What Will Change](#10-planned-ad-enhancements)
11. [Future Roadmap](#11-future-roadmap)

---

## 1. Executive Summary

The **EVA Platform** is a production-grade Extreme Value Analysis system designed for **reliability engineering** and **asset integrity management** in heavy industries — oil & gas, pipelines, refineries, chemical plants, and manufacturing.

It implements the methodology defined in two authoritative sources:

- **PVP2006-ICPVT11-93702** — W. David Wang's 2006 ASME paper: *"Extreme Value Analysis of Heat Exchanger Tube Inspection Data"*
- **ASTM E2283** — Standard practice for extreme value analysis of non-metallic inclusion length in steels

The platform takes real inspection data (wall thickness measurements from heat exchanger tubes, piping, or vessels), fits a **Gumbel extreme value distribution** to the measured maximum wall loss values, and produces **statistically conservative estimates** of the worst-case wall loss, remaining thickness, corrosion rates, and end-of-life dates — all with explicit confidence intervals at 80%, 90%, 95%, and 99% levels.

The system is composed of three services:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 15, Tailwind CSS, Recharts | Dashboard UI, charts, tables, report generation |
| **Backend** | NestJS, Prisma ORM, PostgreSQL | API gateway, authentication, orchestration, storage |
| **Statistical Engine** | FastAPI, SciPy, NumPy | All mathematical computation — MLE, return levels, GoF tests |

---

## 2. The Real-World Problem

### Why Measured Minimums Are Not Enough

Industrial heat exchangers can contain hundreds or even thousands of tubes. During inspection, only a **sample** of tubes is inspected (typically 20–30 tubes, per PVP2006's recommendation). The inspector measures the wall thickness of each inspected tube and records the **minimum thickness** found on that tube.

The fundamental problem is:

> **The measured minimum from the inspected sample is almost always greater than the true minimum of the entire population.**

This means that if an engineer uses the measured minimum directly for remaining life assessment, the result is **non-conservative** — the actual worst tube may be thinner than what was measured, and the equipment could fail earlier than predicted.

There are only two ways to address this:

1. **Brute force**: Inspect every single tube. This is extremely expensive, time-consuming, and logistically difficult.
2. **Statistical modeling (EVA)**: Inspect a representative sample, fit a statistical distribution to the extreme values, and extrapolate to estimate the worst-case value for the entire population — with quantified uncertainty.

### What EVA Provides

EVA answers the question: *"Based on the wall loss I measured on 25 tubes, what is the most likely maximum wall loss across all 500 tubes in this heat exchanger, and how confident am I in that estimate?"*

Specifically, the platform produces:

- **Return level estimates (x_N)** — The predicted maximum wall loss for a population of N tubes
- **Confidence intervals** — Upper and lower bounds at 80%, 90%, 95%, 99% confidence
- **Remaining thickness** — Original thickness minus predicted wall loss
- **Corrosion rate** — Wall loss divided by years in service
- **End-of-life (EOL) date** — When the remaining thickness will reach the minimum required thickness
- **RBI effectiveness levels** — Mapped to API Risk-Based Inspection categories A/B/C/D

### The Population Concept

A population must consist of units exposed to the **same degradation mechanism**. For example:

- An entire tube bundle = one population (if all tubes see the same environment)
- Different passes of a tube bundle = separate populations (if they see different fluids)
- A piping system = multiple populations (one per corrosion loop/circuit)
- A pressure vessel = populations separated by shell courses, heads, nozzles

Mixing populations with different damage mechanisms produces data that cannot fit any mathematical model. Separating them allows clean, effective EVA prediction.

### The Unit Minimum Method

Each inspected unit (one tube, one section of pipe, one area of vessel wall) produces **one value**: the minimum thickness measured on that unit. These minimum values, one per inspected unit, are the input data for EVA. This is called the **Unit Minimum Method**, and it is the cornerstone of EVA for mechanical integrity applications.

---

## 3. Scientific Foundation

### 3.1 The Gumbel Distribution

The Gumbel distribution (also called Extreme Value Type I) is a double-exponential distribution that models the behavior of extreme values — the maximum or minimum of a large set of independent random variables.

The **probability density function (PDF)** is:

$$f(x) = \frac{1}{\delta} \exp\left(-\frac{x - \lambda}{\delta}\right) \cdot \exp\left(-\exp\left(-\frac{x - \lambda}{\delta}\right)\right)$$

The **cumulative distribution function (CDF)** is:

$$F(x) = \exp\left(-\exp\left(-\frac{x - \lambda}{\delta}\right)\right)$$

where:
- **λ (lambda)** = location parameter (called `mu` in code)
- **δ (delta)** = scale parameter (called `beta` in code)

The Gumbel distribution has been widely used and accepted for corrosion-related applications. In Dr. Wang's experience (35+ years in asset integrity), the Gumbel yields better results than alternatives (Weibull, GEV) for mechanical integrity assessment — providing sufficiently conservative but not overly conservative results.

### 3.2 Parameter Estimation

There are three methods to estimate λ and δ from data. The platform supports two of them:

#### Method of Moments (MoM) — Used Only as MLE Warm-Start

The simplest estimation method. Given n data points with sample mean μ and standard deviation σ:

$$\delta_{mom} = \sigma \cdot \frac{\sqrt{6}}{\pi}$$

$$\lambda_{mom} = \mu - 0.5772 \cdot \delta_{mom}$$

where 0.5772 is the Euler-Mascheroni constant.

MoM estimates are used **only as initial guesses** for the MLE optimizer. They are not used as final parameter values.

#### Maximum Likelihood Estimation (MLE) — The Primary Method

MLE maximizes the likelihood of obtaining the measured data given the assumed distribution. The log-likelihood for the Gumbel distribution is:

$$\ell(\lambda, \delta) = -n \ln(\delta) - \sum_{i=1}^{n} \left[\frac{x_i - \lambda}{\delta} + \exp\left(-\frac{x_i - \lambda}{\delta}\right)\right]$$

In practice, we **minimize the negative log-likelihood** using the **L-BFGS-B** optimizer (a quasi-Newton method with bounds), with fallback to **Nelder-Mead** if L-BFGS-B fails. The MoM estimates provide the warm-start initial values to ensure convergence.

Numerical stability is ensured by:
- Clipping the reduced variate z = (x - λ)/δ to the range [-500, 500] to prevent exp() overflow
- Enforcing δ > 0 via optimizer bounds
- Returning a penalty value (1e10) if δ ≤ 0

### 3.3 Return Level Computation

The **return level** x_N is the estimated maximum wall loss for a population of N tubes. From PVP2006 Equation 10:

$$x_N = \lambda + \delta \cdot y_N$$

where y_N is the **Gumbel reduced variate** for population size N:

$$y_N = -\ln\left(-\ln\left(1 - \frac{1}{N}\right)\right)$$

For example:
- N = 100 tubes: y_N ≈ 4.60, meaning x_100 = λ + 4.60·δ
- N = 500 tubes: y_N ≈ 6.21, meaning x_500 = λ + 6.21·δ
- N = 2000 tubes: y_N ≈ 7.60, meaning x_2000 = λ + 7.60·δ

The larger the population, the further into the tail we must extrapolate, and the larger the predicted extreme value.

### 3.4 Standard Error — PVP2006 Equation 15

The standard error quantifies the uncertainty in the return level estimate. From PVP2006:

$$SE(x) = \delta \cdot \sqrt{\frac{1.109 + 0.514 \cdot y + 0.608 \cdot y^2}{n}}$$

where:
- δ = Gumbel scale parameter (from MLE)
- y = reduced variate at the point of interest
- n = sample size (number of inspected units)

Key property: **SE is inversely proportional to √n**. This means:
- Inspecting more tubes reduces uncertainty
- But the reduction tapers off quickly — going from 20 to 30 tubes helps a lot; going from 100 to 110 helps almost nothing
- This is why the ideal sample size is 20–30 tubes (PVP2006)

### 3.5 Confidence Intervals — PVP2006 Equation 16

The confidence interval is computed using the **Student's t-distribution**:

$$CI(x) = x_N \pm t \cdot SE(x)$$

where t is the Student's t-test value, a function of sample size n and confidence level. The t-value is computed analytically using SciPy's `stats.t.ppf()` with (n-1) degrees of freedom and two-tailed probability.

For mechanical integrity applications:
- **The LOWER bound** (x_N − t·SE) is the **conservative estimate** — use this for integrity decisions
- **The UPPER bound** (x_N + t·SE) is the non-conservative upper bound

The four standard confidence levels map to API RBI Inspection Effectiveness categories:

| Confidence | API RBI Level | Meaning |
|-----------|---------------|---------|
| **99%** | **A** (Highly Effective) | Very conservative — highest confidence in integrity |
| **95%** | **B** (Usually Effective) | Standard engineering practice |
| **90%** | **C** (Fairly Effective) | Moderate confidence |
| **80%** | **D** (Poorly Effective) | Less conservative |

### 3.6 Wall Loss Conversion and End-of-Life Calculation

If the original tube thickness is known (e.g., 2.77 mm), the platform converts measured remaining thickness values to wall loss values:

$$\text{wall\_loss} = \max(0, \text{originalThickness} - \text{measured\_thickness})$$

The corrosion rate is:

$$\text{corrosion\_rate} = \frac{\text{wall\_loss}}{\text{years\_in\_service}}$$

The end-of-life (EOL) date is when remaining thickness reaches the minimum required:

$$\text{EOL} = \text{startDate} + \frac{\text{originalThickness} - \text{minRequired}}{\text{corrosionRate}} \times 365.25 \text{ days}$$

### 3.7 Plotting Positions — Weibull Formula

For creating probability plots, data points are assigned cumulative probabilities using the Weibull plotting position formula (PVP2006 Equation 1):

$$P_i = \frac{i}{n + 1}$$

where i is the rank (1 to n) in ascending order. This ensures P is strictly between 0 and 1.

The corresponding reduced variate for each data point is:

$$y_i = -\ln(-\ln(P_i))$$

---

## 4. System Architecture

### 4.1 Three-Tier Architecture

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│              Next.js 15 (App Router)                 │
│         Tailwind CSS, Recharts, Lucide               │
│              Port: 3000                              │
│                                                      │
│  Pages:                                              │
│    / ──────── Landing Page                           │
│    /login ─── Authentication                         │
│    /register ── User Registration                    │
│    /dashboard ── Main Dashboard                      │
│    /dashboard/datasets ── Upload & Manage            │
│    /dashboard/analysis ── EVA Runs List              │
│    /dashboard/analysis/[id] ── Results + Charts      │
│    /dashboard/analysis/[id]/report ── PDF Report     │
│    /dashboard/reports ── Reports List                │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP (Axios + JWT)
                     ▼
┌──────────────────────────────────────────────────────┐
│                    BACKEND                           │
│                NestJS + Prisma ORM                   │
│               Port: 3001                             │
│               Prefix: /api/v1                        │
│                                                      │
│  Modules:                                            │
│    auth/ ──── JWT login, register, profile           │
│    users/ ─── User management                        │
│    datasets/ ── CSV/TXT/XLSX upload (Multer)         │
│    eva/ ────── EVA run orchestration                 │
│    assets/ ─── Asset metadata                        │
│    reports/ ── Report generation                     │
│                                                      │
│  Responsibilities:                                   │
│    ✓ Parse uploaded CSV data                         │
│    ✓ Convert thickness → wall loss                   │
│    ✓ Call Python engine for computation              │
│    ✓ Store results (EvaRun + ReturnLevel tables)     │
│    ✓ Compute corrosion rate & EOL date               │
│    ✓ Enrich confidence interval data                 │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP POST /analyze
                     ▼
┌──────────────────────────────────────────────────────┐
│              STATISTICAL ENGINE                      │
│              FastAPI (Python)                        │
│              Port: 8000                              │
│                                                      │
│  Modules:                                            │
│    preprocessing.py ── Sort, validate, clean         │
│    mle.py ──────────── Gumbel MLE (L-BFGS-B)        │
│    distributions.py ── PDF, CDF, SE, t-value         │
│    return_levels.py ── x_N, CI per PVP2006           │
│    diagnostics.py ──── Anderson-Darling, KS tests    │
│    bootstrap.py ────── Bootstrap CI (available)      │
│    plotting.py ─────── Q-Q plot, return level plot   │
│                                                      │
│  Endpoints:                                          │
│    POST /analyze ── Full EVA pipeline                │
│    GET  /health ─── Health check                     │
└──────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│                 DATABASE                             │
│         Neon PostgreSQL (Serverless)                  │
│                                                      │
│  Tables:                                             │
│    users ──────── id, email, password, role, tenant  │
│    tenants ────── id, name, slug                     │
│    assets ─────── id, name, location, material       │
│    datasets ───── id, name, filePath, rowCount       │
│    eva_runs ───── id, mu, beta, adStatistic, result  │
│    return_levels ── id, period, value, CI bounds     │
│    inspections ─── id, wallLoss, thickness           │
└──────────────────────────────────────────────────────┘
```

### 4.2 Complete Data Flow — From Upload to Results

1. **User uploads** a CSV file containing wall thickness measurements (one column, one value per row). The file goes to `POST /api/v1/datasets/upload`.

2. **Backend stores** the file on disk in `./uploads/` and creates a `Dataset` record in the database with the file path, row count, and metadata.

3. **User triggers EVA analysis** by selecting a dataset and providing parameters (original thickness, min required thickness, dates, confidence level, return periods). This calls `POST /api/v1/eva/run`.

4. **Backend reads the CSV**, converts thickness → wall loss if `originalThickness` is provided, and creates an `EvaRun` record with status `PROCESSING`.

5. **Backend calls the Python engine** at `POST http://localhost:8000/analyze` with the wall loss data array and configuration.

6. **Python engine runs the full pipeline:**
   - `preprocess()` — remove NaN/Inf, validate n ≥ 5, sort ascending
   - `fit_gumbel_mle()` — MoM warm-start → L-BFGS-B optimization → (μ, β)
   - `compute_return_levels()` — x_N, SE, CI for each return period and confidence level
   - `anderson_darling_gumbel()` — AD goodness-of-fit test
   - `ks_test_gumbel()` — Kolmogorov-Smirnov test
   - `build_probability_plot_data()` — Q-Q plot data with tabular breakdowns
   - `build_return_level_plot_data()` — Smooth curves with CI bands

7. **Python engine returns** an `EVAResponse` JSON containing parameters, return levels, GoF results, and plot data.

8. **Backend stores results** — updates the `EvaRun` record with μ, β, AD statistic, AD pass/fail, KS statistic, KS p-value, and the full result JSON. Creates `ReturnLevel` records enriched with remaining thickness, corrosion rate, and EOL date for each confidence level.

9. **Frontend fetches and displays** the results with charts, tables, diagnostic panels, and engineering recommendations.

---

## 5. Python Statistical Engine — Module by Module

### 5.1 Preprocessing (`preprocessing.py`)

**Purpose**: Clean and prepare raw inspection data for statistical analysis.

**Pipeline**:
1. Convert list of floats to a NumPy array (float64)
2. Remove all NaN and Infinity values
3. Validate: at least 5 valid observations required (raise error if not)
4. Sort in **ascending order** — x₁ ≤ x₂ ≤ ... ≤ xₙ (required by PVP2006 Eq. 1)
5. Return clean, sorted array

**Helper functions**:
- `plotting_positions(n)` — Weibull formula: Pᵢ = i/(n+1)
- `reduced_variates(probs)` — Gumbel reduced variate: yᵢ = -ln(-ln(Pᵢ))

### 5.2 Distributions (`distributions.py`)

**Purpose**: Core Gumbel distribution functions and PVP2006 analytical formulas.

**Functions**:

| Function | Formula | Purpose |
|----------|---------|---------|
| `gumbel_mom(data)` | δ = σ·√6/π, λ = μ̄ - 0.5772·δ | Method of Moments (warm-start only) |
| `gumbel_nll(params, data)` | n·ln(β) + Σ(z + exp(-z)) | Negative log-likelihood for optimizer |
| `gumbel_cdf(x, mu, beta)` | exp(-exp(-(x-λ)/δ)) | Cumulative distribution function |
| `gumbel_pdf(x, mu, beta)` | (1/δ)·exp(-z - exp(-z)) | Probability density function |
| `calculate_gumbel_se(delta, n, y)` | δ·√((1.109 + 0.514y + 0.608y²)/n) | PVP2006 Eq. 15 standard error |
| `calculate_t_value(n, cl)` | stats.t.ppf(1 - α/2, n-1) | Student's t-value (two-tailed) |

### 5.3 MLE Fitting (`mle.py`)

**Purpose**: Fit Gumbel distribution parameters via Maximum Likelihood Estimation.

**Algorithm**:
1. Compute MoM estimates (λ₀, δ₀) as initial values
2. Run L-BFGS-B optimizer with bounds: λ unbounded, δ > 1e-6
3. If L-BFGS-B fails to converge, fall back to Nelder-Mead (unbounded simplex method)
4. Enforce δ > 1e-6 on the result
5. Return (μ, β, nll_value)

**Optimizer settings**: maxiter=1000, ftol=1e-12, gtol=1e-8 — these are very tight tolerances to ensure numerical precision.

### 5.4 Return Levels (`return_levels.py`)

**Purpose**: Compute the extreme value estimates and their confidence intervals for each requested population size.

**For each population size N**:
1. Compute reduced variate: y_N = -ln(-ln(1 - 1/N))
2. Compute return level: x_N = μ + β·y_N (PVP2006 Eq. 10)
3. Compute standard error: SE = β·√((1.109 + 0.514y + 0.608y²)/n) (Eq. 15)
4. For each confidence level (80%, 90%, 95%, 99%):
   - Compute t-value: t = Student's t with (n-1) degrees of freedom
   - Lower bound: x_N - t·SE (conservative — use for integrity)
   - Upper bound: x_N + t·SE
5. Return all results in a structured dictionary

### 5.5 Plotting (`plotting.py`)

**Purpose**: Generate JSON-serializable plot data (no matplotlib — all rendering done on frontend).

**Probability Plot (Gumbel Q-Q Plot)**:
- X-axis: theoretical Gumbel quantiles (reduced variates yᵢ)
- Y-axis: observed wall loss values (ascending)
- Fitted line: x = μ + β·y
- Includes per-rank tabular data with observed, fitted, SE, and CI bounds at all 4 levels

**Return Level Plot**:
- X-axis: population size N (log scale)
- Y-axis: predicted wall loss x_N
- Smooth curve: 200 log-spaced points from N=2 to max(return_periods)×5
- CI bands: upper and lower bounds at the primary confidence level
- Exact points: markers at each requested return period

### 5.6 Diagnostics (`diagnostics.py`)

**Purpose**: Goodness-of-fit testing to validate whether the Gumbel distribution adequately models the data.

This module currently contains two tests:

**Anderson-Darling (AD) Test**:
- Computes the AD statistic using the canonical formula
- Compares against a hardcoded critical value of 0.757
- Returns: statistic, critical value, pass/fail boolean

**Kolmogorov-Smirnov (KS) Test**:
- Uses SciPy's `ks_1samp` with the fitted Gumbel CDF
- Returns: statistic, p-value

(This module is the primary target of the AD enhancement — see Sections 8–10.)

### 5.7 Bootstrap (`bootstrap.py`)

**Purpose**: Alternative confidence interval computation via resampling (available but NOT used in the main pipeline).

**Algorithm**:
1. Resample data with replacement (1000 iterations)
2. For each resample: re-fit MLE, compute return levels
3. Extract percentile-based CI from the distribution of resampled return levels

The bootstrap module exists but is **not called** by the main `eva_service.py`. The platform uses the PVP2006 analytical CI (Eq. 15-16) instead, which is the correct approach per the reference methodology.

### 5.8 EVA Service Orchestrator (`eva_service.py`)

**Purpose**: Orchestrates the complete pipeline — calls each module in sequence and assembles the final response.

**Pipeline execution order**:
1. `preprocess(data)` → sorted, validated array
2. Parameter estimation (MLE or MoM) → (μ, β)
3. `compute_return_levels()` → x_N, SE, CI for all periods and confidence levels
4. `build_probability_plot_data()` → Q-Q plot data
5. `build_return_level_plot_data()` → return level curve + CI bands
6. `anderson_darling_gumbel()` → AD test results
7. `ks_test_gumbel()` → KS test results
8. Assemble `EVAResponse` object

---

## 6. Backend Gateway — NestJS

### 6.1 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | No | Create user account |
| `POST` | `/api/v1/auth/login` | No | Get JWT token |
| `GET` | `/api/v1/auth/profile` | Yes | Get current user |
| `POST` | `/api/v1/datasets/upload` | Yes | Upload CSV/TXT/XLSX |
| `GET` | `/api/v1/datasets` | Yes | List user's datasets |
| `POST` | `/api/v1/eva/run` | Yes | Execute EVA analysis |
| `GET` | `/api/v1/eva/:id/results` | Yes | Get analysis results |
| `GET` | `/api/v1/eva/my-runs` | Yes | List user's analysis runs |

### 6.2 Database Schema

The platform uses PostgreSQL with Prisma ORM. The core models:

**User** — Multi-tenant user with roles (ADMIN, ENGINEER, VIEWER).

**Tenant** — Organization-level isolation. Every user, dataset, and asset belongs to a tenant.

**Asset** — A physical piece of equipment (heat exchanger, pipe, vessel) with name, location, material, and design thickness.

**Dataset** — An uploaded inspection data file with metadata (name, file path, row count, status: PENDING/VALIDATED/INVALID).

**EvaRun** — A single EVA analysis execution. Contains:
- Link to dataset and user
- Method used (MLE or MoM)
- Fitted parameters (μ, β, ξ)
- Goodness-of-fit results (AD statistic, AD passed, KS statistic, KS p-value)
- Input parameters (original thickness, min required, dates, total population)
- Full engine result as JSON
- Status (PENDING → PROCESSING → COMPLETED/FAILED)

**ReturnLevel** — One record per return period per EVA run. Contains:
- Return period N
- Predicted value x_N
- CI lower and upper bounds
- Corrosion rate and EOL date
- Full confidence breakdown at all levels (`allConfidences` JSON)

### 6.3 The EVA Service — Orchestration Logic

The backend's `eva.service.ts` does critical work beyond just proxying to Python:

1. **Reads and parses the CSV file** — handles CSV and plain text formats
2. **Converts thickness → wall loss** — if `originalThickness` is provided, computes `max(0, originalThickness - value)` for each data point
3. **Injects total population** — if not provided, defaults to the number of data points
4. **Calls the Python engine** — sends processed data + configuration
5. **Enriches return level data** — for each confidence level at each return period, computes:
   - Wall loss (upper bound = conservative for wall loss perspective)
   - Remaining thickness (original - wall loss)
   - Corrosion rate (wall loss / years in service)
   - EOL date (when remaining thickness reaches minimum required)
6. **Stores everything** — EvaRun record + ReturnLevel records with full enrichment

### 6.4 Date Handling and EOL Calculation

The service handles multiple date formats (ISO, DD/MM/YYYY, MM-DD-YY) and computes years in service:

$$\text{years} = \frac{\text{inspectionDate} - \text{serviceStartDate}}{365.25 \text{ days}}$$

EOL calculation has two paths:

- **With service start date**: Total life = (originalThickness - minRequired) / corrosionRate → EOL = startDate + totalLife
- **With inspection date only**: Remaining life = (remainingThickness - minRequired) / corrosionRate → EOL = inspectionDate + remainingLife

Safe date handling prevents overflow (caps at 9999-12-31) and gracefully handles invalid/infinite results.

---

## 7. Frontend Dashboard — Next.js

### 7.1 Page Structure

**Landing Page (`/`)** — Marketing/introduction page for the platform.

**Authentication (`/login`, `/register`)** — JWT-based login and registration.

**Dashboard (`/dashboard`)** — Overview with summary statistics:
- Total datasets uploaded
- Total analysis runs completed
- Critical findings count (runs where AD test failed)

**Dataset Management (`/dashboard/datasets`)** — Upload CSV files, view dataset inventory, trigger analysis.

**Analysis List (`/dashboard/analysis`)** — Table of all EVA runs with status, dataset name, parameters, and timestamps.

**Results Page (`/dashboard/analysis/[id]`)** — The main results display. This is the most complex page in the application.

**Report Page (`/dashboard/analysis/[id]/report`)** — Printable/PDF report format.

### 7.2 The Results Page — In Detail

The results page displays the complete EVA analysis output across several sections:

#### Engineering Summary Metrics (top row)
Four cards showing:
- Original Thickness (mm)
- Minimum Required Thickness (mm)
- Service Entry Date
- Last Inspection Date

#### Reliability Forecasting Table (General Format)
A table mapping API RBI effectiveness levels to confidence intervals:

| Category | Confidence | Max Wall Loss | Rem. Thickness | Corrosion Rate | Predicted EOL |
|----------|-----------|---------------|----------------|----------------|--------------|
| A | 99% | (computed) | (computed) | (computed) | (computed) |
| B | 95% | ... | ... | ... | ... |
| C | 90% | ... | ... | ... | ... |
| D | 80% | ... | ... | ... | ... |

This table uses the return level for the total population (N = total tubes) and shows the upper bound of wall loss at each confidence level (which is the conservative estimate from a wall loss perspective).

#### Asset Life & EOL Forecast (Excel Format)
A second table formatted to match the industrial Excel template, showing remaining thickness, corrosion rate, and EOL for each RBI level.

#### Return Level Forecast Chart
An interactive Recharts `ComposedChart` with:
- Smooth Gumbel prediction curve (blue line)
- Scatter points at exact requested return periods
- Reference line at N = total population
- Log-scale x-axis (return period)
- Linear y-axis (wall loss in mm)

#### Statistical Integrity & Probability Plots
Side-by-side:
- **Gumbel Q-Q Plot** — Observed vs. theoretical quantiles with fitted line
- **CDF Plot** — Empirical vs. theoretical CDF comparison
- **AD Test Badge** — Green "Fit Validated" or red "Fit Rejected" based on `run.adPassed`

#### Methodology Compliance Sidebar
A checklist confirming:
- ✅ Gumbel Distribution (mandatory for mechanical integrity per PVP2006)
- ✅ MLE Parameter Estimation (Eq. 10)
- ✅ Analytical CI — Eq. 15-16 (SE + Student's t)
- ✅ Lower Bound Reporting (x_N − t·SE, conservative)

Model parameters displayed: λ (location), δ (scale), sample size n.

#### Engineering Assessment Panel
A dynamic text panel that changes based on AD test results:

**If AD passed**: "The statistical fit is VALIDATED. The Anderson-Darling (AD) statistic is within acceptable limits, confirming that the Gumbel distribution accurately models the tail risk for this asset's corrosion profile."

**If AD failed**: "The statistical fit is REJECTED. The AD statistic (value) significantly exceeds the critical threshold (0.757), indicating that the tail distribution does not match the observed extreme wall loss values."

Also shows KS test interpretation and engineering recommendations.

#### Tube Sheet Layout Map
A visual SVG grid showing the tube sheet layout with color-coded wall loss severity.

#### Detailed Ranked Observations Table
A paginated table (15 rows per page) showing every single data point with:
- Rank, observed wall loss, probability Pᵢ, reduced variate yᵢ
- ln(PDF), fitted wall loss, max wall loss, min remaining thickness
- Standard error, and CI ranges at 80%, 90%, 95%, 99%

---

## 8. Anderson-Darling Goodness-of-Fit Testing — The Complete Picture

### 8.1 Why Goodness-of-Fit Testing Matters

The entire EVA methodology rests on a single critical assumption:

> **The maximum wall loss values follow the Gumbel extreme value distribution.**

If this assumption is wrong, then:
- The return level estimates (x_N) are unreliable
- The confidence intervals are meaningless
- The EOL predictions could be dangerously wrong
- Integrity decisions based on these results could lead to equipment failure

The Anderson-Darling (AD) test is a **statistical hypothesis test** that answers:

> *"Is there sufficient statistical evidence to reject the hypothesis that this data came from a Gumbel distribution?"*

The test works by comparing the **empirical CDF** (step function of observed data) against the **theoretical CDF** (the fitted Gumbel distribution). If they are "too different," the Gumbel assumption is rejected.

### 8.2 The AD Formula

The Anderson-Darling statistic is:

$$A^2 = -n - \frac{1}{n} \sum_{i=1}^{n} (2i-1) \left[\ln F(x_{(i)}) + \ln\left(1 - F(x_{(n+1-i)})\right)\right]$$

where:
- n = sample size
- x₍₁₎ < x₍₂₎ < ... < x₍ₙ₎ = data sorted ascending
- F(x) = Gumbel CDF with estimated parameters (μ̂, β̂)
- ln = natural logarithm

**How this formula works, step by step:**

1. Sort the data ascending: x₍₁₎ ≤ x₍₂₎ ≤ ... ≤ x₍ₙ₎
2. Compute the theoretical CDF value for each data point: F(x₍ᵢ₎) = Gumbel CDF at x₍ᵢ₎
3. For each rank i from 1 to n, compute:
   - ln F(x₍ᵢ₎) — how well the lower tail fits
   - ln(1 - F(x₍ₙ₊₁₋ᵢ₎)) — how well the upper tail fits (reversed index)
4. Weight by (2i-1)/n — this gives more weight to observations that fall in the tails
5. Sum everything and subtract n

The **weight function** ψ(u) = 1/[u(1-u)] embedded in this formula makes the AD test particularly sensitive to **tail discrepancies** — which is exactly what matters for extreme value analysis. This is the key advantage of AD over other GoF tests like Cramér-von Mises or Kolmogorov-Smirnov.

### 8.3 Modified AD Statistic (AD*)

For small sample sizes, a correction factor is applied:

$$AD^* = \left(1 + \frac{0.2}{\sqrt{n}}\right) \cdot AD$$

This adjustment compensates for the finite-sample behavior of the test statistic.

### 8.4 Decision Rule

**For Normal/Lognormal distributions** (A_DTest.md):
- Reject if AD > CV, where CV = 0.752 / (1 + 0.75/n + 2.25/n²)

**For Weibull/Exponential distributions** (A_DTest.md):
- Compute AD* and OSL (Observed Significance Level / p-value):
  $$OSL = \frac{1}{1 + \exp[-0.1 + 1.24\ln(AD^*) + 4.48 \cdot AD^*]}$$
- Reject if OSL < α (typically 0.05)

**For Gumbel distribution** (Gumbel_GOF_2012.md):
- Compare AD against sample-size-dependent critical values from the 2012 comparative study (Table 1)
- AD test is the most powerful GoF test for Gumbel among 6 competitors tested

### 8.5 Known vs. Estimated Parameters — A Critical Distinction

The original Anderson-Darling 1954 paper gives asymptotic critical values assuming the distribution parameters are **fully known** (not estimated from data):
- 10%: 1.933
- 5%: 2.492
- 1%: 3.857

However, Anderson's 2010 review paper explicitly states:

> *"When parameters in the tested distribution are not known, but are estimated efficiently, the covariance is modified... The percentage points for these tests are much smaller than those given above for the case when parameters are known."*

Since we estimate μ and β from the data via MLE, we must use the **estimated-parameter critical values**, which are much smaller. The 2012 Gumbel GoF paper provides these values for the Gumbel distribution with MLE estimation:

| Sample Size (n) | α=0.20 | α=0.15 | α=0.10 | α=0.05 | α=0.01 |
|-----------------|--------|--------|--------|--------|--------|
| 10 | 0.554 | 0.607 | 0.683 | 0.815 | 1.118 |
| 30 | 0.507 | 0.558 | 0.628 | 0.747 | 1.019 |
| 100 | 0.511 | 0.562 | 0.632 | 0.752 | 1.029 |

### 8.6 Why AD Is the Best Test for Gumbel

The 2012 comparative study (Gumbel_GOF_2012.md) tested 6 different GoF tests:
1. **Anderson-Darling (AD)** ← WINNER
2. Modified Anderson-Darling (B²)
3. Cramér-von Mises (CVM)
4. Zhang Anderson-Darling (ZAD)
5. Zhang Cramér-von Mises (ZCVM)
6. Liao-Shimokawa (Lₙ)

Each test was evaluated by generating 10,000 samples from 6 alternative distributions (Normal, χ², Cauchy, Beta, Exponential, Logistic) and measuring the rejection rate when tested against Gumbel critical values.

**Results**: AD had the highest average rejection rates across all sample sizes and significance levels, making it the most powerful test. The only exception was for very small samples (n=10), where ZCVM slightly outperformed.

### 8.7 The Complete AD Workflow

This is the full workflow as shown in the [AD workflow diagram](file:///e:/saddam/AD/media_image1.png):

```
START
  │
  ▼
INPUT DATA: x₁, x₂, ..., xₙ + significance level (α)
  │
  ▼
DATA VALIDATION
  ├── Numeric? n ≥ minimum? In domain?
  ├── NO → STOP (show error)
  └── YES ↓
  │
  ▼
SORT DATA: x₁ ≤ x₂ ≤ ... ≤ xₙ
  │
  ▼
SELECT DISTRIBUTION(s) to test
  ├── Normal → estimate μ, σ → compute Φ(Zᵢ) → AD statistic → compare AD vs CV
  ├── Lognormal → log-transform → apply Normal AD test on log(xᵢ)
  ├── Weibull → estimate α, β → compute F(xᵢ) = 1-exp(-Zᵢ) → AD → AD* → OSL
  ├── Exponential → special case of Weibull with β=1
  └── Gumbel → estimate μ, β → compute F(xᵢ) → AD → compare vs sample-size CV
  │
  ▼
DECISION
  ├── AD > CV (or OSL < α) → REJECT H₀ → Distribution NOT supported
  └── AD ≤ CV (or OSL ≥ α) → DO NOT REJECT H₀ → Distribution accepted
  │
  ▼
MORE DISTRIBUTIONS TO TEST?
  ├── YES → test next distribution
  └── NO → proceed to model selection
  │
  ▼
FINAL EVA MODEL (best fitting distribution)
```

### 8.8 Connection to the Buried Object Detection Paper

The Buried Object Detection paper (Buried_Object_Detection_Using_Gumbel_Goodness_of_Fit.md) provides real-world validation that Gumbel GoF testing works as a practical tool. In ground-penetrating radar applications, the researchers used the observation that the A-scan signal histogram changes from symmetric (no object) to skewed/Gumbel-shaped (object present). By measuring the goodness-of-fit to Gumbel, they achieved 94.3% detection rate with only 0.9% false alarms — demonstrating that Gumbel GoF testing can be a reliable decision-making tool.

---

## 9. Current AD Implementation and Identified Gaps

### 9.1 What Exists Today

The current AD implementation lives in [diagnostics.py](file:///e:/saddam/eva-engine/app/statistics/diagnostics.py):

```python
def anderson_darling_gumbel(data, mu, beta):
    n = len(data)
    x_sorted = np.sort(data)
    F = gumbel_cdf(x_sorted, mu, beta)
    F = np.clip(F, 1e-10, 1 - 1e-10)   # prevent log(0)

    i = np.arange(1, n + 1)
    ad_sum = np.sum((2 * i - 1) * (np.log(F) + np.log(1 - F[::-1])))
    A2 = -n - (1.0 / n) * ad_sum

    critical_value = 0.757              # hardcoded single value
    passed = A2 < critical_value

    return {
        "ad_statistic": float(A2),
        "ad_critical_value": critical_value,
        "ad_passed": bool(passed),
    }
```

**What's correct:**
- ✅ The AD formula is correctly implemented
- ✅ Data is sorted ascending before computation
- ✅ CDF values are clipped to avoid log(0)
- ✅ The Gumbel CDF is used (not Normal or Weibull)
- ✅ Results are stored in the database and displayed on the frontend

### 9.2 What's Wrong or Missing

| Gap | Description | Impact |
|-----|------------|--------|
| **Hardcoded critical value** | Uses 0.757 regardless of sample size. The 2012 paper shows CV at α=0.05 is 0.815 for n=10, 0.747 for n=30, and 0.752 for n=100. | For small samples (n=10-20, the most common in practice), the test is too strict — it may incorrectly reject valid Gumbel fits |
| **No p-value** | Only provides pass/fail, not the probability of observing this AD value if Gumbel were true | Engineers cannot assess "how good" or "how bad" the fit is — only whether it crosses a binary threshold |
| **No modified AD (AD\*)** | Missing the finite-sample correction AD* = (1 + 0.2/√n)·AD | Less accurate for small samples |
| **Single significance level** | Only tests at α=0.05 | Some applications may warrant α=0.10 (less conservative test) or α=0.01 (more conservative) |
| **No multi-level critical values** | Doesn't report CVs at α = 0.01, 0.05, 0.10, 0.15, 0.20 | Cannot show which significance levels would pass/fail |
| **Sparse frontend display** | Only shows a pass/fail badge and a text blurb | Does not show the AD statistic value, CV, or any quantitative detail in the sidebar |
| **No dedicated tests** | No test cases using known data from the reference papers | Cannot verify correctness of the implementation |

---

## 10. Planned AD Enhancements — What Will Change

### 10.1 Python Engine Changes

#### Enhanced `diagnostics.py`

The `anderson_darling_gumbel()` function will be rewritten to include:

1. **Sample-size-dependent critical values** — An interpolation table built from the 2012 Gumbel GoF paper, supporting n = 5 through n = 300+ with linear interpolation between known points (n=10, 30, 100).

2. **Modified AD statistic** — AD* = (1 + 0.2/√n) · AD for finite-sample correction.

3. **P-value computation** — Via Monte Carlo simulation: generate 10,000 Gumbel samples with the estimated parameters, compute AD for each, and determine what fraction exceeds the observed AD. This gives a true p-value.

4. **Multi-level critical values** — Report the CV at α = 0.01, 0.05, 0.10, 0.15, 0.20 so the user can see how the result compares across significance levels.

5. **Interpretation text** — Generate a human-readable summary based on the p-value:
   - p ≥ 0.15: "Strong evidence supports the Gumbel fit"
   - 0.05 ≤ p < 0.15: "The Gumbel fit is acceptable but marginal"
   - p < 0.05: "The Gumbel distribution is rejected for this data"

#### Updated `schemas.py`

The `GoodnessOfFit` response model will expand to include: `ad_star`, `ad_p_value`, `ad_critical_values` (dict), `ad_significance_level`, and `ad_interpretation`.

#### Updated `eva_service.py`

The orchestrator will pass the new enriched AD results into the response.

### 10.2 Backend Changes

#### Database Migration

New columns added to the `eva_runs` table:
- `ad_star` (Float?) — Modified AD statistic
- `ad_p_value` (Float?) — Monte Carlo p-value
- `ad_critical_value` (Float?) — CV at primary significance level

#### `eva.service.ts` Update

The result storage logic will persist the new AD fields alongside the existing ones.

### 10.3 Frontend Changes

#### Results Page Enhancements

The simple pass/fail badge will be replaced with a rich **AD Results Card** showing:

- **P-value indicator bar** — Color-coded from green (p ≥ 0.15) through yellow (0.05 ≤ p < 0.15) to red (p < 0.05)
- **AD statistic and AD\*** — Numerical values displayed
- **Critical value** — Sample-size-adjusted, not hardcoded
- **Multi-level summary** — Visual showing which α levels would pass/fail
- **Dynamic interpretation** — Specific text based on p-value ranges, not just pass/fail

The Engineering Assessment sidebar will provide richer recommendations:
- When AD passes: "Proceed with current RBI intervals"
- When AD marginally passes: "Consider increasing sample size for more reliable validation"
- When AD fails: "Investigate possible causes: outliers, mixed populations, non-stationary corrosion. Consider inspecting additional tubes or segmenting the population"

### 10.4 Test Suite

A new `test_ad.py` file will validate the implementation against:
- Known datasets from the reference papers (Table 1 from A_DTest.md)
- Synthetic Gumbel data (should pass)
- Non-Gumbel data (Normal, Exponential — should fail)
- Edge cases (n=5, n=300+, heavy-tailed data)
- Critical value validation via Monte Carlo (verify rejection rates match expected α levels)

---

## 11. Future Roadmap

### Near-Term (After AD Enhancement)

| Feature | Description |
|---------|-------------|
| **Multi-distribution AD testing** | Test Gumbel, Normal, Lognormal, Weibull, Exponential, and let the user see which distributions pass |
| **Automatic distribution selection** | Use AIC/BIC information criteria to automatically select the best-fitting distribution |
| **QQ plot with CI bands** | Add confidence bands to the Q-Q probability plot |
| **PP plot** | Add a probability-probability plot alongside the Q-Q plot |

### Medium-Term

| Feature | Description |
|---------|-------------|
| **GEV distribution support** | Generalized Extreme Value distribution with shape parameter ξ |
| **Weibull distribution support** | For failure-time and reliability data |
| **POT (Peaks Over Threshold)** | Alternative to block maxima approach, using the Generalized Pareto Distribution |
| **Bootstrap CI as secondary validation** | Run bootstrap alongside analytical CI for cross-validation |
| **Outlier detection** | Statistical methods to identify and flag potential outliers before EVA |

### Long-Term (Enterprise)

| Feature | Description |
|---------|-------------|
| **Bayesian EVA** | Probabilistic inference using PyMC/Stan with prior distributions |
| **Time-series corrosion modeling** | Model corrosion rate changes over time |
| **Fleet-level analysis** | Analyze multiple heat exchangers simultaneously |
| **Real-time sensor integration** | Continuous monitoring and automatic EVA updates |
| **Regulatory compliance reporting** | Auto-generate reports compliant with API 510, 570, 653 standards |

---

*This document describes the EVA Platform as of August 2026. The AD enhancement (Section 10) is planned and awaiting approval.*
